# jai.lu

This branch is showcasing a simple implementation yet fully functional and full featured without relying on AI. This provides an alternative view of my skills in perspective to the `main` branch which showcases my use of AI in an agentic engineering.

## Install

1. Checkout the repo and `cd` into it.
2. `pnpm install`
3. Copy `.env.example` to `.env` (you can optionally tweak the values if needed)

## Run

You will need 2 different running shells: one for docker compose and the other for the front and the back.

1. `pnpm dev:compose` -> starts the docker compose injecting the env vars.
2. `pnpm dev` -> starts both frontend (`apps/web`) and backend (`apps/api`).

## Stack

The technical stack is very simple and uses modular libraries rather than a huge framework.

### Frontend

The whole app is an SPA, even though currently it's just server side generated pages using vite dev mode, but it could easily be built and served as static SPA.

The rest is about the usual suspects: zod for validation schemas, hono's RPC client (as I used hono for the backend) which provides type sharing for free, TanStack Query for query state management and last but not least shadcn/ui for the base components.

### Backend

The backend was built with hono to take advantage of its flexible and simple API as well as its RPC feature (as mentioned above).

Database is handled with kysely, a peculiar choice for some people, but I tend with time to agree that ORMs are not well suited for both big or small projects; I rather use a flexible and extensible library over a bloated ORM. Plus typing works super well.

## Hygienie

While there are no tests (the guardrailing was mostly done on the AI version), the whole codebase is well formatted and linted with `oxc` suite.

The scaffolding was kept equally simple: two apps, one shared package holding common constants and schemas.

Some efforts were put to split things over the scaffolding to showcase separation of the code as well as present my particular appreciation of the Separation of Concerns ideal.

## Improvements

Overall this is a tiny portion of what can and should be done, as the `main` branch demonstrates. I kept it simple and concise as requested in the instructions.
