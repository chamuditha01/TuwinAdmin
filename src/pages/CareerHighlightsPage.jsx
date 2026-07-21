import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import {
  getCareerHighlights,
  addCareerHighlight,
  updateCareerHighlight,
  deleteCareerHighlight,
} from '../api/client';

const EMPTY_FORM = { year: '', title: '', description: '', tag: '', icon: '' };

function CareerHighlightForm({ initial, onCancel, onSave }) {
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
        <label>Year</label>
        <input type="number" value={form.year} onChange={setField('year')} required />
      </div>
      <div className="form-field">
        <label>Title</label>
        <input value={form.title} onChange={setField('title')} required />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea rows={5} value={form.description} onChange={setField('description')} />
      </div>
      <div className="form-field">
        <label>Tag</label>
        <input value={form.tag} onChange={setField('tag')} />
      </div>
      <div className="form-field">
        <label>Icon (emoji)</label>
        <input value={form.icon} onChange={setField('icon')} placeholder="🏆" maxLength={8} />
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

export default function CareerHighlightsPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | entry being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await getCareerHighlights());
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
    await addCareerHighlight(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateCareerHighlight(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this highlight? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteCareerHighlight(row);
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
          <h1>Career Highlights</h1>
          <p>{entries.length} highlight{entries.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Highlight
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading highlights…</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No highlights yet. Click "Add Highlight" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Year</th>
                <th>Title</th>
                <th>Description</th>
                <th>Tag</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._row}>
                  <td data-label="Icon" style={{ fontSize: 20 }}>
                    {e.icon}
                  </td>
                  <td data-label="Year">{e.year}</td>
                  <td data-label="Title">{e.title}</td>
                  <td className="cell-truncate" data-label="Description" title={e.description}>
                    {e.description}
                  </td>
                  <td data-label="Tag">{e.tag}</td>
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
        <Modal title="Add Highlight" onClose={() => setModalMode(null)}>
          <CareerHighlightForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Highlight" onClose={() => setModalMode(null)}>
          <CareerHighlightForm
            initial={modalMode}
            onCancel={() => setModalMode(null)}
            onSave={handleEdit}
          />
        </Modal>
      )}
    </div>
  );
}
