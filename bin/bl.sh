#!/bin/bash


APP_ROOT="/var/www/palolo"
VERSIONS_FILE="./versioning/app_versions"

readVersionCounter(){

  local VERSION_COUNTER='./versioning/version_counter'
  typeset -i variable=$(cat ${VERSION_COUNTER})
  local nextNumber=$(($variable + 1))
  echo ${nextNumber} > ${VERSION_COUNTER}
  echo ${nextNumber}
}


buildApp(){
  BUILD_SCRIPT=$1
  APP_NAME=$2
  node ${APP_ROOT}/node_modules/requirejs/bin/r.js -o ${APP_ROOT}/build-scripts/${BUILD_SCRIPT}.js
  cp ${APP_ROOT}/tmp/app-built.js ${APP_ROOT}/tmp/app.js
  terser --comments --compress --mangle --keep-classnames --keep-fnames -- ${APP_ROOT}/tmp/app.js > ${APP_ROOT}/src/public/${APP_NAME}.js
}

VERSION_NUMBER=$(readVersionCounter);

printf "remove old app versions...\n";
rm ./../src/public/app*
printf "building app version $VERSION_NUMBER";


printf "\nBuilding Live Target...\n\n";

DEV_APP_NAME="app-testing-${VERSION_NUMBER}"
echo ${DEV_APP_NAME} > ${VERSIONS_FILE}
buildApp 'dev' ${DEV_APP_NAME}

LIVE_APP_NAME="app-"${VERSION_NUMBER}
echo ${LIVE_APP_NAME} >> ${VERSIONS_FILE}
buildApp 'live' ${LIVE_APP_NAME}

printf "\nBuilding complete!!! Good work!\n\n"
