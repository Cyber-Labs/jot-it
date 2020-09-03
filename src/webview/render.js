const vscode = require('vscode');
const fs = require('fs').promises;

const getWebViewContent = (context, name, data) => {
    return new Promise((resolve) => {
        if (name === 'form') {
            resolve(renderForm(context));
        }
    });
};

const renderForm = (context) => {
    return new Promise((resolve) => {
        fs.readFile(
            vscode.Uri.joinPath(
                context.extensionUri,
                'src',
                'webview',
                'index.html'
            ).path.replace(/^\//, '')
        ).then((htmlFile) => resolve(htmlFile.toString()));
    });
};

module.exports = { getWebViewContent };
