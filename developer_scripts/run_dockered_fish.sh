#!/bin/sh

FULL_FILENAME=$(realpath $0)
SCRIPT_BASEDIR=$(dirname $FULL_FILENAME)
if [ ! -z $(docker ps -aq --filter="name=dockered-fish")  ]; then
	echo 'Found "dockered-fish" container. Deleting the container...'
	docker rm dockered-fish
fi
echo 'Creating "dockered-fish" container...'
docker run --name dockered-fish -p 8080:80 -d fishsim npm start
