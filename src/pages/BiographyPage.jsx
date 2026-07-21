import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import {
  getBiography,
  updateBiographyDescription,
  addBiographySection,
  updateBiographySection,
  deleteBiographySection,
} from '../api/client';

const EMPTY_SECTION = { Title: '', Heading: '', Description: '' };

function DescriptionForm({ initial, onCancel, onSave }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(value);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="banner-error">{error}</div>}
      <div className="form-field">
        <label>Description</label>
        <textarea rows={8} value={value} onChange={(e) => setValue(e.target.value)} />
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

function SectionForm({ initial, onCancel, onSave }) {
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
        <input value={form.Title} onChange={setField('Title')} required />
      </div>
      <div className="form-field">
        <label>Heading</label>
        <input value={form.Heading} onChange={setField('Heading')} required />
      </div>
      <div className="form-field">
        <label>Description</label>
        <textarea rows={5} value={form.Description} onChange={setField('Description')} />
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

export default function BiographyPage() {
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [sectionModal, setSectionModal] = useState(null); // null | 'add' | section being edited
  const [deletingRow, setDeletingRow] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBiography();
      setDescription(data.description);
      setSections(data.sections);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveDescription = async (value) => {
    await updateBiographyDescription(value);
    setEditingDescription(false);
    await load();
  };

  const handleAddSection = async (form) => {
    await addBiographySection(form);
    setSectionModal(null);
    await load();
  };

  const handleEditSection = async (form) => {
    await updateBiographySection(sectionModal._row, form);
    setSectionModal(null);
    await load();
  };

  const handleDeleteSection = async (row) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    setDeletingRow(row);
    try {
      await deleteBiographySection(row);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingRow(null);
    }
  };

  const isEditingSection = sectionModal && sectionModal !== 'add';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Biography</h1>
          <p>One overall description, plus {sections.length} section{sections.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="card">
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Description</h2>
          <button className="btn btn-secondary btn-small" onClick={() => setEditingDescription(true)} disabled={loading}>
            Edit
          </button>
        </div>
        {loading ? (
          <div className="loading-state">Loading…</div>
        ) : (
          <p style={{ whiteSpace: 'pre-wrap' }}>{description || <em>No description yet.</em>}</p>
        )}
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="page-header">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Sections</h2>
          <button className="btn btn-primary" onClick={() => setSectionModal('add')}>
            + Add Section
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading sections…</div>
        ) : sections.length === 0 ? (
          <div className="empty-state">No sections yet. Click "Add Section" to create one.</div>
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
              {sections.map((s) => (
                <tr key={s._row}>
                  <td data-label="Title">{s.Title}</td>
                  <td data-label="Heading">{s.Heading}</td>
                  <td className="cell-truncate" data-label="Description" title={s.Description}>
                    {s.Description}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => setSectionModal(s)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={() => handleDeleteSection(s._row)}
                      disabled={deletingRow === s._row}
                    >
                      {deletingRow === s._row ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingDescription && (
        <Modal title="Edit Description" onClose={() => setEditingDescription(false)}>
          <DescriptionForm
            initial={description}
            onCancel={() => setEditingDescription(false)}
            onSave={handleSaveDescription}
          />
        </Modal>
      )}

      {sectionModal === 'add' && (
        <Modal title="Add Section" onClose={() => setSectionModal(null)}>
          <SectionForm initial={EMPTY_SECTION} onCancel={() => setSectionModal(null)} onSave={handleAddSection} />
        </Modal>
      )}

      {isEditingSection && (
        <Modal title="Edit Section" onClose={() => setSectionModal(null)}>
          <SectionForm initial={sectionModal} onCancel={() => setSectionModal(null)} onSave={handleEditSection} />
        </Modal>
      )}
    </div>
  );
}
