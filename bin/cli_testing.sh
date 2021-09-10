#!/bin/bash

clear

web_root="/var/www"

TEST_RUNNERS="./testing/";


print_header(){

  echo
  echo
  echo "        SELECT TESTS TO RUN"
  echo
  echo
}




print_options(){

  test_options=("1. UI layer: System Tests"
      		"2. View Model Layer: UI Component Tests"
       		"3. Server Layer: Backend Tests"
            	"4. Manual Testing"
            	"5. End to end Test")

  for ((k = 0; k < ${#test_options[@]}; k++))
  do
    printf "${test_options[$k]}\n\n"
  done
  echo ""
}




while [[ ${LEVEL} != 'exit' ]]; do

  clear
  print_header
  print_options


  if [[ ${#ERROR} > 0 ]]; then

    printf "\n\n${ERROR}"
    ERROR=""
    printf "Error, please try again:"
  else

    printf "Type the number of the test type you want:"
  fi

  read LEVEL

  if [[ ${LEVEL} == 1 ]]; then

	${TEST_RUNNERS}ui_test_runner/run.sh
  elif [[ $LEVEL == 2 ]]; then

	${TEST_RUNNERS}view_model_test_runner/run.sh
  elif [[ $LEVEL == 3 ]]; then

	${TEST_RUNNERS}server_test_runner/run.sh
  elif [[ $LEVEL == 4 ]]; then

	${TEST_RUNNERS}manual_test_runner/run.sh
  elif [[ $LEVEL == 5 ]]; then

      ${TEST_RUNNERS}ui_test_runner/run.sh 'all'
      ${TEST_RUNNERS}view_model_test_runner/run.sh 'all'
      ${TEST_RUNNERS}server_test_runner/run.sh 'all'
  else

    ERROR="..";
  fi
done
