import { readDb, removeContainer, removeSession } from '../db';
import { execa } from 'execa';
import Docker from 'dockerode';
import { logSuccess, logError } from '../utils/ui';

const docker = new Docker();

export async function stopAction(target: string) {
  const parts = target.split('/');
  const index = parseInt(parts[0], 10);
  const sessionName = parts[1];

  const db = await readDb();
  const containerInfo = db.containers[index];

  if (!containerInfo) {
    logError(`Container at index ${index} not found.`);
    process.exit(1);
  }

  if (sessionName) {
    try {
      await execa('docker', ['exec', containerInfo.id, 'tmux', 'kill-session', '-t', sessionName]);
      await removeSession(index, sessionName);
      logSuccess(`Tmux session ${sessionName} in container ${containerInfo.name} stopped.`);
    } catch (e: any) {
      logError(`Error killing session ${sessionName}: ${e.message}`);
    }
  } else {
    try {
      const container = docker.getContainer(containerInfo.id);
      await container.stop();
      await container.remove();
      await removeContainer(containerInfo.name);
      logSuccess(`Container ${containerInfo.name} stopped and removed.`);
    } catch (e: any) {
      logError(`Error stopping container ${containerInfo.name}: ${e.message}`);
    }
  }
}