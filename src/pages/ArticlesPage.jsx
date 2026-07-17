import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getArticles, addArticle, updateArticle, deleteArticle } from '../api/client';

const EMPTY_FORM = {
  category: '',
  source: '',
  date: '',
  title: '',
  description: '',
  link_text: '',
  url: '',
};

function ArticleForm({ initial, onCancel, onSave }) {
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
        <label>Category</label>
        <input value={form.category} onChange={setField('category')} required />
      </div>
      <div className="form-field">
        <label>Source</label>
        <input value={form.source} onChange={setField('source')} required />
      </div>
      <div className="form-field">
        <label>Date</label>
        <input
          type="date"
          value={form.date}
          onChange={setField('date')}
          required
        />
      </div>
      <div className="form-field">
        <label>Title</label>
        <input value={form.title} onChange={setField('title')} required />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea rows={4} value={form.description} onChange={setField('description')} />
      </div>
      <div className="form-field">
        <label>Link Text</label>
        <input value={form.link_text} onChange={setField('link_text')} />
      </div>
      <div className="form-field">
        <label>URL</label>
        <input type="url" value={form.url} onChange={setField('url')} required />
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

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'add' | article being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setArticles(await getArticles());
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
    await addArticle(form);
    setModalMode(null);
    await load();
  };

  const handleEdit = async (form) => {
    await updateArticle(modalMode._row, form);
    setModalMode(null);
    await load();
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteArticle(row);
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
          <h1>Articles</h1>
          <p>{articles.length} article{articles.length === 1 ? '' : 's'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalMode('add')}>
          + Add Article
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading articles…</div>
        ) : articles.length === 0 ? (
          <div className="empty-state">No articles yet. Click "Add Article" to create one.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Source</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a._row}>
                  <td className="cell-truncate" data-label="Title" title={a.title}>
                    {a.title}
                  </td>
                  <td data-label="Category">{a.category}</td>
                  <td data-label="Source">{a.source}</td>
                  <td data-label="Date">{a.date}</td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setModalMode(a)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(a._row)}
                      disabled={deletingRow === a._row}
                    >
                      {deletingRow === a._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'add' && (
        <Modal title="Add Article" onClose={() => setModalMode(null)}>
          <ArticleForm initial={EMPTY_FORM} onCancel={() => setModalMode(null)} onSave={handleAdd} />
        </Modal>
      )}

      {isEditing && (
        <Modal title="Edit Article" onClose={() => setModalMode(null)}>
          <ArticleForm initial={modalMode} onCancel={() => setModalMode(null)} onSave={handleEdit} />
        </Modal>
      )}
    </div>
  );
}
