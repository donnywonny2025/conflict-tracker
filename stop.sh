#!/bin/bash
# Stop all War Room processes
pkill -f "x-scraper.js daemon" 2>/dev/null
lsof -ti:8888 | xargs kill -9 2>/dev/null
rm -f "$(dirname "$0")/.x-session/SingletonLock" 2>/dev/null
echo "War Room stopped."
