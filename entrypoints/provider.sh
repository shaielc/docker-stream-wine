#!/bin/bash
set -x

/usr/bin/Xvfb "${DISPLAY}" -screen "${XVFB_SCREEN}" "${XVFB_RESOLUTION}" -nolisten tcp -nolisten unix &
pulseaudio -D
sleep 1


gst-launch-1.0 ximagesrc display-name=$DISPLAY use-damage=0 \
! videoscale \
! 'video/x-raw,width=(int)800,height=(int)640,framerate=15/1' \
! videoconvert \
! queue \
! x264enc tune=zerolatency bitrate=1024 key-int-max=30 speed-preset=1 \
! video/x-h264, profile=constrained-baseline \
! rtph264pay pt=97 ssrc=43 \
! queue \
! udpsink host=0.0.0.0 port=5000 &

gst-launch-1.0 pulsesrc \
! audio/x-raw,rate=12000,channels=1 \
! audioconvert \
! queue \
! opusenc \
! rtpopuspay \
! queue \
! udpsink host=127.0.0.1 port=5001 &


sleep 3
pushd .wine/drive_c/GOG\ Games/HoMM\ 3\ Complete/
    wine Heroes3.exe &
popd
#/bin/bash


pushd src/provider/
    node index.js &
popd

wait