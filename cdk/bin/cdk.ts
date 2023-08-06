#!/usr/bin/env node

import { App, Tags } from 'aws-cdk-lib'
import { MonitoringSinkStack } from '../lib/oam/monitoring-sink-stack'
import { MonitoringLinkStack } from '../lib/oam/monitoring-link-stack'
import { WidgetHelloStack } from '../lib/dashboard/widget-hello-stack'

const app = new App()

Tags.of(app).add('project', 'Big brother is monitoring you')

new MonitoringSinkStack(app, 'MonitoringSink', {
    stackName: 'cicd-monitoring-sink',
})

new MonitoringLinkStack(app, 'MonitoringLink', {
    stackName: 'cicd-monitoring-link',
})

new WidgetHelloStack(app, 'WidgetHello', {
    stackName: 'cicd-monitoring-widget-hello',
    widgetName: 'widget-hello',
})
