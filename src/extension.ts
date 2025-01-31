import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	// Define the model to be used
	const chosenModel = 'deepseek-r1:1.5b';

	// Register the command that starts the extension
	const disposable = vscode.commands.registerCommand('deepseekr1-ext.start', () => {
		// Create and show a new webview panel
		const panel = vscode.window.createWebviewPanel(
			'deepseekr1-ext',
			'DeepSeek R1 Chat Extension',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		)

		// Set the HTML content for the webview
		panel.webview.html = getWebviewContent();

		// Type guard to check if the error is a ResponseError
		function isResponseError(error: any): error is { status_code: number; message: string } {
			return typeof error === 'object' && 'status_code' in error && 'message' in error;
		}

		// Handle messages received from the webview
		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = message.text;
				let responseText = ''

				try {
					// Send the user prompt to the chat model and stream the response
					const streamResponse = await ollama.chat({
						model: chosenModel,
						messages: [{ role: 'user', content: userPrompt }],
						stream: true
					})

					// Concatenate the streamed response parts
					for await (const part of streamResponse){
						responseText += part.message.content
						panel.webview.postMessage({ command: 'chatResponse', text: responseText })
					}
				} catch (error) {
					// Handle specific error when the model is not found
					if (isResponseError(error) && error.status_code === 404 && error.message.includes(`model "${chosenModel}" not found`)) {
						responseText = `Model "${chosenModel}" not found. Please ensure the model is available and try again.`;
					} else {
						responseText = 'An error occurred';
					}
					console.error('Error during chat:', error);
					panel.webview.postMessage({ command: 'chatResponse', text: responseText })
				}
			}
		});

	});

	// Add the command to the extension's subscriptions
	context.subscriptions.push(disposable);
}

// Function to get the HTML content for the webview
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

			// Send the user input to the extension when the button is clicked
			document.getElementById('askBtn').addEventListener('click', () => {
				const text = document.getElementById('prompt').value;
				vscode.postMessage({ command: 'chat', text });
			});
			
			// Handle messages received from the extension
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
