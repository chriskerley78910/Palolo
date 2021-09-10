#!/bin/bash

ports=$(netstat -nlp | grep -e "tcp6 .*node" | cut -d " " -f 54-95 | cut -d "/" -f 1)

if [ -z "$ports" ]
then
      echo ""
      echo "**** There are no existing node ports ****"
      echo ""
else
      echo "\\n **** Closing open node ports: $ports **** \n"
      echo $ports | xargs kill
fi
