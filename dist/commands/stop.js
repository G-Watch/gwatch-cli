"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopAction = stopAction;
const db_1 = require("../db");
const execa_1 = require("execa");
const dockerode_1 = __importDefault(require("dockerode"));
const ui_1 = require("../utils/ui");
const docker = new dockerode_1.default();
async function stopAction(target) {
    const parts = target.split('/');
    const index = parseInt(parts[0], 10);
    const sessionName = parts[1];
    const db = await (0, db_1.readDb)();
    const containerInfo = db.containers[index];
    if (!containerInfo) {
        (0, ui_1.logError)(`Container at index ${index} not found.`);
        process.exit(1);
    }
    if (sessionName) {
        try {
            await (0, execa_1.execa)('docker', ['exec', containerInfo.id, 'tmux', 'kill-session', '-t', sessionName]);
            await (0, db_1.removeSession)(index, sessionName);
            (0, ui_1.logSuccess)(`Tmux session ${sessionName} in container ${containerInfo.name} stopped.`);
        }
        catch (e) {
            (0, ui_1.logError)(`Error killing session ${sessionName}: ${e.message}`);
        }
    }
    else {
        try {
            const container = docker.getContainer(containerInfo.id);
            await container.stop();
            await container.remove();
            await (0, db_1.removeContainer)(containerInfo.name);
            (0, ui_1.logSuccess)(`Container ${containerInfo.name} stopped and removed.`);
        }
        catch (e) {
            (0, ui_1.logError)(`Error stopping container ${containerInfo.name}: ${e.message}`);
        }
    }
}
