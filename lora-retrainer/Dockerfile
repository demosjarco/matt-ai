# syntax=docker/dockerfile:1
# https://github.com/huggingface/autotrain-advanced/blob/main/Dockerfile
FROM huggingface/autotrain-advanced:latest@sha256:361af73e18e4c318cd8503efc0d375422f55f73ec1bfa3bd7d6d57ae0a1101f8 AS base

LABEL org.opencontainers.image.source="https://github.com/demosjarco/matt-ai.git"

USER root
SHELL ["/bin/bash", "-c"]

ENV DEBIAN_FRONTEND=noninteractive
# Update packge lists
RUN --mount=type=cache,target=/var/cache/apt apt-get update
# Install missing packages
RUN --mount=type=cache,target=/var/cache/apt apt-get install -y libaio-dev
# Upgrade packages (non-breaking)
RUN --mount=type=cache,target=/var/cache/apt apt-get upgrade -y

FROM base AS nodesetup

USER root
SHELL ["/bin/bash", "-c"]

# Setup node.js
RUN curl -sSL https://deb.nodesource.com/setup_20.x | bash
RUN --mount=type=cache,target=/var/cache/apt apt-get install -y nodejs

FROM nodesetup AS py

USER user
SHELL ["conda", "run","--no-capture-output", "-p","/app/env", "/bin/bash", "-c"]
WORKDIR /app

# Cache locations reference
# RUN pip cache dir
# /app/.cache/pip

RUN --mount=type=cache,target=/app/.cache/pip,uid=1000 pip uninstall -y autotrain-advanced
RUN --mount=type=cache,target=/app/.cache/pip,uid=1000 pip install -U autotrain-advanced

# Clean up cache (reduce image size)
RUN --mount=type=cache,target=/app/.cache/pip,uid=1000 pip cache purge

FROM py AS node

USER user
SHELL ["conda", "run","--no-capture-output", "-p","/app/env", "/bin/bash", "-c"]
WORKDIR /app/node

# Cache locations reference
# RUN npm config get cache
# /app/.npm

COPY --link package*.json ./
COPY --link ./dist ./dist
# not ci because this workspace is borked
USER root
RUN --mount=type=cache,target=/app/.npm npm install --ignore-scripts --omit=dev
RUN --mount=type=cache,target=/app/.npm npm run-script install --if-present

# Clean up cache (reduce image size)
RUN --mount=type=cache,target=/app/.npm npm cache clean --force

# Reset borked permissions
RUN chown -R user:user /app

FROM node

USER root
RUN --mount=type=cache,target=/var/cache/apt apt-get clean
# Delete packages not used anymore
RUN --mount=type=cache,target=/var/cache/apt apt-get autoremove -y

USER user

EXPOSE 8080/tcp

HEALTHCHECK CMD curl -f http://localhost:8080/status || exit 1

SHELL ["conda", "run","--no-capture-output", "-p","/app/env", "/bin/bash", "-c"]
# CMD autotrain app --host 0.0.0.0 --port 8080
# RUN whereis autotrain
# /app/env/bin/autotrain
CMD ["npm", "start"]