// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

// CloudWatch Custom Widget sample: simple hello world, takes optional 'name' as a parameter

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

const DOCS = `
## Hello World
The basic starter "hello world" widget.  Takes one optional parameter, **name**.

### Widget parameters
Param | Description
---|---
**name** | The name to greet (optional)

### Example parameters
\`\`\` yaml
name: widget developer
\`\`\`
`

export const handler = async (event: any): Promise<string> => {

    if (event.describe) {
        return DOCS   
    }

    const name = event.name || 'friend'
    return `<h1>Hello ${name}</h1>`
}

export const localHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {

    return {
        'body': await handler(event),
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/html; charset=UTF-8',
        },
    }
}
