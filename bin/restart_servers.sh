#!/bin/bash
#  Requires NODE_ENV to be SET!
# live: means it is the live environment.
# dev: means it is the development environment


CURRENT_ENV=$(printenv NODE_ENV)


#  restart specific server?

if [ $# -gt 0 ]
then

	printf "\nAttempting to restart $1 \n\n"
	SERVER_NAME=$1

	DIR="../../"
     	PREFIX=${DIR}
     	POSTFIX="/src/index.js"
     	if [[ ${CURRENT_ENV} == 'dev' ]]; then
        	ARG=" testing"
     	else
        	ARG=""
     	fi
     	command="${DIR}${SERVER_NAME}${POSTFIX}${ARG}";
	echo $command
     	node ${command} &  # don't interpret & as string!
	exit 0
fi




printf "Killing the servers that are already running...\n"
./stop_servers.sh


# starts all the servers in a particular mode
# depending on the environment.
start_servers() {
  array=("$@")

  for val in ${array[@]}; do

     DIR="../../"
     PREFIX=${DIR}
     POSTFIX="/src/index.js"
     if [[ ${CURRENT_ENV} == 'dev' ]]; then
        ARG=" testing"
     else
        ARG=""
     fi
     command="${DIR}${val}${POSTFIX}${ARG}";
     node ${command} &  # don't interpret & as string!
  done
}

# Declare an array of string with type,  microserver names.
declare -a StringArray=("blackboard_server"
                        "relationship_server"
                        "chat_server"
                        "video_chat_server"
                        "profile_server"
                        "file_server"
                        "legal_server"
                        "search_server"
	                      "admin_server"
                        "practice_test_server"
                        "course_server"
                        "notification_server"
												"ad_server"
												"payment_server"
												"forum_server"
			)

start_servers "${StringArray[@]}"

if [[ ${CURRENT_ENV} != 'dev' ]]; then
  printf "Enabling TURN server.. (required for WebRTC calls)\n\n"
  #sudo turnserver -M "dbname=palolo user=chris password=xxx" -av
fi
