"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopAction = stopAction;
const db_1 = require("../db");
const execa_1 = require("execa");
const dockerode_1 = __importDefault(require("dockerode"));
const docker = new dockerode_1.default();
async function stopAction(target) {
    const parts = target.split('/');
    const index = parseInt(parts[0], 10);
    const sessionName = parts[1];
    const db = await (0, db_1.readDb)();
    const containerInfo = db.containers[index];
    if (!containerInfo) {
        console.error(`Error: Container at index ${index} not found.`);
        process.exit(1);
    }
    if (sessionName) {
        // Stop specific tmux session
        console.log(`Killing tmux session ${sessionName} in container ${containerInfo.name}...`);
        try {
            await (0, execa_1.execa)('docker', ['exec', containerInfo.id, 'tmux', 'kill-session', '-t', sessionName]);
            await (0, db_1.removeSession)(index, sessionName);
        }
        catch (e) {
            console.error(`Error killing session ${sessionName}:`, e);
        }
    }
    else {
        // Stop the whole container
        console.log(`Stopping container ${containerInfo.name}...`);
        try {
            const container = docker.getContainer(containerInfo.id);
            await container.stop();
            await container.remove();
            await (0, db_1.removeContainer)(containerInfo.name);
            console.log(`Container ${containerInfo.name} stopped and removed.`);
        }
        catch (e) {
            console.error(`Error stopping container ${containerInfo.name}:`, e.message);
        }
    }
}
