import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import * as cw from 'aws-cdk-lib/aws-cloudwatch'

export interface MonitoringDashboardStackProps extends StackProps {
    stackPrefix: string,
}

export class MonitoringDashboardStack extends Stack {

    constructor(scope: Construct, id: string, props: MonitoringDashboardStackProps) {
        super(scope, id, props)

        /*const widgetHello = new cw.CustomWidget({
            functionArn: this.getCustomWidgetArn(props, 'widget-hello'),
            title: 'Hello',
        })*/

        const widgetAlarms = new cw.CustomWidget({
            functionArn: this.getCustomWidgetArn(props, 'widget-alarms'),
            title: 'Alarm List',
            width: 10,
            height: 8,
        })

        const widgetSandbox = new cw.CustomWidget({
            functionArn: this.getCustomWidgetArn(props, 'widget-sandbox'),
            title: 'Sandbox',
            width: 16,
            height: 8,
        })

        const widgetGates = new cw.CustomWidget({
            functionArn: this.getCustomWidgetArn(props, 'widget-deployment-gates'),
            title: 'Deployment Gates',
            width: 14,
            height: 8,
            params: {
                hello: 'Hello Custom Widget'
            }
        })

        new cw.Dashboard(this, 'Dashboard', {
            dashboardName: 'My-Monitoring-Dashboard',
            widgets: [
                [
                    //widgetAlarms,
                    //widgetGates,
                    widgetSandbox,
                ],
            ],
        })
    }

    private getCustomWidgetArn(props: MonitoringDashboardStackProps, functionName: string): string {
        return `arn:aws:lambda:${this.region}:${this.account}:function:${props.stackPrefix}-${functionName}`
    }
}
