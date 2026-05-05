const cron = require('node-cron');
const { pool } = require('./db');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function calculateNextSend(reminderTimes) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sorted = [...reminderTimes].sort();

  for (const time of sorted) {
    const candidate = new Date(`${todayStr}T${time}:00`);
    if (candidate > now) return candidate;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return new Date(`${tomorrowStr}T${sorted[0]}:00`);
}

function startScheduler() {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      const { rows } = await pool.query(
        `SELECT sr.*, p.email, p.name AS patient_name, u.name AS doctor_name
         FROM scheduled_reminders sr
         JOIN patients p ON sr.patient_id = p.id
         JOIN users u ON sr.doctor_id = u.id
         WHERE sr.active = true AND sr.next_send_at <= $1 AND sr.end_date >= $2`,
        [now, todayStr]
      );

      for (const reminder of rows) {
        if (reminder.email) {
          await resend.emails.send({
            from: process.env.FROM_EMAIL,
            to: reminder.email,
            subject: `Medication reminder from ${reminder.doctor_name}`,
            text: reminder.message,
            html: `<p>${reminder.message.replace(/\n/g, '<br>')}</p><p style="color:#888;font-size:12px;margin-top:24px;">Sent by ${reminder.doctor_name} via NudgeHealth</p>`,
          });
        }

        await pool.query(
          'INSERT INTO reminders (doctor_id, patient_id, message, reminder_type, status) VALUES ($1, $2, $3, $4, $5)',
          [reminder.doctor_id, reminder.patient_id, reminder.message, 'medication', reminder.email ? 'sent' : 'no_email']
        );

        const nextSend = calculateNextSend(reminder.reminder_times);
        const endOfEndDate = new Date(`${reminder.end_date}T23:59:59`);

        if (nextSend > endOfEndDate) {
          await pool.query('UPDATE scheduled_reminders SET active = false WHERE id = $1', [reminder.id]);
        } else {
          await pool.query('UPDATE scheduled_reminders SET next_send_at = $1 WHERE id = $2', [nextSend, reminder.id]);
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  });

  console.log('Reminder scheduler started');
}

module.exports = { startScheduler };
