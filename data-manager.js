const API_BASE_URL = 'https://survey-collector.igpig1226.workers.dev';

class DataManager {
  async saveResponse(data, submissionId) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, answers: data }),
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
    if (!response.ok) throw new Error(result.error || '提交失败，请稍后重试。');
    return result.id;
  }
}

const dataManager = new DataManager();
