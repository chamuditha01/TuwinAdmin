import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import {
  getSponsors,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  uploadToCloudinary,
} from '../api/client';

const EMPTY_FORM = { Name: '', Image_Url: '', Status: 'current', Description: '' };

function SponsorForm({ initial, onCancel, onSave }) {
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
      const url = await uploadToCloudinary(file, setUploading, 'sponsors');
      setForm((f) => ({ ...f, Image_Url: url }));
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
        <label>Logo Image</label>
        {form.Image_Url && (
          <img
            src={form.Image_Url}
            alt=""
            style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', marginBottom: 8 }}
          />
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading !== null}
        >
          {uploading !== null ? `Uploading… ${uploading}%` : form.Image_Url ? 'Replace Image' : 'Upload Image'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
      </div>
      <div className="form-field">
        <label>Status</label>
        <select value={form.Status} onChange={setField('Status')} required>
          <option value="current">Current</option>
          <option value="former">Former</option>
        </select>
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea rows={4} value={form.Description} onChange={setField('Description')} />
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

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | sponsor being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setSponsors(await getSponsors());
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
    await addSponsor(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateSponsor(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this sponsor? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteSponsor(row);
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
          <h1>Sponsors</h1>
          <p>{sponsors.length} sponsor{sponsors.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Sponsor
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading sponsors…</div>
        ) : sponsors.length === 0 ? (
          <div className="empty-state">No sponsors yet. Click "Add Sponsor" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Status</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((s) => (
                <tr key={s._row}>
                  <td data-label="Logo">
                    {s.Image_Url && (
                      <img
                        src={s.Image_Url}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: 'contain' }}
                      />
                    )}
                  </td>
                  <td data-label="Name">{s.Name}</td>
                  <td data-label="Status" style={{ textTransform: 'capitalize' }}>
                    {s.Status}
                  </td>
                  <td className="cell-truncate" data-label="Description" title={s.Description}>
                    {s.Description}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(s)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(s._row)}
                      disabled={deletingRow === s._row}
                    >
                      {deletingRow === s._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Sponsor" onClose={() => setModalMode(null)}>
          <SponsorForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Sponsor" onClose={() => setModalMode(null)}>
          <SponsorForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
