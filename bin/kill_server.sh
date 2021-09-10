#!/bin/bash


if [ $# -eq 0 ]
then
	printf "Port number must be passed as an argument\n"
	exit 1
fi


if ! [[ "${1}" =~ ^[0-9]+$ ]]; then

	printf "The port number must be an integer.\n"
	exit 1
fi


PORT=${1}

PID=$(netstat -nlp | grep -e "tcp6 .*${PORT}.*node" | cut -d " " -f 54-95 | cut -d "/" -f 1)


printf "Killing process ${PID}...\n"

if [ -z "${PID}" ]
then
      echo ""
      echo "**** There is no active process associated with that port. ****"
      echo ""
else
      echo "\\n **** Closing port: ${PORT} **** \n"
      echo ${PID} | xargs kill
      printf "port ${PORT} successfully closed.\n"
fi
