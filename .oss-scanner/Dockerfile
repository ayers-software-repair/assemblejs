# Build for Anthropic's OSS Scanner: installs every dependency, builds every package and runs
# the unit tests, so the audit that follows (no network) has a finished workspace.

# Node 22 is the oldest line package.json "engines" allows (>=22); CI also runs 24. Pinned by tag and digest.
FROM node:22.23.3-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392

# Scanner contract: the checkout lives at /src.
COPY . /src
WORKDIR /src

# Corepack ships with Node 22. It reads the "packageManager" field (pnpm@11.4.0) and downloads that
# exact pnpm now, into the image, so `pnpm` still runs once the network is gone.
RUN corepack enable && corepack install

# Install from the lockfile, as CI does. pnpm-workspace.yaml allows only the esbuild and
# unrs-resolver build scripts. No browser is downloaded: Playwright fetches one only on
# `playwright install`, and the browser suite is not part of the audit.
RUN pnpm install --frozen-lockfile

# Build every package into its dist/, as `pnpm check` does before it tests (the CLI and
# create tests bundle real projects against the built packages).
RUN pnpm build

# Run the unit tests (vitest, offline) so the image is known to work. A failing test must not
# abort the build, so it only warns.
RUN pnpm -r test || echo "WARNING: unit tests reported failures"
