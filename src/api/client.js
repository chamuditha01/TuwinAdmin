async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Articles
export const getArticles = () => request('/api/articles');
export const addArticle = (article) =>
  request('/api/articles', { method: 'POST', body: JSON.stringify(article) });
export const updateArticle = (row, article) =>
  request(`/api/articles?row=${row}`, { method: 'PUT', body: JSON.stringify(article) });
export const deleteArticle = (row) =>
  request(`/api/articles?row=${row}`, { method: 'DELETE' });

// Gallery
export const getGallery = () => request('/api/gallery');
export const addGalleryImage = (category, url) =>
  request('/api/gallery', { method: 'POST', body: JSON.stringify({ category, url }) });
export const deleteGalleryImage = (category, row) =>
  request(`/api/gallery?category=${encodeURIComponent(category)}&row=${row}`, { method: 'DELETE' });
export const moveGalleryImage = (category, row, toCategory) =>
  request('/api/gallery', { method: 'PATCH', body: JSON.stringify({ category, row, toCategory }) });
export const addGalleryCategory = (name) =>
  request('/api/gallery-categories', { method: 'POST', body: JSON.stringify({ name }) });
export const deleteGalleryCategory = (name) =>
  request(`/api/gallery-categories?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
export const reorderGalleryCategory = (name, direction) =>
  request('/api/gallery-categories', { method: 'PATCH', body: JSON.stringify({ name, direction }) });

// Bio
export const getBios = () => request('/api/bio');
export const addBio = (bio) => request('/api/bio', { method: 'POST', body: JSON.stringify(bio) });
export const updateBio = (row, bio) =>
  request(`/api/bio?row=${row}`, { method: 'PUT', body: JSON.stringify(bio) });
export const deleteBio = (row) => request(`/api/bio?row=${row}`, { method: 'DELETE' });

// Sponsors
export const getSponsors = () => request('/api/sponsors');
export const addSponsor = (sponsor) =>
  request('/api/sponsors', { method: 'POST', body: JSON.stringify(sponsor) });
export const updateSponsor = (row, sponsor) =>
  request(`/api/sponsors?row=${row}`, { method: 'PUT', body: JSON.stringify(sponsor) });
export const deleteSponsor = (row) => request(`/api/sponsors?row=${row}`, { method: 'DELETE' });

// Packages
export const getPackages = () => request('/api/packages');
export const addPackage = (pkg) =>
  request('/api/packages', { method: 'POST', body: JSON.stringify(pkg) });
export const updatePackage = (row, pkg) =>
  request(`/api/packages?row=${row}`, { method: 'PUT', body: JSON.stringify(pkg) });
export const deletePackage = (row) => request(`/api/packages?row=${row}`, { method: 'DELETE' });

// Rankings
export const getRankings = () => request('/api/rankings');
export const addRanking = (ranking) =>
  request('/api/rankings', { method: 'POST', body: JSON.stringify(ranking) });
export const updateRanking = (row, ranking) =>
  request(`/api/rankings?row=${row}`, { method: 'PUT', body: JSON.stringify(ranking) });
export const deleteRanking = (row) => request(`/api/rankings?row=${row}`, { method: 'DELETE' });

// Cloudinary delete goes through the backend (needs the API secret) — used
// when an image is removed from a set (e.g. Packages' Image_Set) before the
// row is saved, so it doesn't just get orphaned on Cloudinary.
export const deleteCloudinaryAsset = (url) =>
  request('/api/cloudinary-delete', { method: 'POST', body: JSON.stringify({ url }) });

// Cloudinary — direct unsigned upload from the browser, no backend involved.
export async function uploadToCloudinary(file, onProgress, folder = 'gallery') {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured (missing REACT_APP_CLOUDINARY_* env vars)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || 'Cloudinary upload failed'));
        }
      } catch {
        reject(new Error('Cloudinary upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Cloudinary upload failed'));
    xhr.send(formData);
  });
}
