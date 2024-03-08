#!/bin/bash

docker volume inspect heroes3 || docker volume create heroes3
PORT=${PORT:-9001}
docker run --name=heroes3 \
 --env XVFB_SERVER=:95 \
 --env XVFB_SCREEN=0 \
 --env XVFB_RESOLUTION=800x600x24 \
 --env DISPLAY=:95 \
 -p $PORT:9001 \
 --mount source=heroes3,target="/home/wine/.wine/drive_c/GOG Games/HoMM 3 Complete/Games" \
 --rm -it heroes3 
#  --device=/dev/dri/:/dev/dri \