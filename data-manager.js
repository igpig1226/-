const DB_NAME = 'SurveyDB';
const STORE_NAME = 'responses';
const VERSION = 1;

class DataManager {
  constructor() {
    this.db = null;
    this.initDB();
  }

  initDB() {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => console.error('数据库初始化失败');
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      this.db = e.target.result;
    };
  }

  async saveResponse(data) {
    const response = {
      ...data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 100)
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(response);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllResponses() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteResponse(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStatistics() {
    const responses = await this.getAllResponses();
    const stats = {
      total: responses.length,
      byQuestion: {}
    };

    responses.forEach(response => {
      Object.keys(response).forEach(key => {
        if (key.startsWith('q')) {
          if (!stats.byQuestion[key]) {
            stats.byQuestion[key] = {};
          }
          const value = response[key];
          if (Array.isArray(value)) {
            value.forEach(v => {
              stats.byQuestion[key][v] = (stats.byQuestion[key][v] || 0) + 1;
            });
          } else {
            stats.byQuestion[key][value] = (stats.byQuestion[key][value] || 0) + 1;
          }
        }
      });
    });

    return stats;
  }

  exportAsJSON(responses) {
    const dataStr = JSON.stringify(responses, null, 2);
    this.downloadFile(dataStr, 'survey-responses.json', 'application/json');
  }

  exportAsCSV(responses) {
    if (responses.length === 0) return;

    const keys = Object.keys(responses[0]);
    const csv = [
      keys.join(','),
      ...responses.map(r =>
        keys.map(k => {
          const val = r[k];
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csv, 'survey-responses.csv', 'text/csv;charset=utf-8;');
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

const dataManager = new DataManager();
