# SCIM College Portal — Backend

Backend for the SCIM College, Patna BBA/BCA academic portal.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT in secure httpOnly cookies
- bcrypt password hashing
- Nodemailer SMTP email OTP
- Socket.io real-time notifications
- Google Gemini integration hook
- Helmet, rate limiting, validation and audit logging
- Multer protected material uploads

## 1. Install

```bash
npm install
```

Copy `.env.example` to `.env` and fill the values.

## 2. MongoDB

Set `MONGO_URI` to your MongoDB connection string.

Local example:

```env
MONGO_URI=mongodb://127.0.0.1:27017/scim_college
```

## 3. Seed the first administrator

Create an admin with environment variables:

Windows PowerShell:

```powershell
$env:SEED_ADMIN_EMAIL="admin@scimpatna.org"
$env:SEED_ADMIN_PASSWORD="ChangeMeImmediately123!"
$env:SEED_ADMIN_NAME="SCIM Portal Administrator"
npm run seed:admin
```

macOS/Linux:

```bash
SEED_ADMIN_EMAIL=admin@scimpatna.org SEED_ADMIN_PASSWORD='ChangeMeImmediately123!' SEED_ADMIN_NAME='SCIM Portal Administrator' npm run seed:admin
```

Change the password immediately in a real deployment.

## 4. Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Health check:

`GET /api/health`

## 5. Frontend (sibling folder)

This backend serves `../Frontend/public` automatically. Run only the backend:

```bash
npm run dev
```

Then open `http://localhost:5000`. Pages and `/api` share the same origin.

To run the static UI separately on port 3000:

```bash
npm run serve --prefix ../Frontend
```

API calls then go to `http://localhost:5000/api`. CORS is enabled for that origin.

## 6. Security model

- Students cannot self-register.
- Admin/co-member accounts are provisioned by authorized administrators.
- Student provisioning creates an inactive-until-email-verified account and sends a 7-digit verification OTP.
- Admin/co-member login requires a fresh 7-digit OTP.
- Password recovery OTPs are random, hashed in MongoDB and expire after 10 minutes.
- Passwords are bcrypt-hashed.
- JWT is stored in an httpOnly cookie.
- Protected routes enforce role/permission checks.
- Material files are served through authenticated routes instead of public static access.
- Test submission records tab-switch count and server-side timestamps.
- Audit logs capture sensitive admin actions.
- Login, OTP and recovery endpoints are rate limited.
- Helmet adds common HTTP security headers.

## 7. Important deployment notes

For production:
1. Use HTTPS.
2. Set `NODE_ENV=production`.
3. Use a strong random `JWT_SECRET`.
4. Use a real SMTP provider or verified Gmail app password.
5. Restrict MongoDB network access.
6. Store uploads on private object storage for high-volume deployments.
7. Put the app behind a reverse proxy such as Nginx.
8. Add a backup/restore strategy for MongoDB.
9. Review retention and privacy rules for camera/proctoring data.
10. Never commit `.env`, SMTP credentials or Gemini API keys.

## API surface

### Auth
- `POST /api/auth/login`
- `POST /api/auth/verify-otp`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Public
- `POST /api/public/feedback`

### Student
- `GET /api/student/me`
- `GET /api/student/materials`
- `GET /api/student/materials/:id/view`
- `GET /api/student/notices`
- `GET /api/student/tests`
- `POST /api/student/tests/submit`
- `POST /api/student/doubts`
- `POST /api/student/tutor`

### Admin / co-member
- `GET /api/admin/dashboard`
- `GET /api/admin/students`
- `POST /api/admin/students`
- `PATCH /api/admin/students/:id/status`
- `POST /api/admin/notices`
- `GET /api/admin/notices`
- `POST /api/admin/materials`
- `GET /api/admin/materials`
- `POST /api/admin/tests`
- `GET /api/admin/tests`
- `GET /api/admin/doubts`

See `tests/*.http` for REST Client examples.
