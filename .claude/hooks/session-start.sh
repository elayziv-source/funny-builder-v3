#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# ── 1. Install npm dependencies ──────────────────────────────────────────────
cd "$CLAUDE_PROJECT_DIR"
if [ ! -d "node_modules" ]; then
  npm install
fi

# ── 2. Install GitHub CLI (gh) ───────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  GH_VERSION="2.65.0"
  GH_ARCHIVE="gh_${GH_VERSION}_linux_amd64.tar.gz"
  GH_URL="https://github.com/cli/cli/releases/download/v${GH_VERSION}/${GH_ARCHIVE}"

  tmpdir=$(mktemp -d)
  curl -sL "$GH_URL" -o "$tmpdir/$GH_ARCHIVE"
  tar -xzf "$tmpdir/$GH_ARCHIVE" -C "$tmpdir"
  cp "$tmpdir/gh_${GH_VERSION}_linux_amd64/bin/gh" /usr/local/bin/gh
  chmod +x /usr/local/bin/gh
  rm -rf "$tmpdir"
fi

# ── 3. Authenticate gh if a GitHub token is available ────────────────────────
# Attempt auth from environment variable or git credential helper.
# If no token is available, gh is still installed for future use.
if ! gh auth status &>/dev/null 2>&1; then
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo "$GITHUB_TOKEN" | gh auth login --with-token 2>/dev/null || true
  elif [ -n "${GH_TOKEN:-}" ]; then
    echo "$GH_TOKEN" | gh auth login --with-token 2>/dev/null || true
  else
    # Try extracting token from git credential helper
    EXTRACTED_TOKEN=$(git credential fill 2>/dev/null <<CRED | grep "^password=" | cut -d= -f2
protocol=https
host=github.com
CRED
    ) || true
    if [ -n "${EXTRACTED_TOKEN:-}" ]; then
      echo "$EXTRACTED_TOKEN" | gh auth login --with-token 2>/dev/null || true
    fi
  fi
fi

# ── 4. Export PATH so gh is available in the session ─────────────────────────
echo 'export PATH="/usr/local/bin:$PATH"' >> "$CLAUDE_ENV_FILE"
