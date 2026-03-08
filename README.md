# Naat Web App

A full-stack web application for uploading, sharing, and listening to Naats (Islamic devotional poetry/audio). Built with a vanilla HTML/CSS/JS frontend and a Node.js + Express backend connected to a PostgreSQL database.

---

## Project Structure

```
Web Project/
├── Client/
│   ├── Pages/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── naats.html
│   │   ├── upload.html
│   │   └── profile.html
│   ├── Public/          # Static audio files
│   └── style.css
│
└── Server/
    ├── Controllers/
    │   ├── authController.js
    │   ├── naatController.js
    │   ├── reportController.js
    │   └── userController.js
    ├── Middleware/
    │   ├── auth.js
    │   └── errorHandler.js
    ├── Routes/
    │   ├── authRoutes.js
    │   ├── naatRoutes.js
    │   ├── userRoutes.js
    │   ├── reportRoutes.js
    │   └── adminRoutes.js
    ├── db.js
    ├── cache.js
    ├── index.js
    └── package.json
```

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT)
- **File Uploads:** Multer
- **Environment Config:** dotenv

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. **Install server dependencies:**
   ```bash
   cd "Web Project/Server"
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file inside `Web Project/Server/` (use `.env.example` as a template):
   ```env
   PGUSER=your_postgres_username
   PGHOST=localhost
   PGDATABASE=NaatDb
   PGPASSWORD=your_postgres_password
   PGPORT=5432
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=1h
   ```

4. **Set up the PostgreSQL database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE NaatDb;"
   ```

5. **Run the server:**
   ```bash
   node index.js
   ```

6. **Open the frontend:**

   Open `Web Project/Client/Pages/index.html` in your browser, or serve it via a static server.

---

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/naats` | Get all naats |
| POST | `/api/naats/upload` | Upload a new naat (auth required) |
| GET | `/api/users/profile` | Get user profile (auth required) |
| POST | `/api/reports` | Submit a report |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PGUSER` | PostgreSQL username |
| `PGHOST` | PostgreSQL host |
| `PGDATABASE` | Database name |
| `PGPASSWORD` | Database password |
| `PGPORT` | PostgreSQL port (default: 5432) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | JWT expiry duration (e.g. `1h`) |

> ⚠️ **Never commit your `.env` file.** It is excluded via `.gitignore`.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](https://choosealicense.com/licenses/mit/)
