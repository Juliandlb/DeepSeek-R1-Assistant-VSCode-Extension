import * as vscode from 'vscode';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('"deepseekr1-ext" is now active!');

	const disposable = vscode.commands.registerCommand('deepseekr1-ext.chat', () => {
		vscode.window.showInformationMessage('Now you can chat with DeepSeekR1-ext!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
