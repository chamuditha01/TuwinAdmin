import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import {
  getTrainingHistory,
  addTrainingHistory,
  updateTrainingHistory,
  deleteTrainingHistory,
} from '../api/client';

const EMPTY_FORM = { title: '', heading: '', description: '' };

function TrainingHistoryForm({ initial, onCancel, onSave }) {
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
        <label>Title</label>
        <input value={form.title} onChange={setField('title')} required />
      </div>
      <div className="form-field">
        <label>Heading</label>
        <input value={form.heading} onChange={setField('heading')} required />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea rows={5} value={form.description} onChange={setField('description')} />
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

export default function TrainingHistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | entry being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setEntries(await getTrainingHistory());
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
    await addTrainingHistory(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateTrainingHistory(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this training history entry? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteTrainingHistory(row);
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
          <h1>Training History</h1>
          <p>{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Entry
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading training history…</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No training history yet. Click "Add Entry" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Heading</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e._row}>
                  <td data-label="Title">{e.title}</td>
                  <td data-label="Heading">{e.heading}</td>
                  <td className="cell-truncate" data-label="Description" title={e.description}>
                    {e.description}
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
          <TrainingHistoryForm
            initial={EMPTY_FORM}
            onCancel={() => setModalMode(null)}
            onSave={handleAdd}
          />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Entry" onClose={() => setModalMode(null)}>
          <TrainingHistoryForm
            initial={modalMode}
            onCancel={() => setModalMode(null)}
            onSave={handleEdit}
          />
        </Modal>
      )}
    </div>
  );
}
