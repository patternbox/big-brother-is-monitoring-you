import { Construct } from "constructs";
import { CfnOutput, Stack, StackProps, CfnParameter } from "aws-cdk-lib";
import * as oam from 'aws-cdk-lib/aws-oam';

export class MonitoringSinkStack extends Stack {

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const linkedAccounts = new CfnParameter(this, 'LinkedAccounts', {
      type: 'CommaDelimitedList',
      description: 'A list of linked monitoring linked accounts',
    }).valueAsList

    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Resource: "*",
          Action: ["oam:CreateLink", "oam:UpdateLink"],
          Principal: {
            "AWS": linkedAccounts,
          },
          Condition: {
            "ForAllValues:StringEquals": {
              "oam:ResourceTypes": [
                "AWS::CloudWatch::Metric",
                "AWS::Logs::LogGroup",
                "AWS::XRay::Trace"
              ]
            }
          },
        }
      ]
    }

    const cfnSink = new oam.CfnSink(this, 'MonitoringSink', {
      name: this.stackName,
      policy: policy,
    })

    new CfnOutput(this, 'MonitoringSinkArn', {
      value: cfnSink.attrArn,
      exportName: this.stackName + ':MonitoringSinkArn',
    })
  }
}
