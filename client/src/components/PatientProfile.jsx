import { useState, useEffect } from 'react';
import { api } from '../api';
import PatientForm from './PatientForm';
import ReminderComposer from './ReminderComposer';

const TYPE_LABELS = {
  medication: 'Medication',
  lab: 'Lab / Test',
  appointment: 'Appointment',
  general: 'General',
};

const TYPE_COLORS = {
  medication: '#4f8ef7',
  lab: '#f59e0b',
  appointment: '#10b981',
  general: '#8b5cf6',
};

export default function PatientProfile({ patientId, onBack }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  async function loadPatient() {
    try {
      const data = await api.getPatient(patientId);
      setPatient(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePatientUpdated(updated) {
    setPatient({ ...patient, ...updated });
    setShowEdit(false);
  }

  function handleReminderSent(reminder) {
    setPatient({ ...patient, reminders: [reminder, ...(patient.reminders || [])] });
    setShowComposer(false);
  }

  if (loading) return <div className="panel"><p className="loading-text">Loading patient...</p></div>;
  if (!patient) return <div className="panel"><p>Patient not found.</p></div>;

  const age = patient.date_of_birth
    ? Math.floor((new Date() - new Date(patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="panel">
      <button className="back-btn" onClick={onBack}>← Back to Patients</button>

      {showEdit ? (
        <PatientForm patient={patient} onSave={handlePatientUpdated} onCancel={() => setShowEdit(false)} />
      ) : (
        <div className="profile-header">
          <div className="profile-avatar">{patient.name.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <h2>{patient.name}</h2>
            <div className="profile-meta">
              {age !== null && <span>{age} yrs</span>}
              {patient.email && <span>{patient.email}</span>}
              {patient.phone && <span>{patient.phone}</span>}
            </div>
            {patient.notes && <p className="profile-notes">{patient.notes}</p>}
          </div>
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit</button>
        </div>
      )}

      <div className="section-divider" />

      <div className="section-header">
        <h3>Reminders</h3>
        <button className="btn-primary" onClick={() => setShowComposer(true)}>+ Send Reminder</button>
      </div>

      {showComposer && (
        <ReminderComposer
          patient={patient}
          onSent={handleReminderSent}
          onCancel={() => setShowComposer(false)}
        />
      )}

      {(!patient.reminders || patient.reminders.length === 0) ? (
        <div className="empty-state">
          <p>No reminders sent yet.</p>
        </div>
      ) : (
        <div className="reminder-list">
          {patient.reminders.map((r) => (
            <div key={r.id} className="reminder-item">
              <div className="reminder-type-badge" style={{ backgroundColor: TYPE_COLORS[r.reminder_type] }}>
                {TYPE_LABELS[r.reminder_type] || r.reminder_type}
              </div>
              <div className="reminder-content">
                {r.template_title && <span className="reminder-template">Template: {r.template_title}</span>}
                <p className="reminder-message">{r.message}</p>
              </div>
              <div className="reminder-meta">
                <span className={`reminder-status ${r.status}`}>{r.status}</span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
