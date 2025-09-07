# CCTNS Server

TypeScript Node.js server for CCTNS.

## Scripts

- dev: Start in watch mode
- build: Compile TypeScript
- start: Run compiled server
- typecheck: TypeScript check only
- lint / lint:fix: Lint code
- format: Prettier formatting

## Getting started (Windows PowerShell)

1. Install Node.js 18+.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Copy env:
   ```powershell
   Copy-Item example.env .env
   ```
4. Start dev server:
   ```powershell
   npm run dev
   ```

Health check: GET /health -> { "status": "ok" }.