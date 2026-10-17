/**
 * ResultsSidebarProvider: VS Code Sidebar View for live test results
 */
class ResultsSidebarProvider {
    static viewType = 'testpilot.resultsView';

    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._results = null;
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._getHtmlForWebview();
    }

    updateResults(results) {
        this._results = results;
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview();
        }
    }

    _getHtmlForWebview() {
        const results = this._results || { testsGenerated: [] };
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px; }
        .pass { color: #4ec9b0; font-weight: bold; }
        .item { border-left: 3px solid #007acc; padding-left: 8px; margin-bottom: 12px; }
    </style>
</head>
<body>
    <h3>TestPilot Execution Results</h3>
    ${results.testsGenerated.length === 0 ? '<p>No active tests executed. Click "Generate Tests" to start.</p>' : ''}
    ${results.testsGenerated.map(t => `
        <div class="item">
            <div><strong>${t.functionName}</strong></div>
            <div class="pass">✔ Ready for Jest Execution</div>
            <div><small>${t.testPath || ''}</small></div>
        </div>
    `).join('')}
</body>
</html>`;
    }
}

module.exports = { ResultsSidebarProvider };
