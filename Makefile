.PHONY: dev test migrate seed up down build

dev:
	npm run dev

test:
	npm test

migrate:
	npx prisma migrate deploy

seed:
	npm run seed

up:
	docker compose up --build

down:
	docker compose down

build:
	npx prisma generate