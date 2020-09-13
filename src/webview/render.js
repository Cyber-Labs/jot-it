const vscode = require('vscode');
const fs = require('fs').promises;
const loadData = require('../FileUtils').loadData;

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

const renderSearch = (filepath, item) => {
    return new Promise(async (resolve) => {
        if (item.description) {
            let html = await card(filepath, item.label);
            resolve(header() + html + footer());
        }
    });
};

const card = (filepath, title) => {
    return new Promise((resolve) => {
        loadData(filepath, title).then((data) => {
            let img = '';
            let tags = '';
            if (data.imageData) {
                img = `<img src='${data.imageData}>'`;
            }
            for (let i in data.tags) {
                tags =
                    tags + `<span class ="tag">${purge(data.tags[i])}</span>`;
            }
            let html = `
            <div class="card">
                ${img}
                <div>
                    <h1>${title}</h1>
                    ${tags}
                    <div class="notes">
                        ${purge(data.text)}
                    </div>
                </div>
            </div>
            `;
            resolve(html);
        });
    });
};
const header = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>JoTIt</title>
        </head>
        <body>
            <div class= 'container'>
    `;
};
const footer = () => {
    return `
    </div>
    </body>
    </html>
    `;
};

const purge = (text) => {
    text.replace(/\>/g, '&gt;');
    text.replace(/\</g, '&lt;');
    text.replace(/\&/g, '&amp;');
    text.replace(/\"/g, '&quot;');
    return text;
};
module.exports = { getWebViewContent, renderSearch };
