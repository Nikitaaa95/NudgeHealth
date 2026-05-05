const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reminder_templates WHERE doctor_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { title, message, reminder_type } = req.body;
  if (!title || !message || !reminder_type) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const result = await pool.query(
      'INSERT INTO reminder_templates (doctor_id, title, message, reminder_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, message, reminder_type]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, message, reminder_type } = req.body;
  try {
    const result = await pool.query(
      'UPDATE reminder_templates SET title=$1, message=$2, reminder_type=$3 WHERE id=$4 AND doctor_id=$5 RETURNING *',
      [title, message, reminder_type, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reminder_templates WHERE id = $1 AND doctor_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
