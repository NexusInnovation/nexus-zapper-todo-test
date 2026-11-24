# Zapper runner: runs `/goal` unattended in Azure Container Instances (or locally with Docker).
# Project-agnostic: the toolchain comes from the build arguments, set from `runner.image` of .zapper/config.md.
# The Playwright base image already holds the browsers, their system dependencies and Node.js.
ARG BASE_IMAGE=mcr.microsoft.com/playwright:v1.57.0-noble
FROM ${BASE_IMAGE}

ARG DOTNET_CHANNEL=none
ARG DOTNET_TOOLS=""
ARG PNPM_VERSION=none
ARG COPILOT_VERSION=latest
ARG APT_PACKAGES=""

ENV DEBIAN_FRONTEND=noninteractive \
    DOTNET_ROOT=/usr/share/dotnet \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1 \
    PNPM_HOME=/usr/local/share/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PATH=/usr/local/share/pnpm/bin:/usr/local/share/pnpm:/usr/share/dotnet:/root/.dotnet/tools:$PATH \
    CI=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl git jq rsync ${APT_PACKAGES} \
    && rm -rf /var/lib/apt/lists/*

RUN if [ "$DOTNET_CHANNEL" != "none" ]; then \
      curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh \
      && bash /tmp/dotnet-install.sh --channel "$DOTNET_CHANNEL" --install-dir "$DOTNET_ROOT" \
      && rm /tmp/dotnet-install.sh \
      && for tool in $DOTNET_TOOLS; do dotnet tool install --global "$tool"; done; \
    fi

# pnpm installs the Copilot CLI too, so the image never needs npm for global tools.
# The standalone installer handles pnpm 11+, which the corepack bundled with Node 22 cannot load.
RUN version="$PNPM_VERSION"; [ "$version" = "none" ] && version=latest; \
    curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION="$version" SHELL=/bin/bash ENV=/dev/null sh - \
    && pnpm --version \
    && pnpm add --global "@github/copilot@${COPILOT_VERSION}" \
    && copilot --version

COPY entrypoint.sh /opt/zapper/entrypoint.sh
RUN chmod +x /opt/zapper/entrypoint.sh

WORKDIR /workspace
ENTRYPOINT ["/opt/zapper/entrypoint.sh"]
