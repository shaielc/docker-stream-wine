#!/bin/bash

PORT=${PORT:-9001}
docker run -it --name private-streamer --rm \
 -p $PORT:9001 \
 private-streamer