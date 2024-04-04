#!/bin/bash


docker network inspect streamer || docker network create --driver bridge streamer
PORT=${PORT:-9001}
SECURITY=${SECURITY:-secure}
echo $SECURITY
docker run -it --name private-streamer --rm \
 --env-file environment/server.env \
 --env SECURITY=${SECURITY} \
 --env DEVELOPMENT=${DEVELOPMENT} \
 --net streamer \
 -p $PORT:9001 \
 private-streamer