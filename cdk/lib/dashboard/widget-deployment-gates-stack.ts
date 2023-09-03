import { CfnParameter } from 'aws-cdk-lib'
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs/lib/function'
import { CustomWidgetStack } from './custom-widget-stack'

import * as iam from 'aws-cdk-lib/aws-iam'

export class WidgetDeploymentGatesStack extends CustomWidgetStack {

    customizeFunctionProps(functionProps: NodejsFunctionProps): NodejsFunctionProps {

        const monitoringSinkArn = new CfnParameter(this, 'MonitoringSinkArn', {
          type: 'String',
          description: 'The monitoring sink ARN',
        }).valueAsString

        return { ...functionProps,
            environment: {
                ...functionProps.environment,
                MONITORING_SINK_ARN: monitoringSinkArn,
                DEPLOYMENT_GATES_TABLE: 'cicd-pipeline-deployment-gates',
            },
        }
    }

    getCrossAccountPolicy(functionName: string): iam.PolicyDocument {
        return new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    actions: [
                        'sts:AssumeRole',
                    ],
                    resources: [
                        'arn:aws:iam::*:role/DynamoDB-CrossAccountSharingRole',
                    ],
                }),
            ],
        })
    }
}
