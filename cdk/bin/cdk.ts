#!/usr/bin/env node

import { App, Tags } from 'aws-cdk-lib'
import { MonitoringSinkStack } from '../lib/oam/monitoring-sink-stack'
import { MonitoringLinkStack } from '../lib/oam/monitoring-link-stack'
import { WidgetHelloStack } from '../lib/dashboard/widget-hello-stack'
import { WidgetAlarmsStack } from '../lib/dashboard/widget-alarms-stack'
import { WidgetDeploymentGatesStack } from '../lib/dashboard/widget-deployment-gates-stack'
import { MonitoringDashboardStack } from '../lib/dashboard/monitoring-dashboard-stack'

const STACK_PREFIX = 'cicd-monitoring'

const app = new App()

Tags.of(app).add('project', 'Big brother is monitoring you')

new MonitoringSinkStack(app, 'MonitoringSink', {
    stackName: `${STACK_PREFIX}-sink`,
})

new MonitoringLinkStack(app, 'MonitoringLink', {
    stackName: `${STACK_PREFIX}-link`
})

new WidgetHelloStack(app, 'WidgetHello', {
    stackName: `${STACK_PREFIX}-widget-hello`,
    widgetName: 'widget-hello',
})

new WidgetAlarmsStack(app, 'WidgetAlarms', {
    stackName: `${STACK_PREFIX}-widget-alarms`,
    widgetName: 'widget-alarms',
})

new WidgetDeploymentGatesStack(app, 'WidgetDeploymentGates', {
    stackName: `${STACK_PREFIX}-widget-deployment-gates`,
    widgetName: 'widget-deployment-gates',
})

new MonitoringDashboardStack(app, 'MonitoringDashboard', {
    stackName: `${STACK_PREFIX}-dashboard`,
    stackPrefix: STACK_PREFIX,
})
