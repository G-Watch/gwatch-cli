import { readDb } from '../db';
import { getRunningContainers } from '../docker';
import { renderBox } from '../utils/ui';

export async function lsAction() {
  const db = await readDb();
  const runningContainers = await getRunningContainers();

  let output = '| Index/Session | Container Name       | Creator | Uptime               | Last Access |\n';
  output += '|---------------|----------------------|---------|----------------------|-------------|\n';

  db.containers.forEach((container, idx) => {
    const dockerInfo = runningContainers.find(c => c.Id === container.id || c.Names.some(n => n.includes(container.name)));
    const uptime = dockerInfo ? dockerInfo.Status : 'Stopped';
    
    container.sessions.forEach(session => {
      const lastAccess = new Date(session.lastAccess);
      const today = new Date();
      let lastAccessStr = lastAccess.toLocaleString();
      
      if (lastAccess.toDateString() === today.toDateString()) {
        lastAccessStr = `${lastAccess.getHours().toString().padStart(2, '0')}:${lastAccess.getMinutes().toString().padStart(2, '0')} Today`;
      }

      output += `| ${(idx + '/' + session.name).padEnd(13)} | ${container.name.padEnd(20)} | ${container.creator.padEnd(7)} | ${uptime.padEnd(20)} | ${lastAccessStr} |\n`;
    });
  });

  renderBox(output, 'Watchtower Environments');
}