"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.readDb = readDb;
exports.writeDb = writeDb;
exports.updateContainerSession = updateContainerSession;
exports.addContainer = addContainer;
exports.removeContainer = removeContainer;
exports.removeSession = removeSession;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const zod_1 = require("zod");
const DB_DIR = path_1.default.join(os_1.default.homedir(), '.watchtower');
const DB_FILE = path_1.default.join(DB_DIR, 'db.json');
const SessionSchema = zod_1.z.object({
    name: zod_1.z.string(),
    lastAccess: zod_1.z.string(),
});
const ContainerSchema = zod_1.z.object({
    id: zod_1.z.string(), // Docker container ID
    name: zod_1.z.string(), // Watchtower container name
    creator: zod_1.z.string(),
    repoUrl: zod_1.z.string().optional(),
    localDir: zod_1.z.string().optional(),
    sessions: zod_1.z.array(SessionSchema),
});
const DatabaseSchema = zod_1.z.object({
    containers: zod_1.z.array(ContainerSchema),
});
async function initDb() {
    await fs_extra_1.default.ensureDir(DB_DIR);
    if (!(await fs_extra_1.default.pathExists(DB_FILE))) {
        await fs_extra_1.default.writeJson(DB_FILE, { containers: [] });
    }
}
async function readDb() {
    await initDb();
    const data = await fs_extra_1.default.readJson(DB_FILE);
    return DatabaseSchema.parse(data);
}
async function writeDb(db) {
    await fs_extra_1.default.writeJson(DB_FILE, db, { spaces: 2 });
}
async function updateContainerSession(containerName, sessionName) {
    const db = await readDb();
    const container = db.containers.find(c => c.name === containerName);
    if (container) {
        const session = container.sessions.find(s => s.name === sessionName);
        const now = new Date().toISOString();
        if (session) {
            session.lastAccess = now;
        }
        else {
            container.sessions.push({ name: sessionName, lastAccess: now });
        }
        await writeDb(db);
    }
}
async function addContainer(container) {
    const db = await readDb();
    db.containers.push(container);
    await writeDb(db);
}
async function removeContainer(containerName) {
    const db = await readDb();
    db.containers = db.containers.filter(c => c.name !== containerName);
    await writeDb(db);
}
async function removeSession(containerIndex, sessionName) {
    const db = await readDb();
    const container = db.containers[containerIndex];
    if (container) {
        container.sessions = container.sessions.filter(s => s.name !== sessionName);
        await writeDb(db);
    }
}
