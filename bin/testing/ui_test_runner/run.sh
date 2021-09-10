#!/bin/bash


print_options(){
  printf "\n\n       *** UI TESTER ***\n\n"
  test_options=("1. All"
		            "2. Back")

  for ((k = 0; k < ${#test_options[@]}; k++))
  do
    printf "${test_options[$k]}\n"
  done
  echo ""
}



giveChoices(){

  while [[ {$LEVEL} != 'exit' ]];
  do

    print_options
    read LEVEL

    if [[ $LEVEL == '1' ]]; then

      runAll

    else
      exit
    fi

    clear

  done
}



clear

runAll(){
  DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
  cd ${DIR}
  ./ui_compile_tests
  ./ui_run_tests
}

if [[ $1 == 'all' ]]; then

  runAll

else

  giveChoices

fi
