# Gather frontend

React + Vite frontend for the public event API at `https://intellipaat-bootcamp.onrender.com`.

## Run locally

```sh
npm install
npm run dev
```

The frontend reads its API base URL from `VITE_API_BASE_URL`. The local `.env` file is set to `https://intellipaat-bootcamp.onrender.com`. `render.yaml` sets the same variable for the deployed static site; Vite embeds it during the production build.

The frontend loads every public user ID from `GET /api/users?role=all` by default. The role dropdown can narrow the ID dropdown to Students, Admins, or Organizers. The Student interface browses and registers for events, the Organizer interface shows events assigned to the selected organizer and their attendees, and the Admin interface shows event and role-directory summaries. These are client-side views only; all API endpoints remain public and roles do not restrict access.
