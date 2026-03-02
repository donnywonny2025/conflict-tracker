#!/bin/bash
# ════════════════════════════════════════════════
#  WAR ROOM — Startup Script
#  Launches server + X scraper daemon
# ════════════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  WAR ROOM — Intelligence Command Ctr  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Kill previous instances
echo -e "${CYAN}[1/4]${NC} Cleaning up old processes..."
pkill -f "x-scraper.js daemon" 2>/dev/null || true
lsof -ti:8888 | xargs kill -9 2>/dev/null || true
rm -f "$DIR/.x-session/SingletonLock" "$DIR/.x-session/SingletonSocket" "$DIR/.x-session/SingletonCookie" 2>/dev/null || true
sleep 1

# Check dependencies
echo -e "${CYAN}[2/4]${NC} Checking dependencies..."
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js not found${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${RED}❌ Python3 not found${NC}"; exit 1; }
[ -d "node_modules/playwright" ] || { echo -e "${RED}❌ Playwright not installed. Run: npm install${NC}"; exit 1; }
echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"
echo -e "  ${GREEN}✓${NC} Python $(python3 --version | cut -d' ' -f2)"

# Check X session
if [ ! -d "$DIR/.x-session" ]; then
    echo -e "\n${RED}⚠ No X session found.${NC}"
    echo -e "  Run: ${CYAN}node x-scraper.js login${NC}"
    echo -e "  Then re-run this script."
    exit 1
fi
echo -e "  ${GREEN}✓${NC} X session found"

# Start server
echo -e "${CYAN}[3/4]${NC} Starting server on :8888..."
nohup python3 -m uvicorn server:app --host 0.0.0.0 --port 8888 > /tmp/warroom-server.log 2>&1 &
SERVER_PID=$!
sleep 2

if curl -s http://localhost:8888/api/health > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Server running (PID $SERVER_PID)"
else
    echo -e "  ${RED}❌ Server failed to start. Check /tmp/warroom-server.log${NC}"
    exit 1
fi

# Start scraper daemon
echo -e "${CYAN}[4/4]${NC} Starting X scraper daemon (15 accounts, 1-min polling)..."
nohup node x-scraper.js daemon > /tmp/warroom-scraper.log 2>&1 &
SCRAPER_PID=$!
echo -e "  ${GREEN}✓${NC} Scraper running (PID $SCRAPER_PID)"

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  War Room is LIVE${NC}"
echo -e "${GREEN}  Dashboard: ${CYAN}http://localhost:8888/${NC}"
echo -e "${GREEN}  Server log:  /tmp/warroom-server.log${NC}"
echo -e "${GREEN}  Scraper log: /tmp/warroom-scraper.log${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  To stop: ${CYAN}./stop.sh${NC} or ${CYAN}pkill -f 'warroom|x-scraper'${NC}"
