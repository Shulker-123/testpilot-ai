const vscode = require('vscode');
const { generateTestsForDirectory } = require('./helpers/unitTests');
const { expandTestsForDirectory } = require('./helpers/unitTestsExpand');
const { TestPreviewPanel } = require('./ui/testPreviewPanel');
const { ResultsSidebarProvider } = require('./ui/resultsSidebarProvider');

/**
 * Activates the TestPilot VS Code Extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('TestPilot Extension is now active.');

    // Initialize sidebar results provider
    const resultsProvider = new ResultsSidebarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ResultsSidebarProvider.viewType, resultsProvider)
    );

    // Command: Generate Tests
    const generateCmd = vscode.commands.registerCommand('testpilot.generateTests', async (uri) => {
        let filePath = uri ? uri.fsPath : null;
        let funcName = null;

        const editor = vscode.window.activeTextEditor;
        if (!filePath && editor) {
            filePath = editor.document.fileName;
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection).trim();
            if (selectedText && /^[a-zA-Z0-9_$]+$/.test(selectedText)) {
                funcName = selectedText;
            }
        }

        if (!filePath) {
            vscode.window.showErrorMessage('TestPilot: Please open a JavaScript/TypeScript file to generate tests.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `TestPilot: Generating tests for ${funcName || filePath}...`,
            cancellable: false
        }, async () => {
            try {
                const results = await generateTestsForDirectory({
                    path: filePath,
                    func: funcName,
                    force: true
                });

                if (results && results.testsGenerated && results.testsGenerated.length > 0) {
                    vscode.window.showInformationMessage(`TestPilot: Generated ${results.testsGenerated.length} unit test suites!`);
                    resultsProvider.updateResults(results);
                } else {
                    vscode.window.showWarningMessage('TestPilot: No tests generated. Ensure the function is exported.');
                }
            } catch (err) {
                vscode.window.showErrorMessage(`TestPilot Error: ${err.message}`);
            }
        });
    });

    // Command: Expand Tests for Higher Coverage
    const expandCmd = vscode.commands.registerCommand('testpilot.expandTests', async (uri) => {
        let testPath = uri ? uri.fsPath : null;
        const editor = vscode.window.activeTextEditor;
        if (!testPath && editor) {
            testPath = editor.document.fileName;
        }

        if (!testPath) {
            vscode.window.showErrorMessage('TestPilot: Please select a test file to expand.');
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'TestPilot: Expanding unit tests for missing branch coverage...',
            cancellable: false
        }, async () => {
            try {
                await expandTestsForDirectory({ path: testPath, force: true });
                vscode.window.showInformationMessage('TestPilot: Unit tests expanded with additional edge cases!');
            } catch (err) {
                vscode.window.showErrorMessage(`TestPilot Expand Error: ${err.message}`);
            }
        });
    });

    // Command: Run Tests & Measure Coverage
    const runCmd = vscode.commands.registerCommand('testpilot.runTests', async () => {
        vscode.window.showInformationMessage('TestPilot: Executing Jest unit tests in sandbox...');
        const terminal = vscode.window.createTerminal('TestPilot Runner');
        terminal.show();
        terminal.sendText('npm test');
    });

    // Command: Show Preview Panel
    const previewCmd = vscode.commands.registerCommand('testpilot.showPreview', (testData) => {
        TestPreviewPanel.createOrShow(context.extensionUri, testData);
    });

    // CodeLens Provider: Add "⚡ TestPilot: Generate Tests" button above functions
    const codeLensProvider = {
        provideCodeLenses(document) {
            const lenses = [];
            const text = document.getText();
            const exportRegex = /(?:export\s+(?:async\s+)?function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
            let match;

            while ((match = exportRegex.exec(text)) !== null) {
                const funcName = match[1] || match[2];
                const position = document.positionAt(match.index);
                const range = new vscode.Range(position, position);

                lenses.push(new vscode.CodeLens(range, {
                    title: `⚡ TestPilot: Generate Tests for ${funcName}`,
                    command: 'testpilot.generateTests',
                    arguments: [document.uri]
                }));
            }

            return lenses;
        }
    };

    context.subscriptions.push(
        generateCmd,
        expandCmd,
        runCmd,
        previewCmd,
        vscode.languages.registerCodeLensProvider(['javascript', 'typescript'], codeLensProvider)
    );
}

function deactivate() {
    console.log('TestPilot Extension deactivated.');
}

module.exports = {
    activate,
    deactivate
};
