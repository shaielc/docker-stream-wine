ARG GAME_DOCKER_IMAGE
FROM $GAME_DOCKER_IMAGE
COPY --chown=wine src/provider/package.json /home/wine/src/provider/package.json
COPY --chown=wine src/common/package.json /home/wine/src/common/package.json
RUN cd src/common && npm i && cd ../provider && npm i


COPY --chown=wine entrypoints/provider.sh /usr/bin/entrypoint
COPY --chown=wine src /home/wine/src

ENTRYPOINT ["/usr/bin/entrypoint"]
