import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { MonitoringSinkStack } from '../monitoring-sink-stack'

describe('MonitoringSinkStack', () => {

  it('should match snapshot', () => {
    const app = new App()

    const stack = new MonitoringSinkStack(app, 'MonitoringSinkStack', {})

    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot()
  })

})
