import { useState, useEffect } from 'react';
import { api } from '../api';

const REMINDER_TYPES = [
  { value: 'medication', label: 'Medication' },
  { value: 'lab', label: 'Lab / Test' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'general', label: 'General' },
];

const TYPE_COLORS = {
  medication: '#4f8ef7',
  lab: '#f59e0b',
  appointment: '#10b981',
  general: '#8b5cf6',
};

function buildMedMessage({ medication_name, dosage, times_per_day, reminder_times, end_date }) {
  const med = medication_name || '[medication]';
  const dose = dosage ? ` (${dosage})` : '';
  const freq = times_per_day ? ` ${times_per_day}x daily` : '';
  const times = reminder_times?.filter(Boolean).length
    ? ` at ${reminder_times.filter(Boolean).join(', ')}`
    : '';
  const stop = end_date ? ` until ${end_date}` : '';
  return `Hi [Patient First Name],\n\nI just wanted to remind you that you'll need to take ${med}${dose}${freq}${times}${stop}.\n\nPlease don't hesitate to reach out if you have any questions.`;
}

function buildApptMessage({ appointment_date, appointment_time, location, directions }) {
  const when = appointment_date
    ? ` on ${appointment_date}${appointment_time ? ` at ${appointment_time}` : ''}`
    : '';
  const loc = location ? `\n\nYour appointment is at ${location}.` : '';
  const dir = directions ? `\n\n${directions}` : '';
  return `Hi [Patient First Name],\n\nI just wanted to remind you that you have an upcoming appointment${when}.${loc}${dir}\n\nPlease don't hesitate to reach out if you have any questions.`;
}

function buildLabMessage({ test_name, test_type, appointment_date, appointment_time, location, directions }) {
  const test = [test_type, test_name].filter(Boolean).join(' — ') || '[lab test]';
  const when = appointment_date
    ? ` on ${appointment_date}${appointment_time ? ` at ${appointment_time}` : ''}`
    : '';
  const loc = location ? `\n\nPlease go to ${location}.` : '';
  const dir = directions ? `\n\n${directions}` : '';
  return `Hi [Patient First Name],\n\nI just wanted to remind you that you have a ${test} scheduled${when}.${loc}${dir}\n\nPlease don't hesitate to reach out if you have any questions.`;
}

function TemplateForm({ template, allTemplates, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: template?.title || '',
    message: template?.message || '',
    reminder_type: template?.reminder_type || 'general',
  });
  const [med, setMed] = useState({
    medication_name: template?.metadata?.medication_name || '',
    dosage: template?.metadata?.dosage || '',
    times_per_day: template?.metadata?.times_per_day || 1,
    reminder_times: template?.metadata?.reminder_times || ['08:00'],
    end_date: template?.metadata?.end_date || '',
  });
  const [lab, setLab] = useState({
    test_name: template?.metadata?.test_name || '',
    test_type: template?.metadata?.test_type || '',
    appointment_date: template?.metadata?.appointment_date || '',
    appointment_time: template?.metadata?.appointment_time || '',
    location: template?.metadata?.location || '',
    directions: template?.metadata?.directions || '',
  });
  const [appt, setAppt] = useState({
    appointment_date: template?.metadata?.appointment_date || '',
    appointment_time: template?.metadata?.appointment_time || '',
    location: template?.metadata?.location || '',
    directions: template?.metadata?.directions || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updateMed(e) {
    let updated = { ...med, [e.target.name]: e.target.value };
    if (e.target.name === 'times_per_day') {
      const n = parseInt(e.target.value);
      const times = [...med.reminder_times];
      while (times.length < n) times.push('08:00');
      updated = { ...updated, times_per_day: n, reminder_times: times.slice(0, n) };
    }
    setMed(updated);
    setForm((f) => ({ ...f, message: buildMedMessage(updated) }));
  }

  function updateMedTime(index, value) {
    const times = [...med.reminder_times];
    times[index] = value;
    const updated = { ...med, reminder_times: times };
    setMed(updated);
    setForm((f) => ({ ...f, message: buildMedMessage(updated) }));
  }

  function updateLab(e) {
    let updated = { ...lab, [e.target.name]: e.target.value };
    if (e.target.name === 'location') {
      const match = allTemplates.find(
        (t) => t.reminder_type === 'lab' && t.metadata?.location?.toLowerCase() === e.target.value.toLowerCase() && t.metadata?.directions
      );
      if (match) updated.directions = match.metadata.directions;
    }
    setLab(updated);
    setForm((f) => ({ ...f, message: buildLabMessage(updated) }));
  }

  function updateAppt(e) {
    const updated = { ...appt, [e.target.name]: e.target.value };
    setAppt(updated);
    setForm((f) => ({ ...f, message: buildApptMessage(updated) }));
  }

  function handleTypeChange(value) {
    const next = { ...form, reminder_type: value };
    if (value === 'medication') next.message = buildMedMessage(med);
    else if (value === 'lab') next.message = buildLabMessage(lab);
    else if (value === 'appointment') next.message = buildApptMessage(appt);
    else next.message = '';
    setForm(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const metadata =
        form.reminder_type === 'medication' ? med :
        form.reminder_type === 'lab' ? lab :
        form.reminder_type === 'appointment' ? appt : null;
      const saved = template
        ? await api.updateTemplate(template.id, { ...form, metadata })
        : await api.createTemplate({ ...form, metadata });
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-card">
      <h3>{template ? 'Edit Template' : 'New Template'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title *</label>
          <input name="title" value={form.title} onChange={update} placeholder="e.g. Lipid Panel Reminder" required />
        </div>
        <div className="form-group">
          <label>Type</label>
          <div className="type-pills">
            {REMINDER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`type-pill ${form.reminder_type === t.value ? 'selected' : ''}`}
                onClick={() => handleTypeChange(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {form.reminder_type === 'medication' && (
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
                <label>Times Per Day</label>
                <select name="times_per_day" value={med.times_per_day} onChange={updateMed}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}x daily</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input name="end_date" type="date" value={med.end_date} onChange={updateMed} />
              </div>
            </div>
            <div className="form-group">
              <label>Reminder Times</label>
              <div className="form-row" style={{ flexWrap: 'wrap' }}>
                {Array.from({ length: med.times_per_day }).map((_, i) => (
                  <input
                    key={i}
                    type="time"
                    value={med.reminder_times[i] || '08:00'}
                    onChange={(e) => updateMedTime(i, e.target.value)}
                    style={{ flex: '1', minWidth: '120px' }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {form.reminder_type === 'lab' && (
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
              <textarea name="directions" value={lab.directions} onChange={(e) => { const updated = { ...lab, directions: e.target.value }; setLab(updated); setForm((f) => ({ ...f, message: buildLabMessage(updated) })); }} rows={3} placeholder="e.g. Enter through the main entrance, take the elevator to floor 2..." />
            </div>
          </>
        )}

        {form.reminder_type === 'appointment' && (
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
              <textarea name="directions" value={appt.directions} onChange={(e) => { const updated = { ...appt, directions: e.target.value }; setAppt(updated); setForm((f) => ({ ...f, message: buildApptMessage(updated) })); }} rows={3} placeholder="e.g. Park in structure B, take elevator to floor 3..." />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Message *</label>
          <textarea name="message" value={form.message} onChange={update} rows={6} required
            placeholder="Hi [Patient First Name], this is a reminder to..." />
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(template) {
    if (editing) {
      setTemplates(templates.map((t) => (t.id === template.id ? template : t)));
    } else {
      setTemplates([template, ...templates]);
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  function startEdit(template) {
    setEditing(template);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Reminder Templates</h2>
          <p className="panel-subtitle">Pre-built messages you can quickly send to patients</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          + New Template
        </button>
      </div>

      {showForm && (
        <TemplateForm template={editing} allTemplates={templates} onSave={handleSaved} onCancel={cancelForm} />
      )}

      {loading ? (
        <p className="loading-text">Loading templates...</p>
      ) : templates.length === 0 && !showForm ? (
        <div className="empty-state">
          <p>No templates yet. Create your first pre-built reminder.</p>
        </div>
      ) : (
        <div className="template-list">
          {templates.map((t) => (
            <div key={t.id} className="template-card">
              <div className="template-card-header">
                <div>
                  <span className="type-badge" style={{ backgroundColor: TYPE_COLORS[t.reminder_type] }}>
                    {REMINDER_TYPES.find((r) => r.value === t.reminder_type)?.label || t.reminder_type}
                  </span>
                  <h4 className="template-title">{t.title}</h4>
                </div>
                <div className="template-actions">
                  <button className="btn-text" onClick={() => startEdit(t)}>Edit</button>
                  <button className="btn-text danger" onClick={() => handleDelete(t.id)}>Delete</button>
                </div>
              </div>
              {t.reminder_type === 'medication' && t.metadata && (
                <div className="med-meta">
                  {t.metadata.medication_name && <span>{t.metadata.medication_name}</span>}
                  {t.metadata.dosage && <span>{t.metadata.dosage}</span>}
                  {t.metadata.times_per_day && <span>{t.metadata.times_per_day}x daily</span>}
                  {t.metadata.reminder_times?.length > 0 && <span>{t.metadata.reminder_times.join(', ')}</span>}
                  {t.metadata.end_date && <span>Until {t.metadata.end_date}</span>}
                </div>
              )}
              {t.reminder_type === 'lab' && t.metadata && (
                <div className="med-meta">
                  {t.metadata.test_type && <span>{t.metadata.test_type}</span>}
                  {t.metadata.test_name && <span>{t.metadata.test_name}</span>}
                  {t.metadata.appointment_date && <span>{t.metadata.appointment_date}{t.metadata.appointment_time ? ` @ ${t.metadata.appointment_time}` : ''}</span>}
                  {t.metadata.location && <span>{t.metadata.location}</span>}
                </div>
              )}
              {t.reminder_type === 'appointment' && t.metadata && (
                <div className="med-meta">
                  {t.metadata.appointment_date && <span>{t.metadata.appointment_date}{t.metadata.appointment_time ? ` @ ${t.metadata.appointment_time}` : ''}</span>}
                  {t.metadata.location && <span>{t.metadata.location}</span>}
                </div>
              )}
              <p className="template-message">{t.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
