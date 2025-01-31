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

		 // Function to remove <think> tags from the text
		// function removeThinkTags(text: string): string {
		// 	return text.replace(/<think>\s*<\/think>/g, '');
		// }

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
						// const cleanedResponse = removeThinkTags(responseText);
						// panel.webview.postMessage({ command: 'chatResponse', text: cleanedResponse })
						panel.webview.postMessage({ command: 'chatResponse', text: responseText })
					}
					// Clear the user prompt
					//panel.webview.postMessage({ command: 'clearPrompt' });
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
			body { font-family: 'Courier New', Courier, monospace; margin: 1rem; background-color: #1e1e1e; color: #d4d4d4; }
			.container { max-width: 800px; margin: 0 auto; padding: 1rem; border-radius: 8px; background-color: #252526; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
			h2 { color: #569cd6; }
			#prompt { font-family: 'Courier New', Courier, monospace; width: 100%; box-sizing: border-box; padding: 0.5rem; border: 1px solid #3c3c3c; border-radius: 4px; margin-bottom: 1rem; background-color: transparent; color: #d4d4d4; }
			#askBtn { font-family: 'Courier New', Courier, monospace; background-color: #007acc; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; transition: background-color 0.3s; }
			#askBtn:hover { background-color: #005fa3; }
			#response { font-family: 'Courier New', Courier, monospace; border: 1px solid #3c3c3c; margin-top: 1rem; padding: 0.5rem; border-radius: 4px; background-color: transparent; color: #d4d4d4; }
		</style>
	</head>
	<body>
		<div class="container">
			<h2>DeepSeek R1 Chat Extension</h2>
			<textarea id="prompt" rows="3" placeholder="Type a message"></textarea><br />
			<button id="askBtn">Ask</button>
			<div id="response"></div>
		</div>

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
				} else if (command === 'clearPrompt') {
					document.getElementById('prompt').value = '';
				}
			});
		</script>

	</body>
	</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
