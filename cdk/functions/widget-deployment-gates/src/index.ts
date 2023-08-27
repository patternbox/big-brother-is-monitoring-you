import * as oam from '@aws-sdk/client-oam'
import * as sts from '@aws-sdk/client-sts'
import * as ddb from '@aws-sdk/client-dynamodb'
import * as cw from '@aws-sdk/client-cloudwatch'

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

enum GateState {
    OPEN,
    CLOSED,
}

interface DeploymentGate {
    GateName: string,
    GateState: GateState,
    GateComment?: string,
}

const fetchCrossAccountGateStates = async (credentials: sts.Credentials): Promise<DeploymentGate[]> => {
    return [
        {
            GateName: 'infra',
            GateState: GateState.CLOSED,
        }
    ]
}

const deploymentGatesAsHtml = (deploymentGates: DeploymentGate[]): string => {
    let html = ''

    for (const gate of deploymentGates) {
        //const alarmLink = `<a target="_blank" href="${alarmArnAsHref(alarm.AlarmArn!)}">${alarm.AlarmName}</a>`
        html += `<li>${gate.GateName}</li>`
    }

    return html
}

export const handler = async (_event: any): Promise<string> => {
    let html = ''
    const linkedSourceAcounts = await fetchLinkedSourceAccounts()

    for (const linkedAccount of linkedSourceAcounts) {
        const crossAccountId = linkedAccount.LinkArn!.split(':')[4]
        const crossAccountCredentials = await assumeCrossAccountCredentials(crossAccountId)


        const deploymentGates = await fetchCrossAccountGateStates(crossAccountCredentials)
        const deploymentGatesHtml = deploymentGatesAsHtml(deploymentGates)
        html += `<li>${linkedAccount.Label} (${crossAccountId})<ul>${deploymentGatesHtml}</ul></li>`
    }

    console.log(html)
    return `<ul>${html}</ul>`
}

export const localHandler = async (event: any): Promise<any> => {

    return {
        'body': await handler(event),
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=UTF-8',
        },
    }
}
