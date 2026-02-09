"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterAction = enterAction;
const db_1 = require("../db");
const execa_1 = require("execa");
const ui_1 = require("../utils/ui");
async function enterAction(target) {
    const [indexStr, sessionName] = target.split('/');
    const index = parseInt(indexStr, 10);
    const db = await (0, db_1.readDb)();
    const container = db.containers[index];
    if (!container) {
        (0, ui_1.logError)(`Container at index ${index} not found.`);
        process.exit(1);
    }
    const finalSessionName = sessionName || 'default';
    // Check if session exists, if not create it
    try {
        await (0, execa_1.execa)('docker', ['exec', container.id, 'tmux', 'has-session', '-t', finalSessionName]);
    }
    catch (e) {
        (0, ui_1.logInfo)(`Session ${finalSessionName} not found. Creating it...`);
        await (0, execa_1.execa)('docker', ['exec', container.id, 'tmux', 'new-session', '-d', '-s', finalSessionName]);
    }
    await (0, db_1.updateContainerSession)(container.name, finalSessionName);
    (0, ui_1.logInfo)(`Entering session ${finalSessionName} in container ${container.name}...`);
    try {
        await (0, execa_1.execa)('docker', ['exec', '-it', container.id, 'tmux', 'attach', '-t', finalSessionName], {
            stdio: 'inherit',
        });
    }
    catch (e) {
        (0, ui_1.logError)(`Error attaching to tmux session: ${e.message}`);
    }
}
