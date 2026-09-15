/**
 * TestPilot - Automated Unit Test Generation & Coverage Analysis
 * Visual Studio Code Extension Entry Point (Core Activation)
 * Author: Shulker-123
 */

const vscode = require('vscode');

function activate(context) {
    console.log('[TestPilot] Extension activated successfully.');

    const generateCmd = vscode.commands.registerCommand('testpilot.generateTests', async (uri) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('TestPilot: Open a JavaScript/TypeScript file first.');
            return;
        }
        vscode.window.showInformationMessage(`TestPilot: Initiating test generation for ${editor.document.fileName}...`);
    });

    const expandCmd = vscode.commands.registerCommand('testpilot.expandTests', async () => {
        vscode.window.showInformationMessage('TestPilot: Expanding test suite with missing edge cases...');
    });

    const runCmd = vscode.commands.registerCommand('testpilot.runTests', async () => {
        vscode.window.showInformationMessage('TestPilot: Running Jest test suite...');
    });

    const previewCmd = vscode.commands.registerCommand('testpilot.showPreview', async () => {
        vscode.window.showInformationMessage('TestPilot: Opening test preview panel...');
    });

    context.subscriptions.push(generateCmd, expandCmd, runCmd, previewCmd);
}

function deactivate() {
    console.log('[TestPilot] Extension deactivated.');
}

module.exports = {
    activate,
    deactivate
};
