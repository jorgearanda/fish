#!/bin/bash

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
