import { useState, useEffect } from 'react';
import { api } from '../api';

const REMINDER_TYPES = [
  { value: 'medication', label: 'Medication' },
  { value: 'lab', label: 'Lab / Test' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'general', label: 'General' },
];

const EMPTY_MED = { medication_name: '', dosage: '', frequency: '', stop_taking: '' };
const EMPTY_LAB = { test_name: '', test_type: '', appointment_date: '', appointment_time: '', location: '', directions: '' };
const EMPTY_APPT = { appointment_date: '', appointment_time: '', location: '', directions: '' };

function buildMedMessage(firstName, { medication_name, dosage, frequency, stop_taking }) {
  const med = medication_name || '[medication]';
  const dose = dosage ? ` (${dosage})` : '';
  const freq = frequency ? ` ${frequency}` : '';
  const stop = stop_taking ? ` You can stop taking it ${stop_taking}.` : '';
  return `Hi ${firstName},\n\nI just wanted to remind you that you'll need to take ${med}${dose}${freq}.${stop}\n\nPlease don't hesitate to reach out if you have any questions.`;
}

function buildApptMessage(firstName, { appointment_date, appointment_time, location, directions }) {
  const when = appointment_date
    ? ` on ${appointment_date}${appointment_time ? ` at ${appointment_time}` : ''}`
    : '';
  const loc = location ? `\n\nYour appointment is at ${location}.` : '';
  const dir = directions ? `\n\n${directions}` : '';
  return `Hi ${firstName},\n\nI just wanted to remind you that you have an upcoming appointment${when}.${loc}${dir}\n\nPlease don't hesitate to reach out if you have any questions.`;
}

function buildLabMessage(firstName, { test_name, test_type, appointment_date, appointment_time, location, directions }) {
  const test = [test_type, test_name].filter(Boolean).join(' — ') || '[lab test]';
  const when = appointment_date
    ? ` on ${appointment_date}${appointment_time ? ` at ${appointment_time}` : ''}`
    : '';
  const loc = location ? `\n\nPlease go to ${location}.` : '';
  const dir = directions ? `\n\n${directions}` : '';
  return `Hi ${firstName},\n\nI just wanted to remind you that you have a ${test} scheduled${when}.${loc}${dir}\n\nPlease don't hesitate to reach out if you have any questions.`;
}

export default function ReminderComposer({ patient, onSent, onCancel }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [reminderType, setReminderType] = useState('general');
  const [med, setMed] = useState(EMPTY_MED);
  const [lab, setLab] = useState(EMPTY_LAB);
  const [appt, setAppt] = useState(EMPTY_APPT);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const firstName = patient.name.split(' ')[0];

  useEffect(() => {
    api.getTemplates().then(setTemplates).catch(console.error);
  }, []);

  function applyTemplate(template) {
    setSelectedTemplate(template);
    setReminderType(template.reminder_type);
    if (template.reminder_type === 'medication' && template.metadata) {
      setMed(template.metadata);
      setLab(EMPTY_LAB);
      setMessage(buildMedMessage(firstName, template.metadata));
    } else if (template.reminder_type === 'lab' && template.metadata) {
      setLab(template.metadata);
      setMed(EMPTY_MED);
      setMessage(buildLabMessage(firstName, template.metadata));
    } else if (template.reminder_type === 'appointment' && template.metadata) {
      setAppt(template.metadata);
      setMed(EMPTY_MED);
      setLab(EMPTY_LAB);
      setMessage(buildApptMessage(firstName, template.metadata));
    } else {
      setMed(EMPTY_MED);
      setLab(EMPTY_LAB);
      setAppt(EMPTY_APPT);
      setMessage(template.message.replace(/\[Patient First Name\]/g, firstName));
    }
  }

  function clearTemplate() {
    setSelectedTemplate(null);
    setMessage('');
    setReminderType('general');
    setMed(EMPTY_MED);
    setLab(EMPTY_LAB);
  }

  function handleTypeChange(value) {
    setReminderType(value);
    setSelectedTemplate(null);
    setMed(EMPTY_MED);
    setLab(EMPTY_LAB);
    setAppt(EMPTY_APPT);
    if (value === 'medication') setMessage(buildMedMessage(firstName, EMPTY_MED));
    else if (value === 'lab') setMessage(buildLabMessage(firstName, EMPTY_LAB));
    else if (value === 'appointment') setMessage(buildApptMessage(firstName, EMPTY_APPT));
    else setMessage('');
  }

  function updateMed(e) {
    const updated = { ...med, [e.target.name]: e.target.value };
    setMed(updated);
    setMessage(buildMedMessage(firstName, updated));
  }

  function updateAppt(e) {
    const updated = { ...appt, [e.target.name]: e.target.value };
    setAppt(updated);
    setMessage(buildApptMessage(firstName, updated));
  }

  function updateLab(e) {
    let updated = { ...lab, [e.target.name]: e.target.value };
    if (e.target.name === 'location') {
      const match = templates.find(
        (t) => t.reminder_type === 'lab' && t.metadata?.location?.toLowerCase() === e.target.value.toLowerCase() && t.metadata?.directions
      );
      if (match) updated.directions = match.metadata.directions;
    }
    setLab(updated);
    setMessage(buildLabMessage(firstName, updated));
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
                onClick={() => handleTypeChange(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {reminderType === 'lab' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Test Name</label>
                <input name="test_name" value={lab.test_name} onChange={updateLab} placeholder="e.g. Lipid Panel" />
              </div>
              <div className="form-group">
                <label>Test Type</label>
                <input name="test_type" value={lab.test_type} onChange={updateLab} placeholder="e.g. Blood Draw, Urinalysis, MRI" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Appointment Date</label>
                <input name="appointment_date" type="date" value={lab.appointment_date} onChange={updateLab} />
              </div>
              <div className="form-group">
                <label>Appointment Time</label>
                <input name="appointment_time" type="time" value={lab.appointment_time} onChange={updateLab} />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" value={lab.location} onChange={updateLab} placeholder="e.g. Keck Hospital Lab, 1500 San Pablo St" />
            </div>
            <div className="form-group">
              <label>Directions</label>
              <textarea name="directions" value={lab.directions} onChange={(e) => { const updated = { ...lab, directions: e.target.value }; setLab(updated); setMessage(buildLabMessage(firstName, updated)); }} rows={3} placeholder="e.g. Enter through the main entrance, take the elevator to floor 2..." />
            </div>
          </>
        )}

        {reminderType === 'appointment' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Appointment Date</label>
                <input name="appointment_date" type="date" value={appt.appointment_date} onChange={updateAppt} />
              </div>
              <div className="form-group">
                <label>Appointment Time</label>
                <input name="appointment_time" type="time" value={appt.appointment_time} onChange={updateAppt} />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" value={appt.location} onChange={updateAppt} placeholder="e.g. Keck Medical Center, Suite 300" />
            </div>
            <div className="form-group">
              <label>Directions</label>
              <textarea name="directions" value={appt.directions} onChange={(e) => { const updated = { ...appt, directions: e.target.value }; setAppt(updated); setMessage(buildApptMessage(firstName, updated)); }} rows={3} placeholder="e.g. Park in structure B, take elevator to floor 3..." />
            </div>
          </>
        )}

        {reminderType === 'medication' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Medication Name</label>
                <input name="medication_name" value={med.medication_name} onChange={updateMed} placeholder="e.g. Metformin" />
              </div>
              <div className="form-group">
                <label>Dosage</label>
                <input name="dosage" value={med.dosage} onChange={updateMed} placeholder="e.g. 500mg" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Frequency</label>
                <input name="frequency" value={med.frequency} onChange={updateMed} placeholder="e.g. twice daily with food" />
              </div>
              <div className="form-group">
                <label>When to Stop</label>
                <input name="stop_taking" value={med.stop_taking} onChange={updateMed} placeholder="e.g. after 14 days" />
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
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
