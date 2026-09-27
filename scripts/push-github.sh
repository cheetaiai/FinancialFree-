#!/usr/bin/env bash
# FinancialFree - GitHub Sync & Push Utility
set -e

REPO_URL="$1"

if [ -n "$REPO_URL" ]; then
  echo "==> Configuring remote origin: $REPO_URL"
  git remote remove origin 2>/dev/null || true
  git remote add origin "$REPO_URL"
fi

echo "==> Current Git status:"
git status --short

echo "==> Staging changes..."
git add -A

if git diff-index --quiet HEAD --; then
  echo "==> Working tree clean, no new unstaged changes."
else
  COMMIT_MSG="${2:-"feat: Update app with file analysis, notifications & version v1.2.5"}"
  echo "==> Committing: $COMMIT_MSG"
  git commit -m "$COMMIT_MSG"
fi

if git remote | grep -q 'origin'; then
  echo "==> Pushing to GitHub (origin main)..."
  git push -u origin main
  echo "==> Successfully pushed to GitHub!"
else
  echo ""
  echo "==> All files are committed and prepared locally on branch main!"
  echo "==> To push to your GitHub repository, run:"
  echo "    git remote add origin https://github.com/<your-username>/<your-repo>.git"
  echo "    git push -u origin main"
fi
