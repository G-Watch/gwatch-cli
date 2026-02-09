import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { buildImage, cloneRepo, createContainer, ensureEnvironment, setupDefaultTmux } from '../docker';
import { addContainer, readDb } from '../db';

export async function createAction(options: any) {
  const { repo, dir, dockerfile, name: nameOverride } = options;

  if (!repo && !dir) {
    console.error('Error: You must provide either --repo or --dir');
    process.exit(1);
  }

  let workspacePath: string;
  let repoName: string;

  if (repo) {
    repoName = nameOverride || repo.split('/').pop()?.replace('.git', '') || 'unknown';
    workspacePath = path.join(os.tmpdir(), 'watchtower', repoName);
    await fs.ensureDir(workspacePath);
    await cloneRepo(repo, workspacePath);
  } else {
    workspacePath = path.resolve(dir);
    repoName = nameOverride || path.basename(workspacePath);
  }

  const userName = os.userInfo().username;
  const db = await readDb();
  
  let index = 1;
  let containerName = `${repoName}-${userName}-${index}`;
  while (db.containers.some(c => c.name === containerName)) {
    index++;
    containerName = `${repoName}-${userName}-${index}`;
  }

  const imageName = await buildImage(dockerfile, repoName);
  const container = await createContainer(imageName, containerName, workspacePath);
  
  console.log('Setting up environment (Node.js, Tmux, Gemini CLI)...');
  await ensureEnvironment(container.id);
  
  console.log('Setting up default tmux session...');
  await setupDefaultTmux(container.id);

  await addContainer({
    id: container.id,
    name: containerName,
    creator: userName,
    repoUrl: repo,
    localDir: dir ? path.resolve(dir) : undefined,
    sessions: [{ name: 'default', lastAccess: new Date().toISOString() }],
  });

  console.log(`Container ${containerName} created successfully! (Index: ${db.containers.length})`);
}
