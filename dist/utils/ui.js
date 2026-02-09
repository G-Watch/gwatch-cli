"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicBox = void 0;
exports.renderBox = renderBox;
exports.logInfo = logInfo;
exports.logSuccess = logSuccess;
exports.logError = logError;
const boxen_1 = __importDefault(require("boxen"));
const chalk_1 = __importDefault(require("chalk"));
const log_update_1 = __importDefault(require("log-update"));
function renderBox(content, title, color = 'cyan') {
    console.log((0, boxen_1.default)(content, {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: color,
        title: title ? chalk_1.default.bold(title) : undefined,
        titleAlignment: 'left',
    }));
}
function logInfo(message) {
    console.log(chalk_1.default.blue('ℹ ') + message);
}
function logSuccess(message) {
    console.log(chalk_1.default.green('✔ ') + message);
}
function logError(message) {
    console.log(chalk_1.default.red('▀ ') + message);
}
class DynamicBox {
    lines = [];
    maxLines;
    title;
    color;
    constructor(title, maxLines = 10, color = 'cyan') {
        this.title = title;
        this.maxLines = maxLines;
        this.color = color;
    }
    update(line) {
        if (!line.trim())
            return;
        this.lines.push(line.trim());
        if (this.lines.length > this.maxLines) {
            this.lines.shift();
        }
        this.render();
    }
    render() {
        const content = this.lines.join('\n');
        (0, log_update_1.default)((0, boxen_1.default)(content, {
            padding: { left: 1, right: 1, top: 0, bottom: 0 },
            margin: 1,
            borderStyle: 'round',
            borderColor: this.color,
            title: chalk_1.default.bold(this.title),
            titleAlignment: 'left',
        }));
    }
    stop() {
        log_update_1.default.done();
    }
}
exports.DynamicBox = DynamicBox;
