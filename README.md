# Korbi

AI-powered documentation editor. Chat with your docs, request changes, review diffs.

## Run locally

```bash
# 1. Set your OpenAI key
cp fastapi_backend/.env.example fastapi_backend/.env
# Edit fastapi_backend/.env and add your OPENAI_API_KEY

# 2. Install frontend deps
cd nextjs-frontend && pnpm install && cd ..

# 3. Start both servers
./start.sh
```

Or with Docker:

```bash
docker compose up
```

Frontend: http://localhost:3000
Backend: http://localhost:8000

## Tests

```bash
cd fastapi_backend
pytest -m "not ai"    # unit tests
pytest -m ai          # AI evals (calls OpenAI)
```
