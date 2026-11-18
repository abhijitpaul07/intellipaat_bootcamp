# Events API

Flask API backed by Supabase. Render starts it with Gunicorn using `render.yaml`.

## Deploy on Render

1. Push this `backend` folder to a Git repository, or connect the repository that contains it.
2. In Render, create a **Blueprint** and select the repository. If `backend` is a subdirectory, set the Blueprint's root directory to `backend`.
3. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in the service environment settings.
4. Deploy. Render installs `requirements.txt` and runs `gunicorn app:app`.

The local `.env` file is ignored by Git. Use `.env.example` as a template for local setup; add the same variable names to Render's environment settings.

## API routes

- `GET /api/events`
- `GET /api/events/<id>`
- `GET /api/users?role=all|student|admin|organizer` (role defaults to `all`; student results also include attendee records; results are paginated server-side)
- `POST /api/registrations` with JSON `{"user_id":"...","event_id":"..."}`
- `GET /api/me/registrations?user_id=<uuid>`
- `GET /api/events/<id>/registrations`

All routes are public, and CORS allows any origin, as configured for this project.
