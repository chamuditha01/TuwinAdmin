import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getUpcoming, addUpcoming, updateUpcoming, deleteUpcoming } from '../api/client';

const EMPTY_FORM = { Name: '', Venue: '', 'Tournament Size': '', 'Start Date': '', 'End Date': '' };

function UpcomingForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form['Start Date'] && form['End Date'] && form['End Date'] < form['Start Date']) {
      setError('End Date cannot be before Start Date.');
      return;
    }
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
        <label>Venue</label>
        <input value={form.Venue} onChange={setField('Venue')} required />
      </div>
      <div className="form-field">
        <label>Tournament Size</label>
        <input value={form['Tournament Size']} onChange={setField('Tournament Size')} />
      </div>
      <div className="form-field">
        <label>Start Date</label>
        <input type="date" value={form['Start Date']} onChange={setField('Start Date')} required />
      </div>
      <div className="form-field">
        <label>End Date</label>
        <input type="date" value={form['End Date']} onChange={setField('End Date')} required />
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

export default function UpcomingPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | tournament being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setTournaments(await getUpcoming());
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
    await addUpcoming(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateUpcoming(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this tournament? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteUpcoming(row);
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
          <h1>Upcoming</h1>
          <p>{tournaments.length} tournament{tournaments.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Tournament
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading tournaments…</div>
        ) : tournaments.length === 0 ? (
          <div className="empty-state">No tournaments yet. Click "Add Tournament" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Venue</th>
                <th>Size</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t._row}>
                  <td data-label="Name">{t.Name}</td>
                  <td data-label="Venue">{t.Venue}</td>
                  <td data-label="Size">{t['Tournament Size']}</td>
                  <td data-label="Start Date">{t['Start Date']}</td>
                  <td data-label="End Date">{t['End Date']}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(t)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(t._row)}
                      disabled={deletingRow === t._row}
                    >
                      {deletingRow === t._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Tournament" onClose={() => setModalMode(null)}>
          <UpcomingForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Tournament" onClose={() => setModalMode(null)}>
          <UpcomingForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
