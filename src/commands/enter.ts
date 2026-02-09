import { readDb, updateContainerSession } from '../db';
import { execa } from 'execa';
import { logError, logInfo } from '../utils/ui';

export async function enterAction(target: string) {
  const [indexStr, sessionName] = target.split('/');
  const index = parseInt(indexStr, 10);
  
  const db = await readDb();
  const container = db.containers[index];
  
  if (!container) {
    logError(`Container at index ${index} not found.`);
    process.exit(1);
  }

  const finalSessionName = sessionName || 'default';

  // Check if session exists, if not create it
  try {
    await execa('docker', ['exec', container.id, 'tmux', 'has-session', '-t', finalSessionName]);
  } catch (e) {
    logInfo(`Session ${finalSessionName} not found. Creating it...`);
    await execa('docker', ['exec', container.id, 'tmux', 'new-session', '-d', '-s', finalSessionName]);
  }

  await updateContainerSession(container.name, finalSessionName);

  logInfo(`Entering session ${finalSessionName} in container ${container.name}...`);
  try {
    await execa('docker', ['exec', '-it', container.id, 'tmux', 'attach', '-t', finalSessionName], {
      stdio: 'inherit',
    });
  } catch (e: any) {
    logError(`Error attaching to tmux session: ${e.message}`);
  }
}