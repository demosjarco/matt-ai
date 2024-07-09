FROM node:lts-alpine@sha256:df01469346db2bf1cfc1f7261aeab86b2960efa840fe2bd46d83ff339f463665 as nodebase
FROM python:3-alpine@sha256:b7662fc33e07f05fb2f579c3634e1e4d2e30c02553397c6c24f775cb360dbc03 as pythonbase

FROM alpine:3@sha256:b89d9c93e9ed3597455c90a0b88a8bbb5cb7188438f70953fede212a0c4394e0
# Copy Node.js
COPY --from=nodebase /usr/local/bin /usr/local/bin
COPY --from=nodebase /usr/local/lib /usr/local/lib
# Copy Python
COPY --from=pythonbase /usr/local/bin /usr/local/bin
COPY --from=pythonbase /usr/local/lib /usr/local/lib
COPY --from=pythonbase /usr/local/include /usr/local/include

RUN apk add --no-cache libstdc++ ca-certificates && \
    # Add symlinks to "node" and "npm"
    ln -s /usr/local/bin/node /usr/bin/node && \
    ln -s /usr/local/bin/npm /usr/bin/npm && \
    # Add symlink for python3
    ln -s /usr/local/bin/python3 /usr/bin/python3 && \
    # Verify installations
    node --version && \
    npm --version && \
    python3 --version

# Set the default command
CMD ["/bin/sh"]