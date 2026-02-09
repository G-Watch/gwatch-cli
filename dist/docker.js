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
const docker = new dockerode_1.default();
async function getRunningContainers() {
    return await docker.listContainers();
}
async function buildImage(dockerfilePath, repoName, contextDir) {
    const imageName = `watchtower-${repoName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    console.log(`Building image ${imageName}...`);
    await (0, execa_1.execa)('docker', ['build', '-t', imageName, '-f', path_1.default.resolve(dockerfilePath), '.'], {
        cwd: contextDir,
        stdio: 'inherit',
        env: {
            ...process.env,
            DOCKER_BUILDKIT: '0'
        }
    });
    return imageName;
}
async function createContainer(imageName, containerName, workspacePath) {
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
    return container;
}
async function ensureEnvironment(containerId) {
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
async function setupDefaultTmux(containerId) {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
        Cmd: ['tmux', 'new-session', '-d', '-s', 'default'],
    });
    await exec.start({});
}
async function cloneRepo(repoUrl, targetDir) {
    await (0, execa_1.execa)('git', ['clone', '--recursive', repoUrl, targetDir], { stdio: 'inherit' });
}
