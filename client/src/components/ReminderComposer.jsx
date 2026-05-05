import { useState, useEffect } from 'react';
import { api } from '../api';

const REMINDER_TYPES = [
  { value: 'medication', label: 'Medication' },
  { value: 'lab', label: 'Lab / Test' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'general', label: 'General' },
];

export default function ReminderComposer({ patient, onSent, onCancel }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [reminderType, setReminderType] = useState('general');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(console.error);
  }, []);

  function applyTemplate(template) {
    setSelectedTemplate(template);
    setMessage(template.message);
    setReminderType(template.reminder_type);
  }

  function clearTemplate() {
    setSelectedTemplate(null);
    setMessage('');
    setReminderType('general');
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return setError('Message is required');
    setError('');
    setLoading(true);
    try {
      const reminder = await api.sendReminder({
        patient_id: patient.id,
        template_id: selectedTemplate?.id || null,
        message,
        reminder_type: reminderType,
      });
      onSent(reminder);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-card composer">
      <h3>Send Reminder to {patient.name}</h3>
      {!patient.email && (
        <div className="warning-banner">No email on file — reminder will be logged but not delivered.</div>
      )}

      {templates.length > 0 && (
        <div className="template-picker">
          <p className="template-picker-label">Use a template</p>
          <div className="template-chips">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`template-chip ${selectedTemplate?.id === t.id ? 'selected' : ''}`}
                onClick={() => selectedTemplate?.id === t.id ? clearTemplate() : applyTemplate(t)}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend}>
        <div className="form-group">
          <label>Reminder Type</label>
          <div className="type-pills">
            {REMINDER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`type-pill ${reminderType === t.value ? 'selected' : ''}`}
                onClick={() => setReminderType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Type your reminder message..."
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : `Send${patient.email ? ' via Email' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}
