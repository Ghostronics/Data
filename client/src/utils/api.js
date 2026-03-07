const API_BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Accounts
  getAccounts: () => request('/accounts'),
  createAccount: (data) => request('/accounts', { method: 'POST', body: JSON.stringify(data) }),

  // Trades
  getTrades: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/trades${qs ? '?' + qs : ''}`);
  },
  getTrade: (id) => request(`/trades/${id}`),
  createTrade: (data) => request('/trades', { method: 'POST', body: JSON.stringify(data) }),
  updateTrade: (id, data) => request(`/trades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrade: (id) => request(`/trades/${id}`, { method: 'DELETE' }),
  uploadTradeImages: async (tradeId, files, type = 'chart') => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('type', type);
    const res = await fetch(`${API_BASE}/trades/${tradeId}/images`, { method: 'POST', body: formData });
    return res.json();
  },
  deleteTradeImage: (imageId) => request(`/trades/images/${imageId}`, { method: 'DELETE' }),
  getStrategies: () => request('/trades/meta/strategies'),
  getSymbols: () => request('/trades/meta/symbols'),

  // Dashboard
  getStats: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/dashboard/stats${qs ? '?' + qs : ''}`);
  },

  // AI
  analyzeTrade: (tradeId) => request(`/ai/analyze-trade/${tradeId}`, { method: 'POST' }),
  analyzeJournal: (data) => request('/ai/analyze-journal', { method: 'POST', body: JSON.stringify(data) }),
  aiChat: (message) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Pre-market
  getPremarketAnalyses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/premarket${qs ? '?' + qs : ''}`);
  },
  getPremarketAnalysis: (id) => request(`/premarket/${id}`),
  createPremarketAnalysis: async (data, imageFile) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => { if (val) formData.append(key, val); });
    if (imageFile) formData.append('image', imageFile);
    const res = await fetch(`${API_BASE}/premarket`, { method: 'POST', body: formData });
    return res.json();
  },
  deletePremarketAnalysis: (id) => request(`/premarket/${id}`, { method: 'DELETE' }),

  // Backup
  exportBackup: async () => {
    const res = await fetch(`${API_BASE}/backup`);
    if (!res.ok) throw new Error('Export failed');
    return res.json();
  },
  restoreBackup: async (data) => {
    return request('/backup/restore', { method: 'POST', body: JSON.stringify(data) });
  },

  // Daily Notes
  getDailyNotes: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/daily-notes${qs ? '?' + qs : ''}`);
  },
  getDailyNote: (date) => request(`/daily-notes/${date}`),
  saveDailyNote: (data) => request('/daily-notes', { method: 'POST', body: JSON.stringify(data) }),
};
