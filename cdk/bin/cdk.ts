#!/usr/bin/env node

import { App, Tags } from 'aws-cdk-lib'
import { MonitoringSinkStack } from '../lib/monitoring-sink-stack'
import { MonitoringLinkStack } from '../lib/oam/monitoring-link-stack'

const app = new App()

new MonitoringSinkStack(app, 'MonitoringSink', {
    stackName: 'cicd-monitoring-sink',
})

new MonitoringLinkStack(app, 'MonitoringLink', {
    stackName: 'cicd-monitoring-link',
})
