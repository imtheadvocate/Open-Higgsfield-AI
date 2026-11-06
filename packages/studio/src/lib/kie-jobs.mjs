export function normalizeKieResult(data) {
  let parsed = {};
  if (data.resultJson) {
    try { parsed = typeof data.resultJson === 'string' ? JSON.parse(data.resultJson) : data.resultJson; }
    catch { throw new Error('KIE returned invalid result JSON.'); }
  }
  const urls = data.resultUrls || data.response?.resultUrls || parsed?.resultUrls || [];
  return { ...data, resultUrls: urls, url: urls[0] || data.url || null };
}

export async function pollKieJobs({ taskId, apiKey, baseUrl = 'https://api.kie.ai', maxAttempts = 300, interval = 2000, fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(interval);
    let response;
    try {
      response = await fetchImpl(`${baseUrl}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(30000)
      });
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      continue;
    }
    if (!response.ok) {
      if (response.status === 429 || response.status >= 500) continue;
      throw new Error(`KIE polling failed (${response.status}).`);
    }
    const json = await response.json();
    const code = Number(json.code ?? 200);
    if ([429, 455, 500].includes(code)) continue;
    if (code !== 200) throw new Error(`KIE polling failed (${code}): ${json.msg || 'Unknown error'}`);
    const data = json.data || {};
    const state = String(data.state || '').toLowerCase();
    if (state === 'success') return normalizeKieResult(data);
    if (['fail', 'error'].includes(state)) throw new Error(`Generation failed: ${data.failMsg || 'Unknown error'}`);
  }
  throw new Error(`Generation timed out. Resume task ${taskId}; do not submit it again.`);
}
