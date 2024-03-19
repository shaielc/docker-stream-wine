#!/bin/bash
set -x
docker tag $1-game:latest bouncer582/private:$1-game-latest
docker tag $1-provider:latest bouncer582/private:$1-provider-latest
docker tag private-streamer:latest bouncer582/private:streamer-client
docker push bouncer582/private:streamer-client
docker push bouncer582/private:$1-game-latest
docker push bouncer582/private:$1-provider-latest