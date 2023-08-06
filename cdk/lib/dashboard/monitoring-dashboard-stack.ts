import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import * as cw from 'aws-cdk-lib/aws-cloudwatch'

export interface MonitoringDashboardStackProps extends StackProps {
    stackPrefix: string,
}

export class MonitoringDashboardStack extends Stack {

    constructor(scope: Construct, id: string, props: MonitoringDashboardStackProps) {
        super(scope, id, props)

        const widgetHello= new cw.CustomWidget({
            functionArn: this.getCustomWidgetArn(props, 'widget-hello'),
            title: 'Hello',
        })

        new cw.Dashboard(this, 'Dashboard', {
            dashboardName: 'My_Monitoring_Dashboard',
            widgets: [
                [
                    widgetHello,
                ],
            ],
        })
    }

    private getCustomWidgetArn(props: MonitoringDashboardStackProps, functionName: string): string {
        return `arn:aws:lambda:${this.region}:${this.account}:function:${props.stackPrefix}-${functionName}`
    }
}
