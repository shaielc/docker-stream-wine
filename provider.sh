#!/bin/bash

# For using git-bash
MSYS_NO_PATHCONV=1 

docker volume inspect heroes3 || docker volume create heroes3
docker run --name=heroes3 \
 --env XVFB_SERVER=:95 \
 --env XVFB_SCREEN=0 \
 --env XVFB_RESOLUTION=800x600x24 \
 --net=host \
 --env DISPLAY=:95 \
 --mount source=heroes3,target="/home/wine/.wine/drive_c/GOG Games/HoMM 3 Complete/Games" \
 --rm -it heroes3 
#  --device=/dev/dri/:/dev/dri \