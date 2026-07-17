import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal';
import {
  getPackages,
  addPackage,
  updatePackage,
  deletePackage,
  uploadToCloudinary,
  deleteCloudinaryAsset,
} from '../api/client';

const EMPTY_FORM = { 'Tier Name': '', Title: '', Price: '', Benefits: '', Image_Set: '' };

function benefitLines(benefits) {
  return String(benefits ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function imageSetUrls(imageSet) {
  return String(imageSet ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
}

function PackageForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [images, setImages] = useState(() => imageSetUrls(initial.Image_Set));
  const [progress, setProgress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
          'packages'
        );
        setImages((prev) => [...prev, url]);
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`);
      }
    }
    setProgress(null);
    if (failed.length > 0) setError(`Some uploads failed — ${failed.join('; ')}`);
  };

  const handleRemoveImage = (url) => {
    setImages((prev) => prev.filter((u) => u !== url));
    deleteCloudinaryAsset(url).catch((err) => console.warn('Cloudinary delete failed:', err.message));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, Image_Set: images.join(',') });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="banner-error">{error}</div>}
      <div className="form-field">
        <label>Tier Name</label>
        <input value={form['Tier Name']} onChange={setField('Tier Name')} required />
      </div>
      <div className="form-field">
        <label>Title</label>
        <input value={form.Title} onChange={setField('Title')} required />
      </div>
      <div className="form-field">
        <label>Price</label>
        <input value={form.Price} onChange={setField('Price')} required />
      </div>
      <div className="form-field">
        <label>Benefits (one per line)</label>
        <textarea
          rows={6}
          value={form.Benefits}
          onChange={setField('Benefits')}
          placeholder={'Benefit one\nBenefit two\nBenefit three'}
        />
      </div>
      <div className="form-field">
        <label>Images</label>
        {images.length > 0 && (
          <div className="package-image-grid">
            {images.map((url) => (
              <div className="package-image-thumb" key={url}>
                <img src={url} alt="" />
                <button type="button" onClick={() => handleRemoveImage(url)} title="Remove image">
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
            : 'Upload Images'}
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

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | package being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setPackages(await getPackages());
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
    await addPackage(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updatePackage(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this package? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deletePackage(row);
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
          <h1>Packages</h1>
          <p>{packages.length} package{packages.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Package
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading packages…</div>
        ) : packages.length === 0 ? (
          <div className="empty-state">No packages yet. Click "Add Package" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tier Name</th>
                <th>Title</th>
                <th>Price</th>
                <th>Benefits</th>
                <th>Images</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => {
                const benefits = benefitLines(p.Benefits);
                const images = imageSetUrls(p.Image_Set);
                return (
                  <tr key={p._row}>
                    <td data-label="Tier Name">{p['Tier Name']}</td>
                    <td data-label="Title">{p.Title}</td>
                    <td data-label="Price">{p.Price}</td>
                    <td data-label="Benefits" title={benefits.join('\n')}>
                      {benefits.length} benefit{benefits.length === 1 ? '' : 's'}
                    </td>
                    <td data-label="Images">
                      {images.length === 0 ? (
                        '—'
                      ) : (
                        <div className="package-image-strip">
                          {images.slice(0, 3).map((url) => (
                            <img key={url} src={url} alt="" />
                          ))}
                          {images.length > 3 && <span>+{images.length - 3}</span>}
                        </div>
                      )}
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-secondary btn-small" onClick={() => setModalMode(p)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(p._row)}
                        disabled={deletingRow === p._row}
                      >
                        {deletingRow === p._row ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Package" onClose={() => setModalMode(null)}>
          <PackageForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Package" onClose={() => setModalMode(null)}>
          <PackageForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
