# SCIM College, Patna — Academic Portal Frontend

Production-oriented multi-page frontend using HTML5, Bootstrap 5 and Vanilla JavaScript.

Pages:
- index.html — institutional landing page, notices and feedback
- login.html — student/admin login + 7-digit OTP UI
- forgot-password.html — OTP password recovery UI
- dashboard-student.html — materials, PDF viewer/watermark, tests, camera proctoring, doubts, AI tutor, calendar
- dashboard-admin.html — provisioning, materials, test builder, notices, team authorization, analytics

The UI is backend-ready. Authentication, RBAC, OTP generation/storage, hashing, secure httpOnly cookies, authorization, server-side audit logging and API validation must be enforced by the Express backend.

Run the Express backend from `../Backend` and open `http://localhost:5000`. It serves this `public/` folder and the API together.

Optional: `npm run serve` starts a static preview on port 3000 that talks to the API on port 5000.
