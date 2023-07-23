#!/bin/bash -e

pushd "$(dirname $0)" > /dev/null

cd .. # Goto project root folder

function addExecFlag() {
  local file=$1
  isGitTracked=$(git ls-files $file)
  if [[ ! -z ${isGitTracked} ]]; then
    echo "Update $file"
    git update-index --chmod=+x $file
    # [[ "$?" != "0" ]] && echo "Return code was: SUCCESS (code: $?)" || echo "*** Execution FAILED, return code was: $?"
  fi
}

while IFS= read -r -d '' file
do
  addExecFlag $file
done <  <(find . -iname '*.sh' -print0)

popd > /dev/null
