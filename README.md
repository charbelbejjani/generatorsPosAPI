# generatorsPosAPI

Express + MySQL backend scaffold (JavaScript) ready for consumption by a React TypeScript frontend.

Getting started

1. Install dependencies

```bash
npm install
```

2. Create `.env` from the example and update values

```bash
cp .env.example .env
# then edit .env to set DB credentials
```

3. Create the `users` table in MySQL (example)

```sql
CREATE DATABASE IF NOT EXISTS generators_pos;
USE generators_pos;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Run the server

```bash
npm run dev
# or
npm start
```

API

- GET `/api/users` - list users
- GET `/api/users/:id` - single user
- POST `/api/users` - create user { name, email }

Files

- [src/index.js](src/index.js) - entry
- [src/config/db.js](src/config/db.js) - mysql pool
- [src/routes](src/routes) - routers
- [src/controllers](src/controllers) - controllers
- [src/services](src/services) - database services
