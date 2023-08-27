#!/bin/bash

function showUsage {
  echo "Usage: $0 -w|--widget <widget-hello|widget-alarms|widget-gates>"
  exit 1
}

function printErrorAndUsage {
  echo "$1"
  showUsage
}

while [ $# -gt 0 ]
do
  case "$1" in
    (-w|--widget)
        shift
        [ $# = 0 ] && printErrorAndUsage "No WIDGET_NAME specified"
        WIDGET_NAME="$1"
        shift;;
    (*)
      printErrorAndUsage "Unknown option $1"
  esac
done

if [ -z "$WIDGET_NAME" ] ; then
  echo "WIDGET_NAME must be set"
  showUsage
fi

WIDGET_NAME="${WIDGET_NAME//-/' '}" # replace '-' by ' '
WIDGET_NAME=( $WIDGET_NAME ) # without quotes
WIDGET_NAME="${WIDGET_NAME[@]^}" # uppercase first letters
WIDGET_NAME="${WIDGET_NAME// /}" # remove spaces between words

set -o pipefail

jq --version 2> /dev/null
[ $? -eq 0 ] && JQ_CMD=jq || JQ_CMD=jq-win64.exe # Git-Bash for Windows magic

pushd "$(dirname $0)" > /dev/null

WIDGET_CODE=$(cat ../cdk.out/${WIDGET_NAME}.assets.json | ${JQ_CMD} -r '.files[][] | select(.packaging == "zip").path')

MONITORING_SINK_ARN=$(aws cloudformation list-exports \
  --query "Exports[?Name=='cicd-monitoring-sink:MonitoringSinkArn'].Value" \
  --output text)

sam --version 2> /dev/null
[ $? -eq 0 ] && SAM_CMD=sam || SAM_CMD=sam.cmd # Git-Bash for Windows magic

$SAM_CMD local start-api \
  --template template.yaml \
  --parameter-overrides \
      ParameterKey=WidgetCode,ParameterValue=../cdk.out/${WIDGET_CODE} \
      ParameterKey=MonitoringSinkArn,ParameterValue=${MONITORING_SINK_ARN}

popd > /dev/null
