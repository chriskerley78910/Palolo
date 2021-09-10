#!/bin/bash


DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


print_options(){
  printf "\n\n       * View Model Tester\n\n"
  test_options=(" 1) run all tests"
                " 2) run by match"
		" 3) <<-back")

  for ((k = 0; k < ${#test_options[@]}; k++))
  do
    printf "${test_options[$k]}\n"
  done
  echo ""
}



run_menu(){

while [[ {$LEVEL} != 'exit' ]];
do

  print_options
  read LEVEL
  if [[ $LEVEL == '1' ]]; then

	${DIR}/all_tests
  elif [[ $LEVEL == '2' ]]; then

	printf "Enter the test name to match:"
	read TEST_NAME
	$DIR/single_test ${TEST_NAME}
  elif [[ $LEVEL == '4' ]]; then

     exit
  elif [[ $LEVEL == "2" ]]; then

    ./view_model_run_test
  else
    exit
  fi

  clear

done


}




clear





if [[ ${#@} > 0 ]]; then


	echo "RUNNING ALL TESTS"
	${DIR}/all_tests
else

	run_menu
fi


