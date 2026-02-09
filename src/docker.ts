import Docker from 'dockerode';
import { execa } from 'execa';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import ora from 'ora';
import { renderBox, logSuccess, logError, DynamicBox } from './utils/ui';

const docker = new Docker();

export async function getRunningContainers() {
  return await docker.listContainers();
}

async function runInBox(title: string, cmd: string, args: string[], options: any = {}) {
  const dynamicBox = new DynamicBox(title);
  const subprocess = execa(cmd, args, {
    ...options,
    all: true,
  });

  if (subprocess.all) {
    subprocess.all.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach((line: string) => dynamicBox.update(line));
    });
  }

  try {
    const result = await subprocess;
    dynamicBox.stop();
    return result;
  } catch (error: any) {
    dynamicBox.stop();
    throw error;
  }
}

export async function buildImage(dockerfilePath: string, repoName: string, contextDir: string) {
  const imageName = `watchtower-${repoName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  console.log(`Building image ${imageName}...`);
  
  try {
    await runInBox(`Building Image: ${imageName}`, 'docker', [
      'build', '-t', imageName, '-f', path.resolve(dockerfilePath), '.'
    ], {
      cwd: contextDir,
      env: { ...process.env, DOCKER_BUILDKIT: '0' }
    });
    logSuccess(`Image ${imageName} built successfully.`);
    return imageName;
  } catch (error: any) {
    logError(`Failed to build image ${imageName}.`);
    renderBox(error.stderr || error.message, 'Docker Build Error', 'red');
    process.exit(1);
  }
}

export async function createContainer(imageName: string, containerName: string, workspacePath: string) {
  const spinner = ora(`Creating container ${containerName}...`).start();
  try {
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
    spinner.succeed(`Container ${containerName} started.`);
    return container;
  } catch (error: any) {
    spinner.fail(`Failed to create or start container ${containerName}.`);
    renderBox(error.json?.message || error.message, 'Docker Container Error', 'red');
    process.exit(1);
  }
}

export async function ensureEnvironment(containerId: string) {
  const container = docker.getContainer(containerId);
  console.log('Configuring environment inside container...');
  
  const setupCommands = [
    { name: 'Node.js', cmd: 'which node || (apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && apt-get install -y nodejs)' },
    { name: 'Tmux', cmd: 'which tmux || (apt-get update && apt-get install -y tmux)' },
    { name: 'Gemini CLI', cmd: 'which gemini || npm install -g @google/gemini-cli' },
  ];

  for (const item of setupCommands) {
    try {
      await runInBox(`Installing ${item.name}`, 'docker', ['exec', containerId, 'bash', '-c', item.cmd]);
    } catch (error: any) {
      logError(`Failed to install ${item.name}.`);
      renderBox(error.message, 'Environment Setup Error', 'red');
      process.exit(1);
    }
  }
  logSuccess('Environment configured successfully.');
}

export async function setupDefaultTmux(containerId: string) {
  const spinner = ora('Starting default tmux session...').start();
  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['tmux', 'new-session', '-d', '-s', 'default'],
    });
    await exec.start({});
    spinner.succeed('Default tmux session started.');
  } catch (error: any) {
    spinner.fail('Failed to start default tmux session.');
    process.exit(1);
  }
}

export async function cloneRepo(repoUrl: string, targetDir: string) {
  console.log(`Cloning repository ${repoUrl}...`);
  try {
    await runInBox(`Cloning Repository`, 'git', ['clone', '--recursive', repoUrl, targetDir]);
    logSuccess('Repository cloned successfully.');
  } catch (error: any) {
    logError(`Failed to clone repository ${repoUrl}.`);
    renderBox(error.stderr || error.message, 'Git Clone Error', 'red');
    process.exit(1);
  }
}