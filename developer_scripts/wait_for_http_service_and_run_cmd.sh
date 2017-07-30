#!/bin/bash

# This script is needed in order to make sure that when running Fish using
# Docker. The idea is to first wait for MongoDB to run before executing anything
# else. For example, running the Fish application only after MongoDB is up to make sure
# that the application can connect

# subprocesses will exit the shell
host="$1"
timeout="$2"
sleepduration="$3"

shift 3
execcmd="$@"

infotext="Still waiting for HTTP process@$host... Going to sleep for $sleepduration second(s)"

until curl --connect-timeout $timeout -s $host; do
 echo $infotext
 sleep $sleepduration
done

echo "MongoDB@$mongohost is up... Continuing with execution of command: '$execcmd'"
exec $execcmd
