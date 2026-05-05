const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db');
const { startScheduler } = require('./scheduler');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const templateRoutes = require('./routes/templates');
const reminderRoutes = require('./routes/reminders');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/reminders', reminderRoutes);

const PORT = process.env.PORT || 3001;

initDB().then(() => {
  startScheduler();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
