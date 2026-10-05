# Code Review Assistant

An AI-powered code review workspace built with Next.js, Express, TypeScript, and MongoDB.

## Setup

1. Install Node.js 22 or newer.
2. Copy `server\.env.example` to `server\.env` and replace the placeholder secrets.
3. Copy `client\.env.example` to `client\.env.local`.
4. Start MongoDB with `docker compose up -d mongo`.
5. Install dependencies from the repository root:

   ```powershell
   npm install
   ```

6. Start both applications:

   ```powershell
   npm run dev
   ```

The web app runs at `http://localhost:3000`; the API health endpoint is `http://localhost:4000/health`.

## Environment

`JWT_SECRET` must contain at least 32 characters. `ENCRYPTION_KEY` must be exactly 64 hexadecimal characters (32 bytes) for AES-256-GCM. Never commit `.env` files or provider API keys.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the design and implementation roadmap.
