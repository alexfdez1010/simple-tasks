#!/usr/bin/env sh

set -eu

export DATABASE_URL="${TEST_DATABASE_URL:-postgresql://postgres:postgres@localhost:${TEST_DATABASE_PORT:-55433}/simple_tasks_test?schema=public}"
export PASSWORD="${PASSWORD:-test-password}"
export AUTH_SECRET="${AUTH_SECRET:-test-auth-secret-at-least-thirty-two-characters}"
export MCP_TOKEN="${MCP_TOKEN:-test-mcp-token-at-least-thirty-two-characters}"

# Removes only the isolated Compose test project, including ephemeral data.
cleanup() {
  docker compose -f compose-test.yml down --volumes
}

trap cleanup EXIT INT TERM
docker compose -f compose-test.yml up --detach --wait
bun run database:create
"$@"
