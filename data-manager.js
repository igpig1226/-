const API_BASE_URL = 'https://survey-collector.igpig1226.workers.dev';

class DataManager {
  constructor() {
    this.adminPassword = null;
  }

  async request(path, options = {}, authenticated = false) {
    if (!API_BASE_URL) {
      throw new Error('数据收集服务尚未配置，请联系问卷管理员。');
    }

    const headers = { ...(options.headers || {}) };
    if (authenticated) {
      if (!this.adminPassword) throw new Error('请先登录管理员页面。');
      headers.Authorization = `Bearer ${this.adminPassword}`;
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      throw new Error('无法连接数据收集服务，请检查网络后重试。');
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error('数据收集服务返回了无效响应。');
    }
    if (!response.ok) throw new Error(result.error || '操作失败，请稍后重试。');
    return result;
  }

  async saveResponse(data, submissionId) {
    const result = await this.request('/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: submissionId, answers: data })
    });
    return result.id;
  }

  async login(password) {
    this.adminPassword = password;
    try {
      await this.request('/responses?limit=1', {}, true);
    } catch (error) {
      this.adminPassword = null;
      throw error;
    }
  }

  async getAllResponses() {
    const responses = [];
    let offset = 0;
    while (true) {
      const page = await this.request(`/responses?offset=${offset}`, {}, true);
      responses.push(...page.responses);
      if (!page.hasMore) return responses;
      offset += page.responses.length;
    }
  }

  async deleteResponse(id) {
    await this.request(`/responses/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
  }

  async clearAll() {
    await this.request('/responses', { method: 'DELETE' }, true);
  }

  exportAsJSON(responses) {
    this.downloadFile(JSON.stringify(responses, null, 2), 'survey-responses.json', 'application/json');
  }

  exportAsCSV(responses) {
    if (responses.length === 0) return;
    const keys = [...new Set(responses.flatMap(response => Object.keys(response)))];
    const escape = value => {
      const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csv = [keys.map(escape).join(','), ...responses.map(response =>
      keys.map(key => escape(response[key])).join(','))].join('\r\n');
    this.downloadFile(`\uFEFF${csv}`, 'survey-responses.csv', 'text/csv;charset=utf-8;');
  }

  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

const dataManager = new DataManager();
