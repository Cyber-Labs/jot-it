const vscode = require('vscode');
const fs = require('fs').promises;
const { getWebViewContent } = require('./webview/render');

/**
 * Loads all the keywords with fileid from index.json file.
 * @param {string} filepath
 */
const loadKeywords = (filepath) => {
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
};

/**
 * Provides a prmoise which resolves when both keyword and text is added saved in file.
 * It first checks whether keyword exists or not.
 * @param {string} filepath
 * @param {string} keyword
 * @param {string} text
 */
const addKeyword = (filepath, keyword, context) => {
    return new Promise((res) => {
        let nfilepath =
            filepath.replace('undefined_publisher.jotit', '') + '\\jotit';
        let fileid = generateId(keyword);
        loadKeywords(filepath).then((data) => {
            let exp = new RegExp(`"l":"${keyword}"`);
            if (exp.test(JSON.stringify(data))) {
                vscode.window.showErrorMessage('This keyword already exists!');
            } else {
                const panel = vscode.window.createWebviewPanel(
                    'jotit.add',
                    'Adds Notes',
                    vscode.ViewColumn.One,
                    { enableScripts: true }
                );
                panel.onDidDispose(() => {
                    panel.dispose();
                });
                getWebViewContent(context).then((file) => {
                    panel.webview.html = file;
                });
                // fs.writeFile(`${nfilepath}\\${fileid}`, text, 'utf-8').then(
                //     () => {
                //         data.push({ l: keyword, i: fileid });
                //         let s = JSON.stringify(data);
                //         fs.writeFile(
                //             `${nfilepath}\\index.json`,
                //             s,
                //             'utf-8'
                //         ).then((err) => {
                //             if (err && err.code === 'ENOENT') {
                //             } else {
                //                 res();
                //             }
                //         });
                //     }
                // );
            }
        });
    });
};

/**
 * It generates unique fileid from keyword and using Date.
 * @param {string} keyword
 */
const generateId = (keyword) => {
    return keyword.toString() + new Date().getTime().toString();
};

/**
 * This function takes the image url and creates base64 encoded image
 * @param {string} imageUri
 */
const validateImage = (imageUri) => {
    return new Promise((resolve, reject) => {
        fs.readFile(imageUri)
            .then((imageData) => {
                const bitmap = Buffer.from(imageData);
                resolve(bitmap.toString('base64'));
            })
            .catch((err) => {
                console.log(err);
                reject();
            });
    });
};

const addNote = (context, filedata) => {
    return new Promise(() => {
        console.log(filedata);
        return;
    });
};
module.exports = {
    loadKeywords,
    addKeyword,
    generateId,
    validateImage,
    addNote,
};
