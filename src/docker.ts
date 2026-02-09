import Docker from 'dockerode';
import { execa } from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const docker = new Docker();

export async function getRunningContainers() {
  return await docker.listContainers();
}

export async function buildImage(dockerfilePath: string, repoName: string) {
  const imageName = `watchtower-${repoName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  console.log(`Building image ${imageName}...`);
  
  // We'll use execa for build to see output more easily or just dockerode
  // For simplicity and better output handling in CLI, execa is often easier for build
  const dockerfileDir = path.dirname(path.resolve(dockerfilePath));
  await execa('docker', ['build', '-t', imageName, '-f', dockerfilePath, '.'], {
    cwd: dockerfileDir,
    stdio: 'inherit',
  });
  
  return imageName;
}

export async function createContainer(imageName: string, containerName: string, workspacePath: string) {
  const container = await docker.createContainer({
    Image: imageName,
    name: containerName,
    Tty: true,
    OpenStdin: true,
    HostConfig: {
      Binds: [`${path.resolve(workspacePath)}:/workspace`],
    },
    WorkingDir: '/workspace',
    Cmd: ['/bin/bash'],
  });

  await container.start();
  return container;
}

export async function ensureEnvironment(containerId: string) {
  const container = docker.getContainer(containerId);
  
  const setupCommands = [
    // Install Node.js if not present (simplified for Ubuntu/Debian based)
    'which node || (apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && apt-get install -y nodejs)',
    // Install Tmux
    'which tmux || (apt-get update && apt-get install -y tmux)',
    // Install gemini-cli
    'which gemini || npm install -g @google/gemini-cli',
  ];

  for (const cmd of setupCommands) {
    const exec = await container.exec({
      Cmd: ['bash', '-c', cmd],
      AttachStdout: true,
      AttachStderr: true,
    });
    const stream = await exec.start({});
    await new Promise((resolve) => {
      container.modem.demuxStream(stream, process.stdout, process.stderr);
      stream.on('end', resolve);
    });
  }
}

export async function setupDefaultTmux(containerId: string) {
  const container = docker.getContainer(containerId);
  const exec = await container.exec({
    Cmd: ['tmux', 'new-session', '-d', '-s', 'default'],
  });
  await exec.start({});
}

export async function cloneRepo(repoUrl: string, targetDir: string) {
  await execa('git', ['clone', '--recursive', repoUrl, targetDir], { stdio: 'inherit' });
}
