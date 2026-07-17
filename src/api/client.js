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
export const addGalleryImage = (type, url) =>
  request('/api/gallery', { method: 'POST', body: JSON.stringify({ type, url }) });
export const deleteGalleryImage = (type, row) =>
  request(`/api/gallery?type=${type}&row=${row}`, { method: 'DELETE' });
export const moveGalleryImage = (type, row, toType) =>
  request('/api/gallery', { method: 'PATCH', body: JSON.stringify({ type, row, toType }) });

// Bio
export const getBios = () => request('/api/bio');
export const addBio = (bio) => request('/api/bio', { method: 'POST', body: JSON.stringify(bio) });
export const updateBio = (row, bio) =>
  request(`/api/bio?row=${row}`, { method: 'PUT', body: JSON.stringify(bio) });
export const deleteBio = (row) => request(`/api/bio?row=${row}`, { method: 'DELETE' });

// Cloudinary — direct unsigned upload from the browser, no backend involved.
export async function uploadToCloudinary(file, onProgress) {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured (missing REACT_APP_CLOUDINARY_* env vars)');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'gallery');

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
