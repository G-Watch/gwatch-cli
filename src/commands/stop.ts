import { readDb, removeContainer, removeSession } from '../db';
import { execa } from 'execa';
import Docker from 'dockerode';

const docker = new Docker();

export async function stopAction(target: string) {
  const parts = target.split('/');
  const index = parseInt(parts[0], 10);
  const sessionName = parts[1];

  const db = await readDb();
  const containerInfo = db.containers[index];

  if (!containerInfo) {
    console.error(`Error: Container at index ${index} not found.`);
    process.exit(1);
  }

  if (sessionName) {
    // Stop specific tmux session
    console.log(`Killing tmux session ${sessionName} in container ${containerInfo.name}...`);
    try {
      await execa('docker', ['exec', containerInfo.id, 'tmux', 'kill-session', '-t', sessionName]);
      await removeSession(index, sessionName);
    } catch (e) {
      console.error(`Error killing session ${sessionName}:`, e);
    }
  } else {
    // Stop the whole container
    console.log(`Stopping container ${containerInfo.name}...`);
    try {
      const container = docker.getContainer(containerInfo.id);
      await container.stop();
      await container.remove();
      await removeContainer(containerInfo.name);
      console.log(`Container ${containerInfo.name} stopped and removed.`);
    } catch (e) {
      console.error(`Error stopping container ${containerInfo.name}:`, (e as Error).message);
    }
  }
}
