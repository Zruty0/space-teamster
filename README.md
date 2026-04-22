# Space Teamster

2D side-on space trucker prototype built with TypeScript and raw Canvas 2D.

## Requirements
- Node.js 18+ recommended
- npm

## Install
```bash
npm install
```

## Run locally
Start the Vite dev server:
```bash
npm run dev
```

Default local URL:
```text
http://localhost:5173/
```

If you want to bind a specific host/port:
```bash
npm run dev -- --host 0.0.0.0 --port 4173
```

Example URL for that:
```text
http://localhost:4173/
```

## Build
Create a production build:
```bash
npm run build
```

Output goes to:
```text
dist/
```

## Preview production build
After building, serve the built app locally:
```bash
npm run preview
```

You can also pass host/port flags:
```bash
npm run preview -- --host 0.0.0.0 --port 4173
```

## Project scripts
- `npm run dev` — start development server
- `npm run build` — type-check and build for production
- `npm run preview` — serve the built app locally
