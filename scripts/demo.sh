#!/usr/bin/env bash
# Bring the public demo up (or down) in one command.
#
#   ./scripts/demo.sh up      # start postgres + backend + tunnel, wire Pages
#   ./scripts/demo.sh down    # stop backend + tunnel (Postgres stays running)
#   ./scripts/demo.sh status  # show what's running
#   ./scripts/demo.sh url     # print the current live demo URL

set -eo pipefail

REPO="mgarbs/0x-hbar"
PAGES_URL="https://mgarbs.github.io/0x-hbar/"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STATE_DIR="$ROOT_DIR/.demo"
mkdir -p "$STATE_DIR"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
BACKEND_LOG="$STATE_DIR/backend.log"
TUNNEL_PID_FILE="$STATE_DIR/tunnel.pid"
TUNNEL_LOG="$STATE_DIR/tunnel.log"
TUNNEL_URL_FILE="$STATE_DIR/tunnel.url"

c_reset=$'\e[0m'; c_b=$'\e[1m'; c_green=$'\e[32m'; c_red=$'\e[31m'; c_dim=$'\e[2m'; c_cyan=$'\e[36m'

log() { echo -e "${c_dim}[demo]${c_reset} $*"; }
ok()  { echo -e "${c_green}✓${c_reset} $*"; }
err() { echo -e "${c_red}✗${c_reset} $*" >&2; }

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "missing required tool: $1"
    exit 1
  fi
}

is_running() {
  [[ -f "$1" ]] && kill -0 "$(cat "$1")" 2>/dev/null
}

cmd_up() {
  need docker; need pnpm; need cloudflared; need gh

  # Postgres
  log "ensuring postgres is up"
  docker compose up -d postgres >/dev/null

  # Backend
  if is_running "$BACKEND_PID_FILE"; then
    ok "backend already running (pid $(cat "$BACKEND_PID_FILE"))"
  else
    log "starting backend → $BACKEND_LOG"
    (
      nohup pnpm --filter @0xhbar/backend run dev >"$BACKEND_LOG" 2>&1 &
      echo $! >"$BACKEND_PID_FILE"
      disown
    )
    # Wait for health
    for _ in $(seq 1 30); do
      if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
        ok "backend ready on :3001"
        break
      fi
      sleep 1
    done
  fi

  # Tunnel
  if is_running "$TUNNEL_PID_FILE"; then
    ok "tunnel already running (pid $(cat "$TUNNEL_PID_FILE"))"
  else
    log "starting cloudflare tunnel → $TUNNEL_LOG"
    : >"$TUNNEL_LOG"
    (
      nohup cloudflared tunnel --url http://localhost:3001 >"$TUNNEL_LOG" 2>&1 &
      echo $! >"$TUNNEL_PID_FILE"
      disown
    )
  fi

  # Capture tunnel URL
  local url=""
  for _ in $(seq 1 30); do
    url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
    [[ -n "$url" ]] && break
    sleep 1
  done
  if [[ -z "$url" ]]; then
    err "tunnel did not produce a URL within 30s; check $TUNNEL_LOG"
    exit 1
  fi
  echo "$url" >"$TUNNEL_URL_FILE"
  ok "tunnel URL: ${c_cyan}$url${c_reset}"

  # Wire Pages
  log "setting NEXT_PUBLIC_API_BASE on $REPO"
  gh variable set NEXT_PUBLIC_API_BASE --repo "$REPO" --body "$url" >/dev/null
  log "triggering pages rebuild"
  gh workflow run pages.yml --repo "$REPO" >/dev/null

  echo
  echo -e "${c_b}Demo URL:${c_reset}     $PAGES_URL"
  echo -e "${c_b}Backend:${c_reset}      http://localhost:3001"
  echo -e "${c_b}Tunnel:${c_reset}       $url"
  echo -e "${c_b}Local console:${c_reset} http://localhost:3002  (run 'pnpm web' separately if needed)"
  echo
  echo -e "${c_dim}Pages build takes ~1min. Hard-refresh once it completes.${c_reset}"
  echo -e "${c_dim}Stop everything:  ./scripts/demo.sh down${c_reset}"
}

cmd_down() {
  for f in "$BACKEND_PID_FILE" "$TUNNEL_PID_FILE"; do
    if is_running "$f"; then
      pid=$(cat "$f")
      log "stopping pid $pid"
      kill "$pid" 2>/dev/null || true
      # give it a moment; force if needed
      for _ in 1 2 3; do sleep 1; kill -0 "$pid" 2>/dev/null || break; done
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$f"
  done
  rm -f "$TUNNEL_URL_FILE"
  ok "stopped (postgres container left running — 'docker compose down' to clear)"
}

cmd_status() {
  echo -e "${c_b}postgres:${c_reset}"
  docker compose ps postgres 2>/dev/null | tail -n +1 || true
  echo
  echo -n -e "${c_b}backend:${c_reset}  "
  if is_running "$BACKEND_PID_FILE"; then
    echo -e "${c_green}running${c_reset} (pid $(cat "$BACKEND_PID_FILE"))"
    curl -sf http://localhost:3001/health | head -c 200 && echo
  else
    echo -e "${c_red}stopped${c_reset}"
  fi
  echo
  echo -n -e "${c_b}tunnel:${c_reset}   "
  if is_running "$TUNNEL_PID_FILE"; then
    echo -e "${c_green}running${c_reset} (pid $(cat "$TUNNEL_PID_FILE"))"
    [[ -f "$TUNNEL_URL_FILE" ]] && echo "  url: $(cat "$TUNNEL_URL_FILE")"
  else
    echo -e "${c_red}stopped${c_reset}"
  fi
  echo
  echo -e "${c_b}pages:${c_reset}    $PAGES_URL"
}

cmd_url() {
  if [[ -f "$TUNNEL_URL_FILE" ]]; then
    cat "$TUNNEL_URL_FILE"
  else
    err "no tunnel URL recorded. run: ./scripts/demo.sh up"
    exit 1
  fi
}

case "${1:-}" in
  up)     cmd_up ;;
  down)   cmd_down ;;
  status) cmd_status ;;
  url)    cmd_url ;;
  *)
    echo "usage: $0 {up|down|status|url}"
    exit 2
    ;;
esac
