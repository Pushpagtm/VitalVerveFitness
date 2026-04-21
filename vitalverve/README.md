# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
   parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
   },
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Docker

### Development (with hot reload)

From the `vitalverve` folder:

```bash
docker compose up --build
```

This starts:

- Frontend: `http://localhost:5173`
- Auth API: `http://localhost:4000`
- PostgreSQL: `localhost:5432` (db: `vitalverve`)

If you need a clean restart:

```bash
docker compose down -v
docker compose up --build
```

### Production build and run

Build the image:

```bash
docker build -t vitalverve:prod .
```

Run the container:

```bash
docker run --rm -p 8080:80 vitalverve:prod
```

App runs at `http://localhost:8080`.

## Authentication + Database

This project now includes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- PostgreSQL database (configure with `.env`)

### Run frontend + backend together

From the repository root:

```bash
npm --prefix vitalverve run dev:full
```

- Frontend: `http://localhost:5173`
- Auth API: `http://localhost:4000`

### Environment variables

Copy `.env.example` to `.env` inside `vitalverve` and update values:

```bash
cp vitalverve/.env.example vitalverve/.env
```

Set these PostgreSQL variables in `.env`:

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
