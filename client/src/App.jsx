import { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import PatientPanel from './components/PatientPanel';
import PatientProfile from './components/PatientProfile';
import TemplateManager from './components/TemplateManager';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [view, setView] = useState('patients'); // 'patients' | 'patient-detail' | 'templates'
  const [selectedPatient, setSelectedPatient] = useState(null);

  function handleAuth({ token, user }) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('patients');
    setSelectedPatient(null);
  }

  function openPatient(patient) {
    setSelectedPatient(patient);
    setView('patient-detail');
  }

  function backToPanel() {
    setSelectedPatient(null);
    setView('patients');
  }

  if (!token) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">NudgeHealth</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-btn ${view === 'patients' || view === 'patient-detail' ? 'active' : ''}`}
            onClick={backToPanel}
          >
            Patients
          </button>
          <button
            className={`nav-btn ${view === 'templates' ? 'active' : ''}`}
            onClick={() => setView('templates')}
          >
            Templates
          </button>
        </nav>
        <div className="header-right">
          <span className="user-name">Dr. {user?.name}</span>
          {user?.specialty && <span className="user-specialty">{user.specialty}</span>}
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="app-main">
        {view === 'patients' && (
          <PatientPanel onSelectPatient={openPatient} />
        )}
        {view === 'patient-detail' && selectedPatient && (
          <PatientProfile
            patientId={selectedPatient.id}
            onBack={backToPanel}
          />
        )}
        {view === 'templates' && (
          <TemplateManager />
        )}
      </main>
    </div>
  );
}
