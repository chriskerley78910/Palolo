#!/bin/bash

echo ""

#declare an array
options_arr=("1. setup teacher with two students"
	     			 "2. run app in browser"
	     			 "3. <- BACK")

done_flag="";


print_options(){
	clear
		printf "\n\n         Manual Test Setup\n\n"
	for ((i = 0; i < ${#options_arr[@]}; i++))
	do
		echo "${options_arr[$i]}"
		echo ""
	done

}

while :
do

		print_options

		if [[ ${#done_flag} > 0 ]]; then
			printf "${done_flag}\n\n"
			done_flag=""
		fi

		printf "Select next option:"
		read picked_number
		cd /var/www/palolo/bin/testing
		if [[ $picked_number == '1' ]]; then


			./state_setters/one_teacher_two_students.sh
		elif [[ $picked_number == '2' ]]; then

			./restart_servers
			google-chrome --disable-web-security --user-data-dir --user-agent='automated:test' 127.0.0.1
		elif [[ $picked_number == '3' ]]; then

			exit
		fi



done
