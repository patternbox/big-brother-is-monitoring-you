# big-brother-is-monitoring-you

```bash
# Deploy monitoring sink
awsume monitoring-developer-profile --auto-refresh --output-profile monitoring-developer
npx cdk deploy MonitoringSink --require-approval never \
   --parameters LinkedAccounts="${DEVELOP_ACCOUNT},${PRODUCTION_ACCOUNT}"

MONITORING_SINK_ARN=$(aws cloudformation list-exports \
  --query "Exports[?Name=='cicd-monitoring-sink:MonitoringSinkArn'].Value" \
  --output text)
echo $MONITORING_SINK_ARN
aws oam list-attached-links --sink-identifier $MONITORING_SINK_ARN
```

```bash
# Deploy monitoring link
awsume sandbox-developer-profile --auto-refresh --output-profile sandbox-developer
npx cdk deploy MonitoringLink --require-approval never \
   --parameters MonitoringSinkArn=$MONITORING_SINK_ARN \
   --parameters AccountLabel="Sandbox account"
```