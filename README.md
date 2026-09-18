# MedTimeline AI — Medical Document Intelligence & Patient Timeline
(Hackathon problem statement HE-05)

An end-to-end prototype that uses Gemini AI to extract structured information
from medical documents (PDF/JPG/PNG) and automatically builds a chronological
patient timeline, plus an AI assistant that answers questions using only the
stored patient records.

## Stack
- Frontend: React + Vite, React Router
- Backend: Node.js + Express
- Database & Auth: Supabase (PostgreSQL + Supabase Auth)
- Storage: Supabase Storage
- AI: Gemini API (Google AI Studio) — `gemini-3.6-flash`

## Project structure
```
medapp/
  backend/       Express API, Gemini extraction, Supabase service-role access
  frontend/      React app (user + admin dashboards)
  database/      SQL: schema, RLS policies, demo seed data
```

## 1. Set up Supabase
1. Create a project at https://supabase.com.
2. In the SQL editor, run in order:
   - `database/schema.sql`
   - `database/rls_policies.sql`
3. Create a Storage bucket named `medical-documents` (Storage → New bucket).
   Mark it public for the hackathon demo (simplest for `getPublicUrl`), or keep
   it private and switch the backend to signed URLs if you need real privacy.
4. Copy your Project URL, `anon` public key, and `service_role` key from
   Project Settings → API.

## 2. Create the first admin account (do this manually — never via the app)
1. Register a normal account through the app (or Supabase Auth dashboard).
2. In the SQL editor:
   ```sql
   update profiles set role = 'admin' where email = 'your-admin@example.com';
   ```
There is intentionally no public admin signup route.

## 3. Get a Gemini API key
Create one at https://aistudio.google.com/app/apikey.

## 4. Backend setup
```bash
cd backend
cp .env.example .env      # fill in Supabase + Gemini values
npm install
npm run dev                # http://localhost:5000
```

## 5. Frontend setup
```bash
cd frontend
cp .env.example .env      # fill in Supabase URL/anon key + API URL
npm install
npm run dev                # http://localhost:5173
```

## 6. Demo data
`database/seed_demo_data.sql` has one fictional patient (Ananya Kumar, P1001).
Replace `YOUR_USER_UUID` with a real profile id before running it, or just
add a patient through the UI — it's faster for a live demo.

## Notes / known limits (be upfront about these if asked)
- This is a hackathon prototype, not production-ready for real patient data.
- Document processing runs as a simple fire-and-forget async function with
  in-memory retry (max 2 attempts); there's no job queue. Fine for a demo,
  not for production load.
- `medical_records`, `timeline_events`, and `activity_logs` are written using
  the Supabase **service role** key from the backend (RLS is bypassed there
  by design) — never expose that key to the frontend.
- The AI assistant only ever receives the selected patient's stored
  timeline/records as context, and is explicitly prompted not to invent
  information or diagnose.

## API summary
See `backend/src/routes/*.js` — every route file is commented with its
purpose, auth requirement and role requirement. Quick map:
- `/api/auth/*` — register, me
- `/api/patients/*` — CRUD (auth required)
- `/api/documents/*` — upload, list, get, retry (auth required)
- `/api/records/:patientId` — extracted medical records (auth required)
- `/api/timeline/:patientId` — chronological timeline (auth required)
- `/api/assistant/ask` — AI patient assistant (auth required)
- `/api/admin/*` — stats, users, patients, documents, activity (admin only)
