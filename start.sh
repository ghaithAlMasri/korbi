#!/bin/bash

# Start backend
(cd fastapi_backend && ./start.sh) &

# Start frontend
(cd nextjs-frontend && pnpm dev) &

wait
