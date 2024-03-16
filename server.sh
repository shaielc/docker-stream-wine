#!/bin/bash


docker network inspect streamer || docker network create --driver bridge streamer
PORT=${PORT:-9001}
docker run -it --name private-streamer --rm \
 --env-file environment/server.env \
 --net streamer \
 -p $PORT:9001 \
 private-streamer