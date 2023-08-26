import { CfnParameter } from 'aws-cdk-lib'
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs/lib/function'
import { CustomWidgetStack } from './custom-widget-stack'

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
            },
        }
    }
}
