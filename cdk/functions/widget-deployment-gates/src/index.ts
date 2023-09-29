import * as oam from '@aws-sdk/client-oam'
import * as sts from '@aws-sdk/client-sts'
import * as ddb from '@aws-sdk/client-dynamodb'

import { ScanCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Context } from 'aws-lambda'
//import { readFileSync } from 'fs'
import { promises as fs } from 'fs'

// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-oam/
const oamClient = new oam.OAMClient({});
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_sts_code_examples.html
const stsClient = new sts.STSClient({});

const fetchLinkedSourceAccounts = async (): Promise<oam.ListAttachedLinksItem[]> => {
    const command = new oam.ListAttachedLinksCommand({
        SinkIdentifier: process.env.MONITORING_SINK_ARN,
    })
    const response = await oamClient.send(command)
    return response.Items!
}

const assumeCrossAccountCredentials = async (accountId: string): Promise<sts.Credentials> => {
    const crossAccountRoleArn = `arn:aws:iam::${accountId}:role/DynamoDB-CrossAccountSharingRole`
    const command = new sts.AssumeRoleCommand({
        RoleArn: crossAccountRoleArn,
        RoleSessionName: 'cross-account-session',
        DurationSeconds: 900,
    })
    const response = await stsClient.send(command)
    return response.Credentials!
}

interface DeploymentGate {
    GateName: string,
    GateClosed: boolean,
    GateComment: string,
}

const fetchCrossAccountGateStates = async (credentials: sts.Credentials): Promise<DeploymentGate[]> => {
    const awsCredentialIdentity = {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken,
    }
    const ddbClient = new ddb.DynamoDBClient({ credentials: awsCredentialIdentity })
    const docClient = DynamoDBDocumentClient.from(ddbClient);
    const command = new ScanCommand({
        TableName: process.env.DEPLOYMENT_GATES_TABLE,
    })
    const response = await docClient.send(command)
    // [{"closed":false,"gate-name":"infrastructure","reason":""},{"closed":false,"gate-name":"application","reason":""}]
    // console.log(JSON.stringify(response.Items))
    return response.Items!.map(record => {
        return {
            GateName: record['gate-name'],
            GateClosed: record['closed'],
            GateComment: record['reason'] || '',
        }
    })
}

// https://github.com/aws-samples/cloudwatch-custom-widgets-samples#cwdb-action-examples
const deploymentGateAsForm = (deploymentGate: DeploymentGate, elementId: string, lambdaFunctionArn: string, isModified: boolean): string => {
    /*
    <div class="gate modified">
        <form>
        <label class="comment">Application</label>
        <input type="text" name="123-gate-comment" value="Gate-Comment-123" size="50">
        <label class="switch">
            <input type="checkbox" name="123-gate-open">
            <span class="slider"></span>
        </label>
        <a class="btn">OK</a>
        </form>
        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">{ "identifier": "123" }</cwdb-action>
    </div>
    */

    const gateLabel = `<label class="comment">${deploymentGate.GateName}</label>`
    const gateComment = `<input type="text" name="text-${elementId}" value="${deploymentGate.GateComment}" size="50">`
    const gateToggle = `<label class="switch"><input type="checkbox" name="toggle-${elementId}"><span class="slider"></span></label>`

    const htmlForm = `<form>${gateLabel}${gateComment}${gateToggle}<a class="btn">OK</a></form>`
    const cwdbAction = `<cwdb-action display="my-widget" action="call" endpoint="${lambdaFunctionArn}">{ "identifier": "${elementId}" }</cwdb-action>`
    const modifiedClass = isModified ? ' modified' : ''
    return `<div class="gate ${modifiedClass}">${htmlForm}${cwdbAction}</div>`
}

// https://catalog.workshops.aws/observability/en-US/aws-native/dashboards/custom-widgets/other-sources/display-results
const deploymentGatesAsHtml = (deploymentGates: DeploymentGate[], idPrefix: string, lambdaFunctionArn: string): string => {
    return deploymentGates
        .map((gate) => `<li>${deploymentGateAsForm(gate, `${idPrefix}-${gate.GateName}`, lambdaFunctionArn, true)}</li>`)
        .join('\n')
}

const css = async (): Promise<string> => {
    return await fs.readFile('./style.css', 'utf-8')
}

interface ContextLight {
    invokedFunctionArn: string
}

export const handler = async (_event: any, context?: Context|ContextLight): Promise<string> => {
    let html = ''
    const linkedSourceAcounts = await fetchLinkedSourceAccounts()

    for (const linkedAccount of linkedSourceAcounts) {
        const crossAccountId = linkedAccount.LinkArn!.split(':')[4]
        const crossAccountCredentials = await assumeCrossAccountCredentials(crossAccountId)
        const deploymentGates = await fetchCrossAccountGateStates(crossAccountCredentials)
        const deploymentGatesHtml = deploymentGatesAsHtml(deploymentGates, crossAccountId, context!.invokedFunctionArn)
        const accountText = `${linkedAccount.Label} (${crossAccountId})`
        html += `<li class="account">${accountText}<ul>${deploymentGatesHtml}</ul></li>`
    }

    console.log(JSON.stringify(_event, null, 3))
    // console.log(JSON.stringify(_event.widgetContext.forms, null, 3))

    return `<style>${await css()}</style><ul>${html}</ul>`
}

export const localHandler = async (event: any): Promise<any> => {

    return {
        'body': await handler(event, { invokedFunctionArn: 'arn:aws:lambda:local:123456789012:function:deployment-gates' }),
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=UTF-8',
        },
    }
}
