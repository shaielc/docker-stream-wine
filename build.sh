#!/bin/bash
set -e
# docker build -f dockerfiles/game.dockerfile -t $1-game .
docker build -f dockerfiles/provider.dockerfile --build-arg GAME_DOCKER_IMAGE=$1-game -t $1-provider .
docker build -f dockerfiles/server.dockerfile -t private-streamer .