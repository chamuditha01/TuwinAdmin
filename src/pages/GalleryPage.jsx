import { useEffect, useRef, useState } from 'react';
import {
  getGallery,
  addGalleryImage,
  deleteGalleryImage,
  moveGalleryImage,
  uploadToCloudinary,
} from '../api/client';
import './GalleryPage.css';

const OTHER_TYPE = { local: 'international', international: 'local' };
const OTHER_LABEL = { local: 'International', international: 'Local' };

function GallerySection({ title, type, images, onChanged }) {
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [deletingRow, setDeletingRow] = useState(null);
  const [movingRow, setMovingRow] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setProgress(0);
    try {
      const url = await uploadToCloudinary(file, setProgress);
      await addGalleryImage(type, url);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Remove this image?')) return;
    setDeletingRow(row);
    try {
      await deleteGalleryImage(type, row);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingRow(null);
    }
  };

  const handleMove = async (row) => {
    setMovingRow(row);
    try {
      await moveGalleryImage(type, row, OTHER_TYPE[type]);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setMovingRow(null);
    }
  };

  return (
    <section className="gallery-section">
      <div className="gallery-section-header">
        <div>
          <h2>{title}</h2>
          <p>{images.length} image{images.length === 1 ? '' : 's'}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress !== null ? `Uploading… ${progress}%` : '+ Upload Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
                <button
                  className="gallery-card-move"
                  onClick={() => handleMove(img.row)}
                  disabled={movingRow === img.row || deletingRow === img.row}
                  title={`Move to ${OTHER_LABEL[type]}`}
                >
                  {movingRow === img.row ? '…' : '⇄'}
                </button>
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

export default function GalleryPage() {
  const [gallery, setGallery] = useState({ local: [], international: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setGallery(await getGallery());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Gallery</h1>
          <p>Manage local and international gallery images</p>
        </div>
      </div>

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading gallery…</div>
      ) : (
        <>
          <GallerySection title="Local" type="local" images={gallery.local} onChanged={load} />
          <GallerySection
            title="International"
            type="international"
            images={gallery.international}
            onChanged={load}
          />
        </>
      )}
    </div>
  );
}
