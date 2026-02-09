"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterAction = enterAction;
const db_1 = require("../db");
const execa_1 = require("execa");
async function enterAction(target) {
    const [indexStr, sessionName] = target.split('/');
    const index = parseInt(indexStr, 10);
    const db = await (0, db_1.readDb)();
    const container = db.containers[index];
    if (!container) {
        console.error(`Error: Container at index ${index} not found.`);
        process.exit(1);
    }
    const finalSessionName = sessionName || 'default';
    // Check if session exists, if not create it
    try {
        // Try to list sessions and see if ours is there
        await (0, execa_1.execa)('docker', ['exec', container.id, 'tmux', 'has-session', '-t', finalSessionName]);
    }
    catch (e) {
        // Session doesn't exist, create it
        console.log(`Session ${finalSessionName} not found. Creating it...`);
        await (0, execa_1.execa)('docker', ['exec', container.id, 'tmux', 'new-session', '-d', '-s', finalSessionName]);
    }
    await (0, db_1.updateContainerSession)(container.name, finalSessionName);
    // Attach to session
    console.log(`Entering session ${finalSessionName} in container ${container.name}...`);
    try {
        await (0, execa_1.execa)('docker', ['exec', '-it', container.id, 'tmux', 'attach', '-t', finalSessionName], {
            stdio: 'inherit',
        });
    }
    catch (e) {
        // Docker exec -it might fail if not in a TTY, but for CLI it should be fine
        console.error('Error attaching to tmux session:', e);
    }
}
