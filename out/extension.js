"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ollama_1 = __importDefault(require("ollama"));
// This method is called when your extension is activated
function activate(context) {
    // Define the model to be used
    const chosenModel = 'deepseek-r1:1.5b';
    // Register the command that starts the extension
    const disposable = vscode.commands.registerCommand('deepseekr1-ext.start', () => {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel('deepseekr1-ext', 'DeepSeek R1 Chat Extension', vscode.ViewColumn.One, { enableScripts: true });
        // Set the HTML content for the webview
        panel.webview.html = getWebviewContent();
        // Type guard to check if the error is a ResponseError
        function isResponseError(error) {
            return typeof error === 'object' && 'status_code' in error && 'message' in error;
        }
        // Handle messages received from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'chat') {
                const userPrompt = message.text;
                let responseText = '';
                try {
                    // Send the user prompt to the chat model and stream the response
                    const streamResponse = await ollama_1.default.chat({
                        model: chosenModel,
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true
                    });
                    // Concatenate the streamed response parts
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'chatResponse', text: responseText });
                    }
                }
                catch (error) {
                    // Handle specific error when the model is not found
                    if (isResponseError(error) && error.status_code === 404 && error.message.includes(`model "${chosenModel}" not found`)) {
                        responseText = `Model "${chosenModel}" not found. Please ensure the model is available and try again.`;
                    }
                    else {
                        responseText = 'An error occurred';
                    }
                    console.error('Error during chat:', error);
                    panel.webview.postMessage({ command: 'chatResponse', text: responseText });
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
function deactivate() { }
//# sourceMappingURL=extension.js.map