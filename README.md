# NudgeHealth

A patient reminder tool built for busy clinicians. NudgeHealth lets doctors send structured, personalized reminders to their patients for medications, lab tests, and upcoming appointments — and automatically follows up so nothing slips through the cracks.

## What it does

**Medication reminders** — Prescribe a medication and send the patient a reminder with the name, dosage, how often to take it, and when to stop. Check "recurring reminders" to have the system automatically email the patient at the right times every day until their end date.

**Lab test reminders** — Send patients the details they need for an upcoming lab: the test name, type (blood draw, MRI, etc.), appointment date and time, location, and step-by-step directions to get there. If you've sent patients to that location before, directions auto-fill.

**Appointment reminders** — Remind patients of upcoming appointments with the date, time, location, and any directions they need.

**Reminder templates** — Save your most-used reminders as templates so you can send them in seconds. Medication templates store the full regimen; lab templates remember locations and directions.

**Patient profiles** — Keep a record of every patient and their full reminder history in one place.

## Tech stack

- **Frontend:** React + Vite, deployed on Vercel
- **Backend:** Node.js + Express, deployed on Render
- **Database:** PostgreSQL on Neon
- **Email:** Resend
- **Scheduled reminders:** node-cron

## Running locally

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Add your environment variables
cp server/.env.example server/.env
# Fill in: DATABASE_URL, JWT_SECRET, RESEND_API_KEY, FROM_EMAIL

# Start the backend
cd server && npm run dev

# Start the frontend (new terminal)
cd client && npm run dev
```

---

*With love and gratitude to Dr. Arthi Rao for the idea that sparked this. 🩺*