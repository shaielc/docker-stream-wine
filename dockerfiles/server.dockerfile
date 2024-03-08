FROM node:18-alpine3.18
COPY entrypoints/server.sh /usr/bin/entrypoint
COPY src src
RUN cd src/server && npm i
ENTRYPOINT ["/usr/bin/entrypoint"]
