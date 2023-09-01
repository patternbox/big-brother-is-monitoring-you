import * as oam from '@aws-sdk/client-oam'
import * as sts from '@aws-sdk/client-sts'
import * as ddb from '@aws-sdk/client-dynamodb'

import { ScanCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { Context } from 'aws-lambda'

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
const deploymentGateAsForm = (deploymentGate: DeploymentGate, lambdaFunctionArn: string): string => {
    const gateComment = `<input name="comment" value="${deploymentGate.GateComment}" size="20">`
    const gateToggle = `<input type="checkbox" name="favorite_pet" value="Cats">`
    const execButton = `<a class="btn">Execute</a>`
    const htmlForm = `<form>${gateComment}${gateToggle}${execButton}</form>`
    const cwdbAction = `<cwdb-action action="call" endpoint="${lambdaFunctionArn}" />`
    return `${htmlForm}${cwdbAction}`
}

// https://catalog.workshops.aws/observability/en-US/aws-native/dashboards/custom-widgets/other-sources/display-results
const deploymentGatesAsHtml = (deploymentGates: DeploymentGate[], lambdaFunctionArn: string): string => {
    return deploymentGates
        .map((gate) => `<li>${deploymentGateAsForm(gate, lambdaFunctionArn)}</li>`)
        .join('\n')
}

interface ContextLight {
    invokedFunctionArn: string
}

export const handler = async (_event: any, context?: any /*|ContextLight*/): Promise<string> => {
    let html = ''
    const linkedSourceAcounts = await fetchLinkedSourceAccounts()

    for (const linkedAccount of linkedSourceAcounts) {
        const crossAccountId = linkedAccount.LinkArn!.split(':')[4]
        const crossAccountCredentials = await assumeCrossAccountCredentials(crossAccountId)
        const deploymentGates = await fetchCrossAccountGateStates(crossAccountCredentials)
        const deploymentGatesHtml = deploymentGatesAsHtml(deploymentGates, context!.invokedFunctionArn)
        html += `<li>${linkedAccount.Label} (${crossAccountId})<br />&nbsp;<ul>${deploymentGatesHtml}</ul></li>`
    }

    //console.log(html)
    return `<ul>${html}</ul>`
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
