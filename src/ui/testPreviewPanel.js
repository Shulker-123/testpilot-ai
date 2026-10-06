/**
 * TestPreviewPanel: VS Code Webview panel for reviewing and editing tests
 */
class TestPreviewPanel {
    static currentPanel = undefined;
    static viewType = 'testpilot.preview';

    static createOrShow(extensionUri, testData) {
        const column = 1;

        if (TestPreviewPanel.currentPanel) {
            TestPreviewPanel.currentPanel._panel.reveal(column);
            TestPreviewPanel.currentPanel._update(testData);
            return;
        }

        const panel = {
            reveal: () => {},
            webview: {
                html: TestPreviewPanel._getHtmlForWebview(testData),
                onDidReceiveMessage: () => {}
            },
            onDidDispose: () => {
                TestPreviewPanel.currentPanel = undefined;
            }
        };

        TestPreviewPanel.currentPanel = new TestPreviewPanel(panel, extensionUri, testData);
    }

    constructor(panel, extensionUri, testData) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._testData = testData;
    }

    _update(testData) {
        this._testData = testData;
        if (this._panel && this._panel.webview) {
            this._panel.webview.html = TestPreviewPanel._getHtmlForWebview(testData);
        }
    }

    static _getHtmlForWebview(testData = {}) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>TestPilot Test Preview</title>
    <style>
        body { font-family: sans-serif; padding: 15px; }
        pre { background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 4px; overflow-x: auto; }
        .btn { background: #007acc; color: white; border: none; padding: 8px 16px; border-radius: 2px; cursor: pointer; }
    </style>
</head>
<body>
    <h2>⚡ TestPilot: Generated Test Preview</h2>
    <p>Target: <strong>${testData.functionName || 'Selected Function'}</strong></p>
    <pre><code>${testData.testCode || '// No test code to preview'}</code></pre>
    <button class="btn">Accept and Commit Test</button>
</body>
</html>`;
    }
}

module.exports = { TestPreviewPanel };
