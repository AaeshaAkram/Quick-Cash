const maskSensitive = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(pin|password|token|secret|cvv)/i.test(k)) {
      clone[k] = '***';
    } else if (typeof v === 'object' && v !== null) {
      clone[k] = maskSensitive(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
};

import fs from 'fs'
import path from 'path'

const logDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logDir)) {
  try { fs.mkdirSync(logDir, { recursive: true }) } catch {}
}
const logFile = path.join(logDir, 'app.log')

export function log({ level = 'info', event = 'app', message = '', user = 'anonymous', correlationId, data }) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    message,
    user,
    correlationId,
    data: maskSensitive(data),
  };
  const line = JSON.stringify(payload);
  try { fs.appendFileSync(logFile, line + '\n') } catch {}
}





