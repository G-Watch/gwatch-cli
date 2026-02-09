"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAction = createAction;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const docker_1 = require("../docker");
const db_1 = require("../db");
const ui_1 = require("../utils/ui");
async function createAction(options) {
    const { repo, dir, dockerfile, name: suffix } = options;
    if (!repo && !dir) {
        console.error('Error: You must provide either --repo or --dir');
        process.exit(1);
    }
    let workspacePath;
    let baseName;
    if (repo) {
        baseName = repo.split('/').pop()?.replace('.git', '') || 'unknown';
        workspacePath = path_1.default.join(os_1.default.tmpdir(), 'watchtower', baseName);
        await fs_extra_1.default.ensureDir(workspacePath);
        await (0, docker_1.cloneRepo)(repo, workspacePath);
    }
    else {
        workspacePath = path_1.default.resolve(dir);
        baseName = path_1.default.basename(workspacePath);
    }
    const userName = os_1.default.userInfo().username;
    const db = await (0, db_1.readDb)();
    let index = 1;
    const generateContainerName = (idx) => {
        const parts = [baseName, userName];
        if (suffix)
            parts.push(suffix);
        parts.push(idx.toString());
        return parts.join('-');
    };
    let containerName = generateContainerName(index);
    while (db.containers.some(c => c.name === containerName)) {
        index++;
        containerName = generateContainerName(index);
    }
    const imageName = await (0, docker_1.buildImage)(dockerfile, baseName, workspacePath);
    const container = await (0, docker_1.createContainer)(imageName, containerName, workspacePath);
    console.log('Setting up environment (Node.js, Tmux, Gemini CLI)...');
    await (0, docker_1.ensureEnvironment)(container.id);
    console.log('Setting up default tmux session...');
    await (0, docker_1.setupDefaultTmux)(container.id);
    await (0, db_1.addContainer)({
        id: container.id,
        name: containerName,
        creator: userName,
        repoUrl: repo,
        localDir: dir ? path_1.default.resolve(dir) : undefined,
        sessions: [{ name: 'default', lastAccess: new Date().toISOString() }],
    });
    (0, ui_1.logSuccess)(`Container ${containerName} created successfully! (Index: ${db.containers.length})`);
}
