"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunningContainers = getRunningContainers;
exports.buildImage = buildImage;
exports.createContainer = createContainer;
exports.ensureEnvironment = ensureEnvironment;
exports.setupDefaultTmux = setupDefaultTmux;
exports.cloneRepo = cloneRepo;
const dockerode_1 = __importDefault(require("dockerode"));
const execa_1 = require("execa");
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const ui_1 = require("./utils/ui");
const docker = new dockerode_1.default();
async function getRunningContainers() {
    return await docker.listContainers();
}
async function runInBox(title, cmd, args, options = {}) {
    const dynamicBox = new ui_1.DynamicBox(title);
    const subprocess = (0, execa_1.execa)(cmd, args, {
        ...options,
        all: true,
    });
    if (subprocess.all) {
        subprocess.all.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach((line) => dynamicBox.update(line));
        });
    }
    try {
        const result = await subprocess;
        dynamicBox.stop();
        return result;
    }
    catch (error) {
        dynamicBox.stop();
        throw error;
    }
}
async function buildImage(dockerfilePath, repoName, contextDir) {
    const imageName = `watchtower-${repoName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    console.log(`Building image ${imageName}...`);
    try {
        await runInBox(`Building Image: ${imageName}`, 'docker', [
            'build', '-t', imageName, '-f', path_1.default.resolve(dockerfilePath), '.'
        ], {
            cwd: contextDir,
            env: { ...process.env, DOCKER_BUILDKIT: '0' }
        });
        (0, ui_1.logSuccess)(`Image ${imageName} built successfully.`);
        return imageName;
    }
    catch (error) {
        (0, ui_1.logError)(`Failed to build image ${imageName}.`);
        (0, ui_1.renderBox)(error.stderr || error.message, 'Docker Build Error', 'red');
        process.exit(1);
    }
}
async function createContainer(imageName, containerName, workspacePath) {
    const spinner = (0, ora_1.default)(`Creating container ${containerName}...`).start();
    try {
        const container = await docker.createContainer({
            Image: imageName,
            name: containerName,
            Tty: true,
            OpenStdin: true,
            HostConfig: {
                Binds: [`${path_1.default.resolve(workspacePath)}:/workspace`],
            },
            WorkingDir: '/workspace',
            Cmd: ['/bin/bash'],
        });
        await container.start();
        spinner.succeed(`Container ${containerName} started.`);
        return container;
    }
    catch (error) {
        spinner.fail(`Failed to create or start container ${containerName}.`);
        (0, ui_1.renderBox)(error.json?.message || error.message, 'Docker Container Error', 'red');
        process.exit(1);
    }
}
async function ensureEnvironment(containerId) {
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
        }
        catch (error) {
            (0, ui_1.logError)(`Failed to install ${item.name}.`);
            (0, ui_1.renderBox)(error.message, 'Environment Setup Error', 'red');
            process.exit(1);
        }
    }
    (0, ui_1.logSuccess)('Environment configured successfully.');
}
async function setupDefaultTmux(containerId) {
    const spinner = (0, ora_1.default)('Starting default tmux session...').start();
    try {
        const container = docker.getContainer(containerId);
        const exec = await container.exec({
            Cmd: ['tmux', 'new-session', '-d', '-s', 'default'],
        });
        await exec.start({});
        spinner.succeed('Default tmux session started.');
    }
    catch (error) {
        spinner.fail('Failed to start default tmux session.');
        process.exit(1);
    }
}
async function cloneRepo(repoUrl, targetDir) {
    console.log(`Cloning repository ${repoUrl}...`);
    try {
        await runInBox(`Cloning Repository`, 'git', ['clone', '--recursive', repoUrl, targetDir]);
        (0, ui_1.logSuccess)('Repository cloned successfully.');
    }
    catch (error) {
        (0, ui_1.logError)(`Failed to clone repository ${repoUrl}.`);
        (0, ui_1.renderBox)(error.stderr || error.message, 'Git Clone Error', 'red');
        process.exit(1);
    }
}
