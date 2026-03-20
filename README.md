# Hello World - Vue 3 + Vite

A simple Hello World web application built with Vue 3 and Vite.

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
    └── HelloWorld.vue # Hello World component

index.html           # HTML template
vite.config.js       # Vite configuration
package.json         # Dependencies and scripts
```

## Learn More

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
