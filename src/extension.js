const vscode = require('vscode');
const {
    validateImage,
    addNote,
    loadTitles,
    loadAllTags,
} = require('./FileUtils');
const { getWebViewContent, renderSearch } = require('./webview/render');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // The command has been defined in the package.json file
    // The implementation of the command with  registerCommand
    // The commandId parameter matches the command field in package.json
    let search = vscode.commands.registerCommand(
        'jotit.search',
        async function () {
            const tags = await loadAllTags(context.globalStoragePath);
            const title = await loadTitles(context.globalStoragePath);
            let combined = [...tags, ...title];
            let items = combined.map((item) => {
                if (item.title) {
                    return { label: item.title, description: item.tags };
                } else {
                    return { label: item.tag };
                }
            });
            let quickpick = vscode.window.createQuickPick();
            quickpick.items = items;
            quickpick.onDidChangeSelection(async (item) => {
                if (item) {
                    quickpick.hide();
                    quickpick.dispose();
                    let panel = vscode.window.createWebviewPanel(
                        'jotit.search',
                        'Jotit',
                        vscode.ViewColumn.One
                    );
                    panel.onDidDispose(() => panel.dispose());
                    panel.webview.html = await renderSearch(
                        context.globalStoragePath,
                        item[0]
                    );
                }
            });
            quickpick.show();
        }
    );
    let addnew = vscode.commands.registerCommand('jotit.add', function () {
        const formPanel = vscode.window.createWebviewPanel(
            'Notes form',
            'Notes-Form',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        formPanel.onDidDispose(() => formPanel.dispose());
        getWebViewContent(context, 'form').then(
            (html) => (formPanel.webview.html = html)
        );
        formPanel.webview.onDidReceiveMessage((msg) => {
            if (msg.type === 'form') {
                const { keyword, imageUri, text, tags } = msg.message;
                validateImage(imageUri)
                    .then((imageData) => {
                        const fileData = {
                            title: keyword,
                            imageData,
                            text,
                            tags: ['demo', 'demo2'],
                        };
                        addNote(context.globalStoragePath, fileData).then(() =>
                            formPanel.dispose()
                        );
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        });
    });

    context.subscriptions.push(addnew);
    context.subscriptions.push(search);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
