/**
 * TestPilot - Automated Unit Test Generation & Coverage Analysis
 * Visual Studio Code Extension Entry Point
 * Author: Shulker-123
 */

const vscode = require('vscode');

class TestPilotCodeLensProvider {
    provideCodeLenses(document, token) {
        const codeLenses = [];
        const text = document.getText();
        const regex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const funcName = match[1] || match[2];
            const position = document.positionAt(match.index);
            const range = new vscode.Range(position, position);

            const cmd = {
                title: `$(beaker) TestPilot: Generate Tests for ${funcName}`,
                command: 'testpilot.generateTests',
                arguments: [{ document, funcName, line: position.line }]
            };
            codeLenses.push(new vscode.CodeLens(range, cmd));
        }

        return codeLenses;
    }
}

function activate(context) {
    console.log('[TestPilot] Extension activated.');

    const codelensDisposable = vscode.languages.registerCodeLensProvider(
        [{ scheme: 'file', language: 'javascript' }, { scheme: 'file', language: 'typescript' }],
        new TestPilotCodeLensProvider()
    );
    context.subscriptions.push(codelensDisposable);

    const generateCmd = vscode.commands.registerCommand('testpilot.generateTests', async (args) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('TestPilot: Open a file first.');
            return;
        }

        const selectedText = editor.document.getText(editor.selection);
        const code = selectedText || editor.document.getText();
        const filePath = editor.document.fileName;

        vscode.window.showInformationMessage(`TestPilot: Processing test generation for ${filePath}...`);
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
    deactivate,
    TestPilotCodeLensProvider
};
