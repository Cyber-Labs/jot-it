// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs').promises;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // The command has been defined in the package.json file
    // The implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let search = vscode.commands.registerCommand('jotit.search', function () {
        loadKeywords(context.globalStoragePath).then((data) => {
            let quickpick = vscode.window.createQuickPick();
            quickpick.items = data.map((x) => ({
                label: x.l,
                k: x.i,
            }));
            quickpick.onDidChangeSelection((item) => {
                if (item) {
                    showItem(context.globalStoragePath, item[0]);
                }
            });
            quickpick.show();
        });
    });

    let addnew = vscode.commands.registerCommand('jotit.add', function () {
        vscode.window
            .showInputBox({
                placeHolder: 'Your keyword',
                validateInput: validateK,
            })
            .then((data) => {
                if (!data || data.length === 0) {
                    return;
                }
                vscode.window
                    .showInputBox({
                        placeHolder: 'Related Text',
                        validateInput: (a) => {
                            if (!a) {
                                return 'Required ...';
                            }
                            a = a.trim();
                            if (a.length === 0) {
                                return 'Required ...';
                            }
                        },
                    })
                    .then((data1) => {
                        // console.log(data, data1);
                        if (!data || !data1) {
                            return;
                        }
                        addKeyword(
                            context.globalStoragePath,
                            data.trim(),
                            data1
                        );
                    });
            });
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
 * Loads all the keywords with fileid from index.json file.
 * @param {string} filepath
 */
function loadKeywords(filepath) {
    return new Promise((res) => {
        filepath =
            filepath.replace('undefined_publisher.jotit', '') +
            '\\jotit\\index.json';
        fs.readFile(filepath, 'utf-8')
            .then((data) => {
                res(JSON.parse(data));
            })
            .catch((err) => {
                if (err.code == 'ENOENT') {
                    res([]);
                }
            });
    });
}

/**
 * Provides a prmoise which resolves when both keyword and text is added saved in file.
 * It first checks whether keyword exists or not.
 * @param {string} filepath
 * @param {string} keyword
 * @param {string} text
 */
function addKeyword(filepath, keyword, text) {
    return new Promise((res) => {
        let nfilepath =
            filepath.replace('undefined_publisher.jotit', '') + '\\jotit';
        let fileid = generateId(keyword);
        loadKeywords(filepath).then((data) => {
            let exp = new RegExp(`"l":"${keyword}"`);
            if (exp.test(JSON.stringify(data))) {
                vscode.window.showErrorMessage('This keyword already exists!');
            } else {
                fs.writeFile(`${nfilepath}\\${fileid}`, text, 'utf-8').then(
                    () => {
                        data.push({ l: keyword, i: fileid });
                        let s = JSON.stringify(data);
                        fs.writeFile(
                            `${nfilepath}\\index.json`,
                            s,
                            'utf-8'
                        ).then((err) => {
                            if (err && err.code === 'ENOENT') {
                            } else {
                                res();
                            }
                        });
                    }
                );
            }
        });
    });
}

/**
 * It generates unique fileid from keyword and using Date.
 * @param {string} keyword
 */
function generateId(keyword) {
    return keyword.toString() + new Date().getTime().toString();
}

function showItem(filepath, item) {
    if (typeof item === 'undefined') {
        return;
    }
    filepath = filepath.replace('undefined_publisher.jotit', '') + '\\jotit';
    // console.log(filepath + '\\' + item.k);
    fs.readFile(filepath + '\\' + item.k)
        .then((data) => {
            data = data.toString();
            vscode.window.showInformationMessage(data);
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
