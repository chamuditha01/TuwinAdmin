import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import {
  getUpcoming,
  addUpcoming,
  updateUpcoming,
  deleteUpcoming,
  uploadToCloudinary,
  deleteCloudinaryAsset,
} from '../api/client';

const EMPTY_FORM = {
  Name: '',
  Venue: '',
  'Tournament Size': '',
  'Start Date': '',
  'End Date': '',
  'Tournament Category': '',
  'Finished Position': '',
  Status: '',
  logo: '',
};

function logoUrls(logo) {
  return String(logo ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

const TOURNAMENT_SIZES = [
  'PSA Satellite',
  'PSA Challenger 3',
  'PSA Challenger 6',
  'PSA Challenger 9',
  'PSA Challenger 12',
  'PSA Challenger 15',
  'PSA Challenger 18',
  'PSA World Tour',
];

const TOURNAMENT_CATEGORIES = ['Men’s'];

// Older rows may hold a value outside a fixed list (freeform text from
// before a field became a dropdown) — keep it selectable so editing the
// row for something else doesn't silently wipe it out.
function withExistingValue(fixedOptions, currentValue) {
  return currentValue && !fixedOptions.includes(currentValue) ? [currentValue, ...fixedOptions] : fixedOptions;
}

function UpcomingForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [logos, setLogos] = useState(() => logoUrls(initial.logo));
  const sizeOptions = withExistingValue(TOURNAMENT_SIZES, initial['Tournament Size']);
  const categoryOptions = withExistingValue(TOURNAMENT_CATEGORIES, initial['Tournament Category']);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isCompleted = form.Status === 'completed';

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 0) return;

    setError('');
    const failed = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ index: i + 1, total: files.length, pct: 0 });
      try {
        const url = await uploadToCloudinary(
          file,
          (pct) => setProgress({ index: i + 1, total: files.length, pct }),
          'upcoming'
        );
        setLogos((prev) => [...prev, url]);
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`);
      }
    }
    setProgress(null);
    if (failed.length > 0) setError(`Some uploads failed — ${failed.join('; ')}`);
  };

  const handleRemoveLogo = (url) => {
    setLogos((prev) => prev.filter((u) => u !== url));
    deleteCloudinaryAsset(url).catch((err) => console.warn('Cloudinary delete failed:', err.message));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form['Start Date'] && form['End Date'] && form['End Date'] < form['Start Date']) {
      setError('End Date cannot be before Start Date.');
      return;
    }
    if (isCompleted && !form['Finished Position'].trim()) {
      setError('Finished Position is required when Status is Completed.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, logo: logos.join(',') });
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
        <select value={form['Tournament Size']} onChange={setField('Tournament Size')}>
          <option value="">Select size</option>
          {sizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Start Date</label>
        <input type="date" value={form['Start Date']} onChange={setField('Start Date')} required />
      </div>
      <div className="form-field">
        <label>End Date</label>
        <input type="date" value={form['End Date']} onChange={setField('End Date')} required />
      </div>
      <div className="form-field">
        <label>Tournament Category</label>
        <select value={form['Tournament Category']} onChange={setField('Tournament Category')}>
          <option value="">Select category</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Logos</label>
        {logos.length > 0 && (
          <div className="package-image-grid">
            {logos.map((url) => (
              <div className="package-image-thumb" key={url}>
                <img src={url} alt="" />
                <button type="button" onClick={() => handleRemoveLogo(url)} title="Remove logo">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress !== null
            ? `Uploading ${progress.index}/${progress.total}… ${progress.pct}%`
            : 'Upload Logos'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </div>
      <div className="form-field">
        <label>Status</label>
        <select value={form.Status} onChange={setField('Status')} required>
          <option value="" disabled>
            Select status
          </option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="form-field">
        <label>Finished Position{isCompleted ? '' : ' (only needed once Completed)'}</label>
        <input
          value={form['Finished Position']}
          onChange={setField('Finished Position')}
          required={isCompleted}
        />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || progress !== null}>
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
                <th>Logo</th>
                <th>Name</th>
                <th>Venue</th>
                <th>Size</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Category</th>
                <th>Status</th>
                <th>Finished</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t._row}>
                  <td data-label="Logo">
                    {(() => {
                      const urls = logoUrls(t.logo);
                      if (urls.length === 0) return '—';
                      return (
                        <div className="package-image-strip">
                          {urls.slice(0, 3).map((url) => (
                            <img key={url} src={url} alt="" />
                          ))}
                          {urls.length > 3 && <span>+{urls.length - 3}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td data-label="Name">{t.Name}</td>
                  <td data-label="Venue">{t.Venue}</td>
                  <td data-label="Size">{t['Tournament Size']}</td>
                  <td data-label="Start Date">{t['Start Date']}</td>
                  <td data-label="End Date">{t['End Date']}</td>
                  <td data-label="Category">{t['Tournament Category']}</td>
                  <td data-label="Status" style={{ textTransform: 'capitalize' }}>
                    {t.Status}
                  </td>
                  <td data-label="Finished">{t['Finished Position']}</td>
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
