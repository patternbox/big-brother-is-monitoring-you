import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { MonitoringLinkStack } from '../monitoring-link-stack'

describe('MonitoringLinkStack', () => {

  it('should match snapshot', () => {
    const app = new App()

    const stack = new MonitoringLinkStack(app, 'MonitoringLinkStack', {})

    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot()
  })

})
