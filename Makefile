# Makefile

BACKEND_DIR=fastapi_backend
FRONTEND_DIR=nextjs-frontend
DOCKER_COMPOSE=docker compose

# Local development
start-backend:
	cd $(BACKEND_DIR) && ./start.sh

start-frontend:
	cd $(FRONTEND_DIR) && ./start.sh

# Docker
docker-build:
	$(DOCKER_COMPOSE) build --no-cache

docker-up:
	$(DOCKER_COMPOSE) up

docker-start-backend:
	$(DOCKER_COMPOSE) up backend

docker-start-frontend:
	$(DOCKER_COMPOSE) up frontend

docker-backend-shell:
	$(DOCKER_COMPOSE) run --rm backend sh

docker-frontend-shell:
	$(DOCKER_COMPOSE) run --rm frontend sh
