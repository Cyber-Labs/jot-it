const vscode = require('vscode');
const fs = require('fs').promises;
const path = require('path');
const { loadData, loadImage } = require('../FileUtils');

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
            path.join(context.extensionPath, 'src', 'webview', 'index.html')
        )
            .then((htmlFile) => resolve(htmlFile.toString()))
            .catch((err) => {
                console.log(err);
            });
    });
};

const renderSearch = (filepath, item) => {
    return new Promise(async (resolve) => {
        if (item) {
            let html = await card(filepath, item.label);
            resolve(header(item) + html + footer());
        }
    });
};

const card = (filepath, title) => {
    return new Promise((resolve) => {
        loadData(filepath, title).then(async (data) => {
            let img = '';
            let tags = '';
            console.log(data.imageData);
            if (data.imageData) {
                let imageContent = await loadImage(filepath, data.imageData);
                img = `<img src="${imageContent}" >`;
            }
            for (let i in data.tags) {
                tags =
                    tags + `<span class ="tag">${purge(data.tags[i])}</span>`;
            }
            let links = '';
            for (let i in data.links) {
                links =
                    links +
                    `🔗<a href="${data.links[i]}" class ="links">${data.links[i]}</a><br>`;
            }
            let html = `
            <div class="card">
            ${img}
            <div class = "text">
            <h1 id= "title">${title}</h1>
            <div style="display: flex">
            ${tags}
            <button onclick= "deleteIt()" id="delete">Delete</button>
            </div>
            <br>
            <div id = "linkContainer">${links}</div>
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
const header = (item) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>JoTIt</title>
            ${style()}
        </head>
        <body>
        <script>
            const vscode = acquireVsCodeApi();
            function deleteIt(){
                let message = {title: "${item.label}"}
                vscode.postMessage({ type: 'delete', message: message });
            }
        </script>
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

const style = () => {
    return `
        <style>
            .container{
                display: flex;
                width: 95%;
                margin: auto;
                margin-top: 50px;
            }
            .card{
                display: flex;
            }
            .notes{
                margin: 15px;
            }
            img{
                width: 40%;
                height: 60%;
                align: right;
                margin: 40px;
            }
            .text{
                width: 100%;
                margin: 60px;
            }
            .tag{
                margin: 20px;
                padding: 5px;
            }
            .tag {
                background: var(--vscode-input-background);
            }
            #delete{
                float: right;
                width: 100px;
                height: 35px;
                margin: 20px;
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
            }
            #title{
                margin: 8px;
                margin-bottom: 15px;
                font-size: 3rem;
            }
            #linkContainer{
                margin-top: 15px;
            }
        </style>
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
