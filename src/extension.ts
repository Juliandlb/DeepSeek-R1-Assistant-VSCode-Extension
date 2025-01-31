import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('deepseekr1-ext.start', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepseekr1-ext',
			'DeepSeek R1 Chat Extension',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		)

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = ''

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:latest',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					})

					for await (const part of streamResponse){
						responseText += part.message.content
						panel.webview.postMessage({ command: 'chatResponse', text: responseText })
					}
				} catch (error) {
					panel.webview.postMessage({ command: 'chatResponse', text: 'An error occurred' })
				}
			}
		});

	});

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return /* html */ `	
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<style> 
			body { font-family: sans-serif; margin: 1rem; }
			#prompt { width: 100%; boxsizising: border-box}
			#response { border: 1px solid #ccc; margin-top: 1rem;padding: 0.5rem; }
		</style>
	</head>
	<body>
		<h2>DeepSeek R1 Chat Extension</h2>
		<textarea id="prompt" rows="3" placeholder="Type a message"></textarea><br />
		<button id="askBtn">Ask</button>
		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				vscode.postMessage({ command: 'chat', text });
			});
			
			window.addEventListener('message', event => {
				const {command, text} = event.data;
				if (command === 'chatResponse') {
					document.getElementById('response').innerText = text;
				}
			});
		</script>

	</body>
	</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
