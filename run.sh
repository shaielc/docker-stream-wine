#!/bin/bash
PORT=${PORT:-9001}
echo $PORT
docker run --name=heroes3 \
 --env XVFB_SERVER=:95 \
 --env XVFB_SCREEN=0 \
 --env XVFB_RESOLUTION=800x600x24 \
 --env DISPLAY=:95 \
 -p $PORT:9001 \
 --device=/dev/dri/:/dev/dri \
 --rm -it  heroes3