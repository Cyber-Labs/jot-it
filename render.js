const getWebViewContent = ()=>{
    return new Promise((resolve)=>{
        resolve(`
        <html>
        <head><title>JotIt</title>
        </head>
        <body>
        ${parait()}
        </body>
        </html>
    `);
    });
}

const parait = ()=>{
    return '<p>Hello</p>';
}
module.exports = getWebViewContent;