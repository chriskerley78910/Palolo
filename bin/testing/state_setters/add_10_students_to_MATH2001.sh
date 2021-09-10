#!/bin/bash


cd /var/www/palolo/bin/testing/state_setters
DIR=$(pwd)
RESULT=$(sudo mysql -u root palolo  < ${DIR}/sql/five_teachers_ten_students.sql)
echo "5 teachers, 10 students"

