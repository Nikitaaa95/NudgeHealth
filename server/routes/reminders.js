const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { Resend } = require('resend');

const router = express.Router();
router.use(auth);

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', async (req, res) => {
  const { patient_id, template_id, message, reminder_type } = req.body;
  if (!patient_id || !message || !reminder_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const patientResult = await pool.query(
      'SELECT * FROM patients WHERE id = $1 AND doctor_id = $2',
      [patient_id, req.user.id]
    );
    const patient = patientResult.rows[0];
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const doctorResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const doctorName = doctorResult.rows[0]?.name || 'Your doctor';

    if (patient.email) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: patient.email,
        subject: `Reminder from ${doctorName}`,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p><p style="color:#888;font-size:12px;margin-top:24px;">Sent by ${doctorName} via NudgeHealth</p>`,
      });
    }

    const result = await pool.query(
      'INSERT INTO reminders (doctor_id, patient_id, template_id, message, reminder_type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, patient_id, template_id || null, message, reminder_type, patient.email ? 'sent' : 'no_email']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, p.name as patient_name, rt.title as template_title
       FROM reminders r
       JOIN patients p ON r.patient_id = p.id
       LEFT JOIN reminder_templates rt ON r.template_id = rt.id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
