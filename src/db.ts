import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { z } from 'zod';

const DB_DIR = path.join(os.homedir(), '.watchtower');
const DB_FILE = path.join(DB_DIR, 'db.json');

const SessionSchema = z.object({
  name: z.string(),
  lastAccess: z.string(),
});

const ContainerSchema = z.object({
  id: z.string(), // Docker container ID
  name: z.string(), // Watchtower container name
  creator: z.string(),
  repoUrl: z.string().optional(),
  localDir: z.string().optional(),
  sessions: z.array(SessionSchema),
});

const DatabaseSchema = z.object({
  containers: z.array(ContainerSchema),
});

type Database = z.infer<typeof DatabaseSchema>;
type Container = z.infer<typeof ContainerSchema>;

export async function initDb() {
  await fs.ensureDir(DB_DIR);
  if (!(await fs.pathExists(DB_FILE))) {
    await fs.writeJson(DB_FILE, { containers: [] });
  }
}

export async function readDb(): Promise<Database> {
  await initDb();
  const data = await fs.readJson(DB_FILE);
  return DatabaseSchema.parse(data);
}

export async function writeDb(db: Database) {
  await fs.writeJson(DB_FILE, db, { spaces: 2 });
}

export async function updateContainerSession(containerName: string, sessionName: string) {
  const db = await readDb();
  const container = db.containers.find(c => c.name === containerName);
  if (container) {
    const session = container.sessions.find(s => s.name === sessionName);
    const now = new Date().toISOString();
    if (session) {
      session.lastAccess = now;
    } else {
      container.sessions.push({ name: sessionName, lastAccess: now });
    }
    await writeDb(db);
  }
}

export async function addContainer(container: Container) {
  const db = await readDb();
  db.containers.push(container);
  await writeDb(db);
}

export async function removeContainer(containerName: string) {
  const db = await readDb();
  db.containers = db.containers.filter(c => c.name !== containerName);
  await writeDb(db);
}

export async function removeSession(containerIndex: number, sessionName: string) {
  const db = await readDb();
  const container = db.containers[containerIndex];
  if (container) {
    container.sessions = container.sessions.filter(s => s.name !== sessionName);
    await writeDb(db);
  }
}
