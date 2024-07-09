# syntax=docker/dockerfile:1
FROM node:lts-alpine@sha256:692b5239da8cf4b4b5ea25d966d83e2911f389d9fef88ac9ffbe76b2d48ef135 AS nodebase
FROM python:3-alpine@sha256:b7662fc33e07f05fb2f579c3634e1e4d2e30c02553397c6c24f775cb360dbc03 AS pythonbase

FROM alpine:3@sha256:b89d9c93e9ed3597455c90a0b88a8bbb5cb7188438f70953fede212a0c4394e0

# Update packge lists
RUN --mount=type=cache,target=/var/cache/apk apk update
# Upgrade packages (non-breaking)
RUN --mount=type=cache,target=/var/cache/apk apk upgrade
# Install additional
RUN --mount=type=cache,target=/var/cache/apk apk add libstdc++ ca-certificates
# Clean up cache (reduce image size)
RUN --mount=type=cache,target=/var/cache/apk apk cache clean
# Delete packages not used anymore
RUN --mount=type=cache,target=/var/cache/apk apk del --purge

LABEL org.opencontainers.image.source="https://github.com/demosjarco/matt-ai.git"

# Copy Node.js
COPY --from=nodebase /usr/local/bin /usr/local/bin
COPY --from=nodebase /usr/local/lib /usr/local/lib
# Copy Python
COPY --from=pythonbase /usr/local/bin /usr/local/bin
COPY --from=pythonbase /usr/local/lib /usr/local/lib
COPY --from=pythonbase /usr/local/include /usr/local/include

# Add symlinks to "node" and "npm"
RUN ln -s /usr/local/bin/node /usr/bin/node
RUN ln -s /usr/local/bin/npm /usr/bin/npm
# Add symlink for python3
RUN ln -s /usr/local/bin/python3 /usr/bin/python3
# Verify installations
RUN node --version
RUN npm --version
RUN python3 --version

# Cache locations reference
# /root/.npm
# /root/.cache/pip

RUN --mount=type=cache,target=/root/.cache/pip pip install autotrain-advanced
# # Installing PyTorch with CUDA 12.1 support
RUN --mount=type=cache,target=/root/.cache/pip pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu121
RUN --mount=type=cache,target=/root/.cache/pip pip install xformers
# Download necessary NLTK data
RUN --mount=type=cache,target=/root/.cache/pip python -m nltk.downloader punkt
# Install flash-attn with no build isolation
# RUN --mount=type=cache,target=/root/.cache/pip pip install flash-attn --no-build-isolation
# Install deepspeed for distributed training optimizations
# RUN --mount=type=cache,target=/root/.cache/pip pip install deepspeed

# Set the default command
CMD ["/bin/sh"]