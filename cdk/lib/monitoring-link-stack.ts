import { Construct } from 'constructs'
import { Stack, StackProps, CfnParameter, Arn, ArnFormat } from 'aws-cdk-lib'
import * as oam from 'aws-cdk-lib/aws-oam'
import * as iam from 'aws-cdk-lib/aws-iam'

export class MonitoringLinkStack extends Stack {

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const monitoringSinkArnParam = new CfnParameter(this, 'MonitoringSinkArn', {
      type: 'String',
      description: 'The monitoring sink ARN',
    })

    const accountLabelParam = new CfnParameter(this, 'AccountLabel', {
      type: 'String',
      description: 'The account label',
      default: '$AccountName',
    })

    new oam.CfnLink(this, 'MonitoringLink', {
      resourceTypes: ['AWS::CloudWatch::Metric', 'AWS::Logs::LogGroup'],
      sinkIdentifier: monitoringSinkArnParam.valueAsString,
      labelTemplate: accountLabelParam.valueAsString,
    })

    const sinkArnSplit = Arn.split(monitoringSinkArnParam.valueAsString, ArnFormat.SLASH_RESOURCE_NAME)

    new iam.Role(this, 'CWCrossAccountSharingRole', {
      roleName: 'CloudWatch-CrossAccountSharingRole',
      assumedBy: new iam.AccountPrincipal(sinkArnSplit.account),
      path: '/',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAutomaticDashboardsAccess'),
      ]
    })    

  }
}
