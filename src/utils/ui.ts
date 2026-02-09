import boxen from 'boxen';
import chalk from 'chalk';
import logUpdate from 'log-update';

export function renderBox(content: string, title?: string, color: string = 'cyan') {
  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: color,
      title: title ? chalk.bold(title) : undefined,
      titleAlignment: 'left',
    })
  );
}

export function logInfo(message: string) {
  console.log(chalk.blue('ℹ ') + message);
}

export function logSuccess(message: string) {
  console.log(chalk.green('✔ ') + message);
}

export function logError(message: string) {
  console.log(chalk.red('▀ ') + message);
}

export class DynamicBox {
  private lines: string[] = [];
  private maxLines: number;
  private title: string;
  private color: string;

  constructor(title: string, maxLines: number = 10, color: string = 'cyan') {
    this.title = title;
    this.maxLines = maxLines;
    this.color = color;
  }

  update(line: string) {
    if (!line.trim()) return;
    this.lines.push(line.trim());
    if (this.lines.length > this.maxLines) {
      this.lines.shift();
    }
    this.render();
  }

  private render() {
    const content = this.lines.join('\n');
    logUpdate(
      boxen(content, {
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
        margin: 1,
        borderStyle: 'round',
        borderColor: this.color,
        title: chalk.bold(this.title),
        titleAlignment: 'left',
      })
    );
  }

  stop() {
    logUpdate.done();
  }
}