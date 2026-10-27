# Vue 3 + Vite Chessboard Demo

A Vue 3 + Vite project that renders an interactive chessboard using `vue3-chessboard`.

## Project Setup

### Install Dependencies
```bash
npm install
```

## Development

### Run Dev Server
```bash
npm run dev
```

This will start the development server with Hot Module Replacement (HMR) enabled. Open your browser and navigate to:
```
http://localhost:5173/
```

The application will automatically reload when you make changes to any Vue components.

To expose the app for mobile testing on local network:
```bash
npm run dev -- --host
```
Check ip-address of the wifi adapter with ipconfig.

## Build Timestamp

The page footer shows when the app was built (UTC, e.g. `Build: 2026-10-27 21:30 UTC`). The timestamp is injected by Vite at build time via `define` in `vite.config.js`; in dev mode it shows when the dev server was started.

## Testing

Unit tests use [Vitest](https://vitest.dev/) and live next to the code (`*.test.js`).
```bash
npm test            # run once
npm run test:watch  # re-run on file changes
```

## Build

### Build for Production
```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

This allows you to preview the production build locally before deployment.

## Project Structure

```
src/
├── main.js           # App entry point
├── App.vue           # Root Vue component
└── components/
    └── Main.vue      # Chessboard component

index.html           # HTML template
vite.config.js       # Vite configuration
package.json         # Dependencies and scripts
```

## Learn More

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [vue3-chessboard](https://github.com/qwerty084/vue3-chessboard)
