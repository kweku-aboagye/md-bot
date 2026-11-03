import { CENTRAL_TZ } from '../scheduling/central-time';

export function log(message: string, source = 'express') {
  const formattedTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: CENTRAL_TZ,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}
