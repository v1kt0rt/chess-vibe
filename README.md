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
