# syntax=docker/dockerfile:1
FROM node:lts-slim@sha256:e20529ad3c8865301387ca9f4dbe65e7b6a0f1bb7fd700b9ba90d560f21f2314 AS nodebase
FROM python:3-slim@sha256:d5f16749562233aa4bd26538771d76bf0dfd0a0ea7ea8771985e267451397ae4 AS pythonbase

FROM debian:stable-slim@sha256:f8bbfa052db81e5b8ac12e4a1d8310a85d1509d4d0d5579148059c0e8b717d4e

LABEL org.opencontainers.image.source="https://github.com/demosjarco/matt-ai.git"

ENV DEBIAN_FRONTEND=noninteractive
# Update packge lists
RUN --mount=type=cache,target=/var/cache/apt apt-get update
# Upgrade packages (non-breaking)
RUN --mount=type=cache,target=/var/cache/apt apt-get upgrade -y
# Install additional
RUN --mount=type=cache,target=/var/cache/apt apt-get install -y sudo libstdc++ ca-certificates
# Clean up cache (reduce image size)
RUN --mount=type=cache,target=/var/cache/apt apt-get clean
# Delete packages not used anymore
RUN --mount=type=cache,target=/var/cache/apt apt-get autoremove -y

# Setup sudo
RUN echo node ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/node
RUN chmod 0440 /etc/sudoers.d/node

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
# # Add symlink for python3
RUN ln -s /usr/local/bin/python3 /usr/bin/python3
# Verify installations
RUN node --version
RUN npm --version
RUN python3 --version

# Cache locations reference
# RUN npm config get cache
# /root/.npm
# RUN pip cache dir
# /root/.cache/pip

RUN --mount=type=cache,target=/root/.cache/pip pip install autotrain-advanced
# Installing PyTorch with CUDA 12.1 support
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