const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data) => request('POST', '/auth/register', data),
  login: (data) => request('POST', '/auth/login', data),

  // Patients
  getPatients: () => request('GET', '/patients'),
  getPatient: (id) => request('GET', `/patients/${id}`),
  createPatient: (data) => request('POST', '/patients', data),
  updatePatient: (id, data) => request('PUT', `/patients/${id}`, data),
  deletePatient: (id) => request('DELETE', `/patients/${id}`),

  // Templates
  getTemplates: () => request('GET', '/templates'),
  createTemplate: (data) => request('POST', '/templates', data),
  updateTemplate: (id, data) => request('PUT', `/templates/${id}`, data),
  deleteTemplate: (id) => request('DELETE', `/templates/${id}`),

  // Reminders
  sendReminder: (data) => request('POST', '/reminders', data),
  getReminders: () => request('GET', '/reminders'),
};
