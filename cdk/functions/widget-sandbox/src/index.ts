
const displayResults = async (context) => {
    return `
        <form><table>
            <tr>
                <td>Log Groups</td><td><input name="logGroups" value="LOG_GROUPS" size="100"></td>
            </tr><tr>
                <td valign=top>Query</td><td><textarea name="query" rows="2" cols="80">QUERY</textarea></td>
            </tr>
        </table></form>
        <a class="btn btn-primary">Run query</a>
        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}"></cwdb-action>
        <a class="btn">Reset to original query</a>
        <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">
            { "resetQuery": true }
        </cwdb-action>
    `
}

interface ContextLight {
    invokedFunctionArn: string
}

export const handler = async (_event: any, context?: Context|ContextLight): Promise<string> => {

    /*const widgetContext = event.widgetContext
    const form = widgetContext.forms.all
    const logGroups = form.logGroups || event.logGroups
    const region = widgetContext.params.region || event.region || process.env.AWS_REGION
    const timeRange = widgetContext.timeRange.zoom || widgetContext.timeRange
    const logsClient = new aws.CloudWatchLogs({ region })
    const resetQuery = event.resetQuery*/

    console.log(JSON.stringify(_event, null, 3))

    return await displayResults(context)
}

export const localHandler = async (event: any): Promise<any> => {

    return {
        'body': await handler(event, { invokedFunctionArn: 'arn:aws:lambda:local:123456789012:function:widget-sandbox' }),
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html charset=UTF-8',
        },
    }
}
