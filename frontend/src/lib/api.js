// Client helpers: device id, free-plan limits, API calls.

export const FREE_LIMITS = { scans: 3, chats: 3 };
export const PRO_PRICE = '₦2,500';

const today = () => new Date().toISOString().slice(0, 10);

export function deviceId() {
  try {
    let id = localStorage.getItem('ft_device');
    if (!id) {
      id = `dev_${crypto.getRandomValues(new Uint32Array(2)).join('')}`;
      localStorage.setItem('ft_device', id);
    }
    return id;
  } catch {
    return 'dev_unknown';
  }
}

// Per-device daily usage (the server also enforces its own limit).
export const usage = {
  get(kind) {
    try {
      const u = JSON.parse(localStorage.getItem('ft_usage') || '{}');
      return u.date === today() ? u[kind] || 0 : 0;
    } catch {
      return 0;
    }
  },
  left(kind) {
    return Math.max(0, FREE_LIMITS[kind] - usage.get(kind));
  },
  add(kind) {
    try {
      const u = JSON.parse(localStorage.getItem('ft_usage') || '{}');
      const next = u.date === today() ? u : { date: today() };
      next[kind] = (next[kind] || 0) + 1;
      localStorage.setItem('ft_usage', JSON.stringify(next));
    } catch { /* storage blocked */ }
  },
  // Server said the limit is reached: sync the local counter.
  exhaust(kind) {
    try {
      const u = JSON.parse(localStorage.getItem('ft_usage') || '{}');
      const next = u.date === today() ? u : { date: today() };
      next[kind] = FREE_LIMITS[kind];
      localStorage.setItem('ft_usage', JSON.stringify(next));
    } catch { /* storage blocked */ }
  }
};

async function post(path, body) {
  let res;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, deviceId: deviceId() }) });
  } catch {
    throw new Error('Could not reach FarmGuard. Check your internet connection.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || `Request failed (${res.status})`), { limit: json.limit });
  return json;
}

export const api = {
  status: () => fetch('/api/status').then((r) => (r.ok ? r.json() : null)).catch(() => null),
  detect: (body) => post('/api/detect', body),
  chat: (body) => post('/api/chat', body),
  feedback: (body) => post('/api/feedback', body)
};

// Resize to max 1280px JPEG before upload (faster on mobile data).
export function fileToDataUrl(file, max = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('That file could not be read as an image.'));
    img.src = url;
  });
}

export async function urlToFile(src, name) {
  const blob = await (await fetch(src)).blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export const SAMPLES = [
  { id: 'healthy', label: 'Healthy leaf', src: '/samples/healthy.jpg', credit: 'Dwight Sipler, CC BY 2.0', link: 'https://commons.wikimedia.org/wiki/File:Healthy_tomato_leaves_(7871755330).jpg' },
  { id: 'early-blight', label: 'Early blight', src: '/samples/early-blight.jpg', credit: 'Dwight Sipler, CC BY 2.0', link: 'https://commons.wikimedia.org/wiki/File:Early_blight_on_tomato_leaves_(7871930010).jpg' },
  { id: 'late-blight', label: 'Late blight', src: '/samples/late-blight.jpg', credit: 'Scot Nelson, CC0', link: 'https://commons.wikimedia.org/wiki/File:Tomato_late_blight_leaf_sporulating_lesions_1_(5816170621).jpg' },
  { id: 'septoria', label: 'Septoria leaf spot', src: '/samples/septoria.jpg', credit: 'Wolan268, CC0', link: 'https://commons.wikimedia.org/wiki/File:Tomato_septoria_leaf_spot_3006.jpg' }
];

export const NIGERIAN_STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'];

export const CONTACT_EMAIL = 'hello@freshtomatoes.com';
