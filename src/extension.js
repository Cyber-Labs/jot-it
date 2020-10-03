const vscode = require('vscode');
const {
    validateImage,
    addNote,
    loadTitles,
    loadAllTags,
    loadTitlesFromTag,
    deleteNote,
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
                if (item && !item[0].description) {
                    loadTitlesFromTag(
                        context.globalStoragePath,
                        item[0].label
                    ).then((data) => {
                        let quickpick2 = vscode.window.createQuickPick();
                        quickpick2.items = data.map((el) => {
                            return { label: el };
                        });
                        quickpick2.show();
                        quickpick2.onDidChangeSelection(async (item) => {
                            console.log(item);
                            if (item) {
                                quickpick2.hide();
                                quickpick2.dispose();
                                let panel = vscode.window.createWebviewPanel(
                                    'jotit.search',
                                    'Jotit',
                                    vscode.ViewColumn.One,
                                    { enableScripts: true }
                                );
                                panel.onDidDispose(() => panel.dispose());
                                panel.webview.html = await renderSearch(
                                    context.globalStoragePath,
                                    item[0]
                                );
                                panel.webview.onDidReceiveMessage((msg) => {
                                    if (msg.type == 'delete') {
                                        panel.dispose();
                                    }
                                });
                            }
                        });
                    });
                } else if (item) {
                    quickpick.hide();
                    quickpick.dispose();
                    let panel = vscode.window.createWebviewPanel(
                        'jotit.search',
                        'Jotit',
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );
                    panel.onDidDispose(() => panel.dispose());
                    panel.webview.html = await renderSearch(
                        context.globalStoragePath,
                        item[0]
                    );
                    panel.webview.onDidReceiveMessage((msg) => {
                        if (msg.type == 'delete') {
                            panel.dispose();
                            deleteNote(
                                context.globalStoragePath,
                                msg.message.title
                            )
                                .then(() => {
                                    console.log('Deleted');
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                        }
                    });
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
                            tags,
                        };
                        addNote(context.globalStoragePath, fileData)
                            .then(() => formPanel.dispose())
                            .catch((err) => {
                                console.log(err);
                            });
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
