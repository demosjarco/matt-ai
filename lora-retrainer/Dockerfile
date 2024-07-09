# syntax=docker/dockerfile:1
FROM node:lts-alpine@sha256:692b5239da8cf4b4b5ea25d966d83e2911f389d9fef88ac9ffbe76b2d48ef135 as nodebase
FROM python:3-alpine@sha256:b7662fc33e07f05fb2f579c3634e1e4d2e30c02553397c6c24f775cb360dbc03 as pythonbase

FROM alpine:3@sha256:b89d9c93e9ed3597455c90a0b88a8bbb5cb7188438f70953fede212a0c4394e0

RUN --mount=type=cache,target=/var/cache/apk apk update
RUN --mount=type=cache,target=/var/cache/apk apk upgrade
RUN --mount=type=cache,target=/var/cache/apk apk cache clean
RUN --mount=type=cache,target=/var/cache/apk apk del --purge

LABEL org.opencontainers.image.source="https://github.com/demosjarco/matt-ai.git"

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