#!/usr/bin/env node
import { Command } from 'commander';
import { createAction } from './commands/create';
import { enterAction } from './commands/enter';
import { lsAction } from './commands/ls';
import { stopAction } from './commands/stop';

const program = new Command();

const LOGO = `

▄▄▄▄  ▄▄▄  ▄▄▄▄                  ▄▄   ▄▄▄▄▄▄▄▄▄                        
▀███  ███  ███▀       ██         ██   ▀▀▀███▀▀▀                        
 ███  ███  ███  ▀▀█▄ ▀██▀▀ ▄████ ████▄   ███ ▄███▄ ██   ██ ▄█▀█▄ ████▄ 
 ███▄▄███▄▄███ ▄█▀██  ██   ██    ██ ██   ███ ██ ██ ██ █ ██ ██▄█▀ ██ ▀▀ 
  ▀████▀████▀  ▀█▄██  ██   ▀████ ██ ██   ███ ▀███▀  ██▀██  ▀█▄▄▄ ██    

`;

program
  .name('watchtower')
  .description('Persistent development environments wrapper for Docker and Tmux')
  .version('1.0.0')
  .addHelpText('before', LOGO);

program
  .command('create')
  .description('Create a container from a remote git repo or local directory')
  .option('--repo <url>', 'Git repository URL')
  .option('--dir <path>', 'Local directory path')
  .option('--dockerfile <path>', 'Path to Dockerfile', './Dockerfile')
  .option('--name <name>', 'Optional name override')
  .action(createAction);

program
  .command('enter <target>')
  .description('Enter a container/session (e.g., 0/default)')
  .action(enterAction);

program
  .command('ls')
  .description('List containers and sessions')
  .action(lsAction);

program
  .command('stop <target>')
  .description('Stop a container or a specific tmux session')
  .action(stopAction);

// Logic to show logo and help if no command is provided
if (process.argv.length === 2) {
  program.help();
}

// Logic to show logo on version
if (process.argv.includes('-V') || process.argv.includes('--version')) {
  console.log(LOGO);
}

program.parse(process.argv);