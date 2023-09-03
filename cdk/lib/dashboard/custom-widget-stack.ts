import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs/lib/function'
import { Construct } from 'constructs'

import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as lambda from 'aws-cdk-lib/aws-lambda'

export interface CustomWidgetStackProps extends StackProps {
    widgetName: string,
}

export abstract class CustomWidgetStack extends Stack {

    constructor(scope: Construct, id: string, props: CustomWidgetStackProps) {
        super(scope, id, props)

        const functionName = props.stackName!

        new logs.LogGroup(this, 'LogGroup', {
            logGroupName: `/aws/lambda/${functionName}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: RemovalPolicy.DESTROY,
        })

        const lambdaExecutionRole = new iam.Role(this, 'lambda-execution-role', {
            roleName: `${functionName}-role`,
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            inlinePolicies: {
                'logPolicy': this.getLogPolicy(functionName),
                'oamPolicy': this.getOamPolicy(functionName),
                'crossAccountPolicy': this.getCrossAccountPolicy(functionName),
            },
            managedPolicies: this.getManagedPolicies(),
        })

        new NodejsFunction(this, functionName, this.customizeFunctionProps({
            role: lambdaExecutionRole,
            architecture: lambda.Architecture.X86_64,
            runtime: lambda.Runtime.NODEJS_18_X,
            memorySize: 1024,
            functionName: functionName,
            entry: `${__dirname}/../../functions/${props.widgetName}/src/index.ts`,
            handler: 'handler',
            environment: {
                NODE_OPTIONS: '--enable-source-maps', // to create stack trace when error occur
            },
            bundling: {
                externalModules: ['aws-sdk'],
                minify: false,
                sourceMap: true,
                sourcesContent: true,
                commandHooks: {
                    beforeBundling: (_inputDir: string, _outputDir: string): string[] => [],
                    afterBundling: (inputDir: string, outputDir: string): string[] => [
                        `cp ${inputDir}/functions/widget-deployment-gates/assets/*.css ${outputDir}`,
                        `echo ------------------------------`,
                        `ls -la ${outputDir}`,
                        `echo ------------------------------`,
                    ],
                    beforeInstall: (_inputDir: string, _outputDir: string): string[] => [],
                },
            },
        }))
    }

    private getLogPolicy(functionName: string): iam.PolicyDocument {
        return new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    actions: [
                        'logs:*',
                    ],
                    resources: [
                        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${functionName}:*`,
                    ],
                }),
            ],
        })
    }

    private getOamPolicy(functionName: string): iam.PolicyDocument {
        return new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    actions: [
                        'oam:Get*',
                        'oam:List*',
                    ],
                    resources: [
                        `arn:aws:oam:${this.region}:${this.account}:sink/*`,
                    ],
                }),
            ],
        })
    }

    getCrossAccountPolicy(functionName: string): iam.PolicyDocument {
        return new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    actions: [
                        'sts:AssumeRole',
                    ],
                    resources: [
                        'arn:aws:iam::*:role/CloudWatch-CrossAccountSharingRole',
                    ],
                }),
            ],
        })
    }

    getManagedPolicies(): iam.IManagedPolicy[] {
        return []
    }

    customizeFunctionProps(functionProps: NodejsFunctionProps): NodejsFunctionProps {
        return functionProps
    }
}
