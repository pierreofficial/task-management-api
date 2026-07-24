.PHONY: help install generate migrate migrate-dev seed test dev start up down reset

help:
	@echo "Available commands:"
	@echo "  make install      Install npm dependencies"
	@echo "  make generate     Generate Prisma client"
	@echo "  make migrate      Apply database migrations (deploy)"
	@echo "  make migrate-dev  Create/apply migrations in development"
	@echo "  make seed         Seed the database with sample data"
	@echo "  make test         Run the test suite"
	@echo "  make dev          Start the API with nodemon"
	@echo "  make start        Start the API"
	@echo "  make up           Start app + DB with docker compose"
	@echo "  make down         Stop docker compose services"
	@echo "  make reset        Reinstall deps, generate client, migrate, seed"

install:
	npm install

generate:
	npx prisma generate

migrate:
	npx prisma migrate deploy

migrate-dev:
	npx prisma migrate dev

seed:
	npm run seed

test:
	npm test

dev:
	npm run dev

start:
	npm start

up:
	docker compose up --build

down:
	docker compose down

reset: install generate migrate seed
