import { useState, useEffect } from 'react';
import { api } from '../api';
import PatientForm from './PatientForm';

export default function PatientPanel({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    try {
      const data = await api.getPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePatientCreated(patient) {
    setPatients([...patients, patient].sort((a, b) => a.name.localeCompare(b.name)));
    setShowForm(false);
  }

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Patient Panel</h2>
          <p className="panel-subtitle">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Patient</button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <PatientForm onSave={handlePatientCreated} onCancel={() => setShowForm(false)} />
      )}

      {loading ? (
        <p className="loading-text">Loading patients...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search ? 'No patients match your search.' : 'No patients yet. Add your first patient.'}</p>
        </div>
      ) : (
        <div className="patient-list">
          {filtered.map((patient) => (
            <button
              key={patient.id}
              className="patient-card"
              onClick={() => onSelectPatient(patient)}
            >
              <div className="patient-avatar">{patient.name.charAt(0).toUpperCase()}</div>
              <div className="patient-info">
                <span className="patient-name">{patient.name}</span>
                <span className="patient-meta">
                  {patient.email || 'No email'}{patient.phone ? ` · ${patient.phone}` : ''}
                </span>
              </div>
              <span className="patient-arrow">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
