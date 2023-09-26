import { Context } from 'aws-lambda'
import { promises as fs } from 'fs'

const displayResults = async (context: Context|ContextLight) => {
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

const displayResults2 = async (context: Context|ContextLight) => {
    return `
        <style>
            .table { display: table; }
            .table > *:not(cwdb-action) { display: table-row; }
        </style>

        <div class="table">
            <form>
                <div><label>Infrastructure</label><input type="text" name="123-gate-comment " value="Gate-Comment-123" size="20"></div>
                <div><label class="switch"><input type="checkbox" name="123-checkbox"><span class="slider"></span></label></div>
            </form>
            <a class="btn">OK</a>
            <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">{ "identifier": "12345" }</cwdb-action>

            <form>
                <div><label>Chat-Application</label><input type="text" name="678-logGroups" value="LOG_GROUPS" size="20"></div>
                <div><label class="switch"><input type="checkbox" name="678-checkbox"><span class="slider"></span></label></div>
            </form>
            <a class="btn">OK</a>
            <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">{ "identifier": "67890" }</cwdb-action>

        </div>
    `
}

const css = async (): Promise<string> => {
    return await fs.readFile('./style.css', 'utf-8')
}

const displayResults3 = async (context: Context|ContextLight) => {
    const style = await css()
    return `
        <style>${style}</style>

        <div class="gate">
            <form>
            <label class="comment">Chat</label>
            <input type="text" name="xyz-gate-comment" value="Gate-Comment-xyz" size="50">
            <label class="switch">
                <input type="checkbox" name="xyz-gate-open">
                <span class="slider"></span>
            </label>
            <a class="btn">OK</a>
            </form>
            <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">{ "identifier": "xyz" }</cwdb-action>
        </div>

        <div class="gate">
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

        <div class="gate">
            <form>
            <label class="comment">Chat-Application-678</label>
            <input type="text" name="678-gate-comment" value="Gate-Comment-678" size="50">
            <label class="switch">
                <input type="checkbox" name="678-gate-open">
                <span class="slider"></span>
            </label>
            <a class="btn">OK</a>
            </form>
            <cwdb-action action="call" endpoint="${context.invokedFunctionArn}">{ "identifier": "678" }</cwdb-action>
        </div>
    `
}

interface ContextLight {
    invokedFunctionArn: string
}

export const handler = async (_event: any, context: Context|ContextLight): Promise<string> => {

    console.log(JSON.stringify(_event, null, 3))

    return await displayResults3(context)
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
