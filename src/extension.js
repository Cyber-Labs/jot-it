const vscode = require('vscode');
const fs = require('fs').promises;
const {
    loadKeywords,
    addKeyword,
    validateImage,
    addNote,
} = require('./FileUtils');
const { getWebViewContent } = require('./webview/render');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // The command has been defined in the package.json file
    // The implementation of the command with  registerCommand
    // The commandId parameter matches the command field in package.json
    let search = vscode.commands.registerCommand('jotit.search', function () {
        // getWebViewContent(context).then((file) => console.log(file));
        loadKeywords(context.globalStoragePath).then((data) => {
            let quickpick = vscode.window.createQuickPick();
            quickpick.items = data.map((x) => ({
                label: x.l,
                k: x.i,
            }));
            quickpick.onDidChangeSelection((item) => {
                if (item) {
                    quickpick.hide();
                    quickpick.dispose();
                    // showItem(context.globalStoragePath, item[0]);
                }
            });
            quickpick.show();
        });
    });
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
                const { keyword, imageUri, text } = msg.message;
                validateImage(imageUri)
                    .then((imageData) => {
                        const fileData = {
                            keyword,
                            imageData,
                            text,
                        };
                        addNote(context, fileData).then(() =>
                            formPanel.dispose()
                        );
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        });
        // vscode.window
        //     .showInputBox({
        //         placeHolder: 'Related Text',
        //         validateInput: (a) => {
        //             if (!a) {
        //                 return 'Required ...';
        //             }
        //             a = a.trim();
        //             if (a.length === 0) {
        //                 return 'Required ...';
        //             }
        //         },
        //     })
        //     .then((data1) => {
        //         // console.log(data, data1);
        //         if (!data || !data1) {
        //             return;
        //         }
        // addKeyword(context.globalStoragePath, data.trim(), context);
        //     });
        // });
    });

    context.subscriptions.push(addnew);
    context.subscriptions.push(search);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

/**
 * Validates the keyword given by user and checks whether it it null or not.
 * @param {string} a
 */
function validateK(a) {
    if (!a) {
        return 'Required ...';
    }
    a = a.trim();
    if (a.length == 0) {
        return 'Required ...';
    }
    if (a.length >= 20) {
        return 'Cannot have more than 15 characters';
    }
}

/**
 * It generates unique fileid from keyword and using Date.
 * @param {string} keyword
 */
// function generateId(keyword) {
//     return keyword.toString() + new Date().getTime().toString();
// }

function showItem(filepath, item) {
    if (typeof item === 'undefined') {
        return;
    }
    filepath = filepath.replace('undefined_publisher.jotit', '') + '\\jotit';
    // console.log(filepath + '\\' + item.k);
    fs.readFile(filepath + '\\' + item.k)
        .then((data) => {
            data = data.toString();
            vscode.window.showInformationMessage(data, 'Show');
        })
        .catch((err) => {
            if (err && err.code === 'ENOENT') {
            }
        });
}
module.exports = {
    activate,
    deactivate,
};
