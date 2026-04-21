# VitalVerveFitness

Full-stack gym and fitness web app with:
- React + TypeScript frontend
- Express auth and booking API
- PostgreSQL database
- Docker Compose local environment

## Project Structure

- `vitalverve/` - main application (frontend + backend + Docker files)

## Main Features

- Login and signup authentication (JWT-based)
- Public website with fitness sections and contact form
- Member dashboard with:
  - class booking
  - booking cancellation
  - booking filters
  - schedule and stats
  - goals, achievements, and notifications
  - saved user preferences

## Run With Docker (Recommended)

From the `vitalverve` directory:

```bash
docker compose down -v
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Auth API: `http://localhost:4000`
- Postgres: Docker internal service (`postgres:5432`)

## Environment

Use:

```bash
cp vitalverve/.env.example vitalverve/.env
```

Then update values if needed (`JWT_SECRET`, Postgres credentials, etc.).

## API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/classes` (auth required)
- `GET /api/bookings` (auth required)
- `POST /api/bookings` (auth required)
- `DELETE /api/bookings/:bookingId` (auth required)

## Notes

- Detailed app-level setup is in `vitalverve/README.md`.