import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getContacts, addContact, updateContact, deleteContact } from '../api/client';

const EMPTY_FORM = { Locations: '', email: '' };

function phoneNumbers(value) {
  return String(value ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

function ContactForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [phones, setPhones] = useState(() => {
    const existing = phoneNumbers(initial['phone numbers']);
    return existing.length > 0 ? existing : [''];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPhone = (i) => (e) =>
    setPhones((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)));

  const handleAddPhone = () => setPhones((prev) => [...prev, '']);
  const handleRemovePhone = (i) => setPhones((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const cleanedPhones = phones.map((p) => p.trim()).filter(Boolean);
      await onSave({ ...form, 'phone numbers': cleanedPhones.join(',') });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="banner-error">{error}</div>}
      <div className="form-field">
        <label>Locations</label>
        <input value={form.Locations} onChange={setField('Locations')} required />
      </div>
      <div className="form-field">
        <label>Email</label>
        <input type="email" value={form.email} onChange={setField('email')} required />
      </div>
      <div className="form-field">
        <label>Phone Numbers</label>
        {phones.map((phone, i) => (
          <div className="list-input-row" key={i}>
            <input value={phone} onChange={setPhone(i)} placeholder="+94 77 123 4567" />
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => handleRemovePhone(i)}
              title="Remove this number"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-small" onClick={handleAddPhone}>
          + Add Phone Number
        </button>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function ContactPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | contact being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setContacts(await getContacts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (form) => {
    await addContact(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateContact(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this contact entry? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteContact(row);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingRow(null);
    }
  };

  const isEditing = modalMode && modalMode !== 'add';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Contact</h1>
          <p>{contacts.length} entr{contacts.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Contact
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading contacts…</div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">No contact entries yet. Click "Add Contact" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Locations</th>
                <th>Email</th>
                <th>Phone Numbers</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c._row}>
                  <td data-label="Locations">{c.Locations}</td>
                  <td data-label="Email">{c.email}</td>
                  <td data-label="Phone Numbers">{phoneNumbers(c['phone numbers']).join(', ')}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(c)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(c._row)}
                      disabled={deletingRow === c._row}
                    >
                      {deletingRow === c._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Contact" onClose={() => setModalMode(null)}>
          <ContactForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Contact" onClose={() => setModalMode(null)}>
          <ContactForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
