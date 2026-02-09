#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const create_1 = require("./commands/create");
const enter_1 = require("./commands/enter");
const ls_1 = require("./commands/ls");
const stop_1 = require("./commands/stop");
const program = new commander_1.Command();
program
    .name('watchtower')
    .description('Persistent development environments wrapper for Docker and Tmux')
    .version('1.0.0');
program
    .command('create')
    .description('Create a container from a remote git repo or local directory')
    .option('--repo <url>', 'Git repository URL')
    .option('--dir <path>', 'Local directory path')
    .option('--dockerfile <path>', 'Path to Dockerfile', './Dockerfile')
    .option('--name <name>', 'Optional name override')
    .action(create_1.createAction);
program
    .command('enter <target>')
    .description('Enter a container/session (e.g., 0/default)')
    .action(enter_1.enterAction);
program
    .command('ls')
    .description('List containers and sessions')
    .action(ls_1.lsAction);
program
    .command('stop <target>')
    .description('Stop a container or a specific tmux session')
    .action(stop_1.stopAction);
program.parse(process.argv);
