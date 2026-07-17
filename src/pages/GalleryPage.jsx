import { useEffect, useRef, useState } from 'react';
import {
  getGallery,
  addGalleryImage,
  deleteGalleryImage,
  moveGalleryImage,
  addGalleryCategory,
  deleteGalleryCategory,
  uploadToCloudinary,
} from '../api/client';
import './GalleryPage.css';

function GallerySection({ category, images, otherCategories, onChanged }) {
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [deletingRow, setDeletingRow] = useState(null);
  const [movingRow, setMovingRow] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (files.length === 0) return;

    setError('');
    const failed = [];

    // Uploaded and added one at a time on purpose: adding an image picks
    // "the next empty row" based on the column's current contents, so two
    // uploads racing in parallel could both land on the same row and
    // overwrite each other.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ index: i + 1, total: files.length, pct: 0 });
      try {
        const url = await uploadToCloudinary(file, (pct) =>
          setProgress({ index: i + 1, total: files.length, pct })
        );
        await addGalleryImage(category, url);
      } catch (err) {
        failed.push(`${file.name}: ${err.message}`);
      }
    }

    setProgress(null);
    if (failed.length > 0) setError(`Some uploads failed — ${failed.join('; ')}`);
    await onChanged();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Remove this image?')) return;
    setDeletingRow(row);
    try {
      await deleteGalleryImage(category, row);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingRow(null);
    }
  };

  const handleMove = async (row, toCategory) => {
    if (!toCategory) return;
    setMovingRow(row);
    try {
      await moveGalleryImage(category, row, toCategory);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setMovingRow(null);
    }
  };

  const handleDeleteCategory = async () => {
    const warning =
      images.length > 0
        ? `Delete the "${category}" category and its ${images.length} image${images.length === 1 ? '' : 's'}? This cannot be undone.`
        : `Delete the "${category}" category? This cannot be undone.`;
    if (!window.confirm(warning)) return;

    setDeletingCategory(true);
    try {
      await deleteGalleryCategory(category);
      await onChanged();
    } catch (err) {
      setError(err.message);
      setDeletingCategory(false);
    }
  };

  return (
    <section className="gallery-section">
      <div className="gallery-section-header">
        <div>
          <h2>{category}</h2>
          <p>{images.length} image{images.length === 1 ? '' : 's'}</p>
        </div>
        <button
          className="btn btn-secondary btn-small"
          onClick={handleDeleteCategory}
          disabled={deletingCategory}
          title="Delete this category"
        >
          {deletingCategory ? 'Deleting…' : 'Delete Category'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress !== null
            ? `Uploading ${progress.index}/${progress.total}… ${progress.pct}%`
            : '+ Upload Images'}
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

      {error && <div className="banner-error">{error}</div>}

      {images.length === 0 ? (
        <div className="empty-state">No images yet.</div>
      ) : (
        <div className="gallery-grid">
          {images.map((img) => (
            <div className="gallery-card" key={img.row}>
              <img src={img.url} alt="" loading="lazy" />
              <div className="gallery-card-actions">
                {otherCategories.length > 0 && (
                  <select
                    className="gallery-card-move"
                    value=""
                    onChange={(e) => handleMove(img.row, e.target.value)}
                    disabled={movingRow === img.row || deletingRow === img.row}
                    title="Move to another category"
                  >
                    <option value="" disabled>
                      {movingRow === img.row ? '…' : 'Move to…'}
                    </option>
                    {otherCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className="gallery-card-delete"
                  onClick={() => handleDelete(img.row)}
                  disabled={deletingRow === img.row || movingRow === img.row}
                  title="Remove image"
                >
                  {deletingRow === img.row ? '…' : '×'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AddCategoryForm({ existingNames, onAdded }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError('That category already exists.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addGalleryCategory(trimmed);
      setName('');
      setOpen(false);
      await onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        + Add Category
      </button>
    );
  }

  return (
    <form className="add-category-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        placeholder="Category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />
      <button type="submit" className="btn btn-primary btn-small" disabled={saving}>
        {saving ? 'Adding…' : 'Add'}
      </button>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => {
          setOpen(false);
          setError('');
        }}
        disabled={saving}
      >
        Cancel
      </button>
      {error && <div className="banner-error add-category-error">{error}</div>}
    </form>
  );
}

export default function GalleryPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGallery();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const names = categories.map((c) => c.name);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gallery</h1>
          <p>Manage gallery image categories</p>
        </div>
        <AddCategoryForm existingNames={names} onAdded={load} />
      </div>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading gallery…</div>
      ) : (
        categories.map((c) => (
          <GallerySection
            key={c.name}
            category={c.name}
            images={c.images}
            otherCategories={names.filter((n) => n !== c.name)}
            onChanged={load}
          />
        ))
      )}
    </div>
  );
}
