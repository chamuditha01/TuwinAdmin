import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getBios, addBio, updateBio, deleteBio } from '../api/client';

const EMPTY_FORM = { Name: '', Birthday: '', 'World Rank': '', Description: '' };

// Mirrors the server-side calculation in api/bio.js — used here only for an
// immediate preview while editing; the saved value always comes from the
// server so it can't drift out of sync.
function calculateAge(birthday) {
  if (!birthday) return '';
  const dob = new Date(`${birthday}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return '';

  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() >= dob.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age >= 0 ? age : '';
}

function BioForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="banner-error">{error}</div>}
      <div className="form-field">
        <label>Name</label>
        <input value={form.Name} onChange={setField('Name')} required />
      </div>
      <div className="form-field">
        <label>Birthday</label>
        <input type="date" value={form.Birthday} onChange={setField('Birthday')} required />
      </div>
      <div className="form-field">
        <label>World Rank</label>
        <input value={form['World Rank']} onChange={setField('World Rank')} />
      </div>
      <div className="form-field">
        <label>Age (calculated automatically)</label>
        <input value={calculateAge(form.Birthday)} disabled />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea rows={5} value={form.Description} onChange={setField('Description')} />
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

export default function BioPage() {
  const [bios, setBios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | bio being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setBios(await getBios());
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
    await addBio(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateBio(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this profile? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteBio(row);
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
          <h1>Bio</h1>
          <p>{bios.length} profile{bios.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Profile
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading profiles…</div>
        ) : bios.length === 0 ? (
          <div className="empty-state">No profiles yet. Click "Add Profile" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Birthday</th>
                <th>World Rank</th>
                <th>Age</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bios.map((b) => (
                <tr key={b._row}>
                  <td data-label="Name">{b.Name}</td>
                  <td data-label="Birthday">{b.Birthday}</td>
                  <td data-label="World Rank">{b['World Rank']}</td>
                  <td data-label="Age">{b.Age}</td>
                  <td className="cell-truncate" data-label="Description" title={b.Description}>
                    {b.Description}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(b)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(b._row)}
                      disabled={deletingRow === b._row}
                    >
                      {deletingRow === b._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Profile" onClose={() => setModalMode(null)}>
          <BioForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Profile" onClose={() => setModalMode(null)}>
          <BioForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
