import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getRankings, addRanking, updateRanking, deleteRanking } from '../api/client';

const EMPTY_FORM = { date: '', ranking: '' };

function RankingForm({ initial, onCancel, onSave }) {
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
        <label>Date</label>
        <input type="date" value={form.date} onChange={setField('date')} required />
      </div>
      <div className="form-field">
        <label>Ranking</label>
        <input value={form.ranking} onChange={setField('ranking')} required />
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

export default function RankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | ranking being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRankings(await getRankings());
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
    await addRanking(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateRanking(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this ranking entry? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteRanking(row);
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
          <h1>Rankings</h1>
          <p>{rankings.length} entr{rankings.length === 1 ? 'y' : 'ies'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Ranking
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading rankings…</div>
        ) : rankings.length === 0 ? (
          <div className="empty-state">No rankings yet. Click "Add Ranking" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ranking</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((r) => (
                <tr key={r._row}>
                  <td data-label="Date">{r.date}</td>
                  <td data-label="Ranking">{r.ranking}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(r)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(r._row)}
                      disabled={deletingRow === r._row}
                    >
                      {deletingRow === r._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Ranking" onClose={() => setModalMode(null)}>
          <RankingForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Ranking" onClose={() => setModalMode(null)}>
          <RankingForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
