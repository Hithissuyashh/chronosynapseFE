# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploying to Vercel

1. Import the repository in Vercel. Framework preset: **Other** (build command `npm run build`,
   output is produced by Nitro's Vercel preset automatically — no output directory override needed).
2. Add the environment variable `VITE_SCIENCE_API_URL` pointing at the **HTTPS** URL of the
   FastAPI science backend. Without it the app falls back to `http://127.0.0.1:8000`, which a
   deployed HTTPS page cannot reach (the UI then shows an explicit "backend unreachable" state
   instead of fabricating values).
3. Static assets (`/logo.png`, `/favicon.png`, `/robots.txt`) are served from `public/` and are
   same-origin, so no CDN or asset configuration is required.
4. Ensure the backend sends CORS headers allowing the Vercel domain.
