#!/bin/bash

function showUsage {
  echo "Usage: $0 -w|--widget <widget-hello|widget-alarms>"
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

WIDGET_NAME="${WIDGET_NAME/-/' '}"
WIDGET_NAME=( $WIDGET_NAME ) # without quotes
WIDGET_NAME="${WIDGET_NAME[@]^}"
WIDGET_NAME="${WIDGET_NAME/ /}"

set -o pipefail

jq --version 2> /dev/null
[ $? -eq 0 ] && JQ_CMD=jq || JQ_CMD=jq-win64.exe # Git-Bash for Windows magic

#set -x

pushd "$(dirname $0)" > /dev/null

WIDGET_CODE=$(cat ../cdk.out/${WIDGET_NAME}.assets.json | ${JQ_CMD} -r '.files[][] | select(.packaging == "zip").path')

sam --version 2> /dev/null
[ $? -eq 0 ] && SAM_CMD=sam || SAM_CMD=sam.cmd # Git-Bash for Windows magic

$SAM_CMD local start-api \
  --parameter-overrides ParameterKey=WidgetCode,ParameterValue=../cdk.out/${WIDGET_CODE} \
  --warm-containers EAGER  \
  --template template.yaml

popd > /dev/null
