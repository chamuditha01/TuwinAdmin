import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import {
  getCoachClub,
  addCoachClub,
  updateCoachClub,
  deleteCoachClub,
  uploadToCloudinary,
} from '../api/client';

const EMPTY_FORM = { Name: '', Profile: '', Biography: '', 'Image Url': '' };

function CoachClubForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setUploading(0);
    try {
      const url = await uploadToCloudinary(file, setUploading, 'coach-club');
      setForm((f) => ({ ...f, 'Image Url': url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

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
        <label>Image</label>
        {form['Image Url'] && (
          <img
            src={form['Image Url']}
            alt=""
            style={{ width: 80, height: 80, objectFit: 'cover', display: 'block', marginBottom: 8 }}
          />
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading !== null}
        >
          {uploading !== null
            ? `Uploading… ${uploading}%`
            : form['Image Url']
            ? 'Replace Image'
            : 'Upload Image'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      </div>
      <div className="form-field">
        <label>Profile</label>
        <textarea rows={5} value={form.Profile} onChange={setField('Profile')} />
      </div>
      <div className="form-field">
        <label>Biography</label>
        <textarea rows={8} value={form.Biography} onChange={setField('Biography')} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || uploading !== null}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function CoachClubPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | entry being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await getCoachClub());
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
    await addCoachClub(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateCoachClub(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteCoachClub(row);
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
          <h1>Coach &amp; Club</h1>
          <p>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Entry
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading entries…</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No entries yet. Click "Add Entry" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Profile</th>
                <th>Biography</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._row}>
                  <td data-label="Image">
                    {e['Image Url'] && (
                      <img
                        src={e['Image Url']}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: 'cover' }}
                      />
                    )}
                  </td>
                  <td data-label="Name">{e.Name}</td>
                  <td className="cell-truncate" data-label="Profile" title={e.Profile}>
                    {e.Profile}
                  </td>
                  <td className="cell-truncate" data-label="Biography" title={e.Biography}>
                    {e.Biography}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(e)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(e._row)}
                      disabled={deletingRow === e._row}
                    >
                      {deletingRow === e._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Entry" onClose={() => setModalMode(null)}>
          <CoachClubForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Entry" onClose={() => setModalMode(null)}>
          <CoachClubForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
