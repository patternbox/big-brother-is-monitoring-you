import * as oam from '@aws-sdk/client-oam'
import * as sts from '@aws-sdk/client-sts'
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

const fetchCrossAccountAlarms = async (credentials: sts.Credentials): Promise<cw.MetricAlarm[]> => {
    const awsCredentialIdentity = {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken,
    }
    const cwClient = new cw.CloudWatchClient({ credentials: awsCredentialIdentity })
    const command = new cw.DescribeAlarmsCommand({
    })
    const response = await cwClient.send(command)
    return response.MetricAlarms!
}

const alarmArnAsHref = (alarmArn: string): string => {
    const arnParts = alarmArn.split(':')
    const region = arnParts[3]
    const accountId = arnParts[4]
    const alarmName = arnParts[6]
    return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:alarm/${alarmName}?accountId=${accountId}`
}

const metricAlarmsAsHtml = (metricAlarms: cw.MetricAlarm[]): string => {
    let html = ''

    for (const alarm of metricAlarms) {
        const alarmLink = `<a target="_blank" href="${alarmArnAsHref(alarm.AlarmArn!)}">${alarm.AlarmName}</a>`
        html += `<li>${alarmLink}<br>${alarm.AlarmDescription}</li>`
    }

    return html
}

export const handler = async (_event: any): Promise<string> => {
    let html = ''
    const linkedSourceAcounts = await fetchLinkedSourceAccounts()

    for (const linkedAccount of linkedSourceAcounts) {
        const crossAccountId = linkedAccount.LinkArn!.split(':')[4]
        const crossAccountCredentials = await assumeCrossAccountCredentials(crossAccountId)
        const metricAlarms = await fetchCrossAccountAlarms(crossAccountCredentials)
        const metricAlarmsHtml = metricAlarmsAsHtml(metricAlarms)
        html += `<li>${linkedAccount.Label} (${crossAccountId})<ul>${metricAlarmsHtml}</ul></li>`
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
