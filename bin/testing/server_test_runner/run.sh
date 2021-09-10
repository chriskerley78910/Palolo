#!/bin/bash
web_root='/var/www'


##  USE TO SELECT SPECIFIC TEST THAT MATCHES THE PATTERN.



print_options(){

  printf "\n\n      SERVER TESTER\n\n"

  test_options=(" 1) auth_server"
                " 2) chat_server"
                " 3) relationship_server"
                " 4) shared_services"
                " 5) video_chat_server"
                " 6) BACK")

  for ((k = 0; k < ${#test_options[@]}; k++))
  do
    printf "${test_options[$k]}\n"
  done
  echo ""
}



giveOptions(){


  while [[ {$LEVEL} != 'exit' ]];
  do

    print_options
    read LEVEL

    if [[ $LEVEL == '1' ]]; then

      cd ${web_root}/auth_server/bin
      ./run_tests
    elif [[ $LEVEL == '2' ]]; then

      cd ${web_root}/chat_server
      npm test
    elif [[ $LEVEL == '3' ]]; then

      cd ${web_root}/relationship_server
      npm test

    elif [[ $LEVEL == '4' ]]; then

      cd ${web_root}/shared_services
      npm test

    elif [[ ${LEVEL} == '5' ]]; then

       cd ${web_root}/video_chat_server
       npm test
    else
      exit
    fi

    clear

  done
}



clear


if [[ $1 == 'all' ]]; then

  cd ${web_root}/auth_server/bin
  ./run_tests
  cd ${web_root}/chat_server
  npm test
  cd ${web_root}/relationship_server
  npm test
  cd ${web_root}/shared_services
  npm test
else

  giveOptions

fi
