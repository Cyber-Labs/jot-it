// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const getWebViewContent = require('./render');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when extension is activated
	console.log('Congratulations, your extension "jotit" is now active!');

	let currentViewPanel = undefined;
	// The command has been defined in the package.json file
	// The implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('jotit.search', function () {

		// Display a message box to the user
		// vscode.window.showInformationMessage('Hello World from JotIt!');
		if(currentViewPanel){
			currentViewPanel.reveal();
		}else{
			currentViewPanel = vscode.window.createWebviewPanel('jotit','JotIt',vscode.ViewColumn.One,{});
			// currentViewPanel.webview.html = getWebViewContent();
			getWebViewContent().then((s)=>{
				currentViewPanel.webview.html = s;
			});
			currentViewPanel.onDidDispose(()=>{
				currentViewPanel = undefined; },
				null,
				context.subscriptions
			);
		}
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
