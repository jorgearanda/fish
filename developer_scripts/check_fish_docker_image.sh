#!/bin/sh

FULL_FILENAME=$(realpath $0)
SCRIPT_BASEDIR=$(dirname $FULL_FILENAME)
echo "Checking for docker image 'fishsim'..."
docker image inspect fishsim 1> /dev/null
if [ $? -ne 0 ]; then
	docker build -t fishsim $(dirname $SCRIPT_BASEDIR)/Dockerfile-App
fi
