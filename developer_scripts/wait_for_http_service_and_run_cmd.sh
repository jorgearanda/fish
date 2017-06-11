#!/bin/bash

# subprocesses will exit the shell
mongohost="$1"
timeout="$2"
sleepduration="$3"

shift 3
execcmd="$@"
echo $execcmd

until curl $mongohost --connect-timeout $timeout >&2; do
 echo "Still waiting for MongoDB@$mongohost... Going to sleep"
 sleep $sleepduration
done

echo "MongoDB@$mongohost is up... Continuing with execution of command: '$execcmd'"
exec $execcmd
