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

function buildMedMessage({ medication_name, dosage, frequency, stop_taking }) {
  const med = medication_name || '[medication]';
  const dose = dosage ? ` (${dosage})` : '';
  const freq = frequency ? ` ${frequency}` : '';
  const stop = stop_taking ? ` You can stop taking it ${stop_taking}.` : '';
  return `Hi [Patient First Name],\n\nI just wanted to remind you that you'll need to take ${med}${dose}${freq}.${stop}\n\nPlease don't hesitate to reach out if you have any questions.`;
}

function buildLabMessage({ test_name, due_date, location, directions }) {
  const test = test_name || '[lab test]';
  const by = due_date ? ` by ${due_date}` : '';
  const loc = location ? `\n\nPlease go to ${location}.` : '';
  const dir = directions ? `\n\n${directions}` : '';
  return `Hi [Patient First Name],\n\nI just wanted to remind you that you'll need to get a ${test}${by}.${loc}${dir}\n\nPlease don't hesitate to reach out if you have any questions.`;
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
    frequency: template?.metadata?.frequency || '',
    stop_taking: template?.metadata?.stop_taking || '',
  });
  const [lab, setLab] = useState({
    test_name: template?.metadata?.test_name || '',
    due_date: template?.metadata?.due_date || '',
    location: template?.metadata?.location || '',
    directions: template?.metadata?.directions || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function updateMed(e) {
    const updated = { ...med, [e.target.name]: e.target.value };
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

  function handleTypeChange(value) {
    const next = { ...form, reminder_type: value };
    if (value === 'medication') next.message = buildMedMessage(med);
    else if (value === 'lab') next.message = buildLabMessage(lab);
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
        form.reminder_type === 'lab' ? lab : null;
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

        {form.reminder_type === 'lab' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Lab Test Name</label>
                <input name="test_name" value={lab.test_name} onChange={updateLab} placeholder="e.g. Lipid Panel" />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input name="due_date" type="date" value={lab.due_date} onChange={updateLab} />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" value={lab.location} onChange={updateLab} placeholder="e.g. Keck Hospital Lab, 1500 San Pablo St" />
            </div>
            <div className="form-group">
              <label>Directions</label>
              <textarea name="directions" value={lab.directions} onChange={(e) => { setLab({ ...lab, directions: e.target.value }); setForm((f) => ({ ...f, message: buildLabMessage({ ...lab, directions: e.target.value }) })); }} rows={3} placeholder="e.g. Enter through the main entrance, take the elevator to floor 2..." />
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
                  {t.metadata.frequency && <span>{t.metadata.frequency}</span>}
                  {t.metadata.stop_taking && <span>Stop: {t.metadata.stop_taking}</span>}
                </div>
              )}
              {t.reminder_type === 'lab' && t.metadata && (
                <div className="med-meta">
                  {t.metadata.test_name && <span>{t.metadata.test_name}</span>}
                  {t.metadata.due_date && <span>By {t.metadata.due_date}</span>}
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
