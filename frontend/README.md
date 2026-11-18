# Gather frontend

React + Vite frontend for the public event API at `https://intellipaat-bootcamp.onrender.com`.

## Run locally

```sh
npm install
npm run dev
```

The frontend reads its API base URL from `VITE_API_BASE_URL`. The local `.env` file is set to `https://intellipaat-bootcamp.onrender.com`. `render.yaml` sets the same variable for the deployed static site; Vite embeds it during the production build.

The frontend loads role-filtered public user IDs from `GET /api/users?role=student|admin|organizer`. Select a role and one of its IDs to register or look up registrations. The backend must be redeployed with this endpoint before the role and ID selectors can load data.
