import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import {
  getCompetencyBlueprints,
  addCompetencyBlueprint,
  updateCompetencyBlueprint,
  deleteCompetencyBlueprint,
} from '../api/client';

const EMPTY_FORM = { blueprints: '' };

function BlueprintForm({ initial, onCancel, onSave }) {
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
        <label>Blueprint</label>
        <input value={form.blueprints} onChange={setField('blueprints')} required />
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

export default function CompetencyBlueprintPage() {
  const [blueprints, setBlueprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | blueprint being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setBlueprints(await getCompetencyBlueprints());
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
    await addCompetencyBlueprint(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateCompetencyBlueprint(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this blueprint? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteCompetencyBlueprint(row);
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
          <h1>Competency Blueprint</h1>
          <p>{blueprints.length} entr{blueprints.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Blueprint
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading blueprints…</div>
        ) : blueprints.length === 0 ? (
          <div className="empty-state">No blueprints yet. Click "Add Blueprint" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Blueprint</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blueprints.map((b) => (
                <tr key={b._row}>
                  <td data-label="Blueprint">{b.blueprints}</td>
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
        <Modal title="Add Blueprint" onClose={() => setModalMode(null)}>
          <BlueprintForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Blueprint" onClose={() => setModalMode(null)}>
          <BlueprintForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
