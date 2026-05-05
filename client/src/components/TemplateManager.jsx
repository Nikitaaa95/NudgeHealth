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

function TemplateForm({ template, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: template?.title || '',
    message: template?.message || '',
    reminder_type: template?.reminder_type || 'general',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const saved = template
        ? await api.updateTemplate(template.id, form)
        : await api.createTemplate(form);
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
                onClick={() => setForm({ ...form, reminder_type: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Message *</label>
          <textarea name="message" value={form.message} onChange={update} rows={5} required
            placeholder="Hi [Patient Name], this is a reminder to..." />
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
        <TemplateForm template={editing} onSave={handleSaved} onCancel={cancelForm} />
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
              <p className="template-message">{t.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
