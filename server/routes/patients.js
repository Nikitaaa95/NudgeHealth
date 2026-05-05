const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM patients WHERE doctor_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await pool.query(
      'SELECT * FROM patients WHERE id = $1 AND doctor_id = $2',
      [req.params.id, req.user.id]
    );
    if (!patient.rows[0]) return res.status(404).json({ error: 'Patient not found' });

    const reminders = await pool.query(
      'SELECT r.*, rt.title as template_title FROM reminders r LEFT JOIN reminder_templates rt ON r.template_id = rt.id WHERE r.patient_id = $1 ORDER BY r.created_at DESC',
      [req.params.id]
    );

    res.json({ ...patient.rows[0], reminders: reminders.rows });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, phone, date_of_birth, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const result = await pool.query(
      'INSERT INTO patients (doctor_id, name, email, phone, date_of_birth, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, name, email, phone, date_of_birth || null, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { name, email, phone, date_of_birth, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE patients SET name=$1, email=$2, phone=$3, date_of_birth=$4, notes=$5 WHERE id=$6 AND doctor_id=$7 RETURNING *',
      [name, email, phone, date_of_birth || null, notes, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM patients WHERE id = $1 AND doctor_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
