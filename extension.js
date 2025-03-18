const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "codereflect" is now active!');

	// Hello World command
	const helloWorldCommand = vscode.commands.registerCommand('codereflect.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from CodeReflect!');
	});
	context.subscriptions.push(helloWorldCommand);

	// Server for receiver mode
	let server;

	// Client for sender mode
	let client;

	// Decoration type for highlighting mismatches
	const decorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255, 0, 0, 0.3)',
		isWholeLine: false  // Highlight the entire line for better visibility
	});

	// Start Receiver command
	const startReceiverCommand = vscode.commands.registerCommand('codereflect.startReceiver', () => {
		const net = require("net");
		server = net.createServer((socket) => {
			socket.on("data", (data) => {
				compareAndHighlight(data.toString(), decorationType);
			});
		});
		server.listen(3030, "localhost", () => {
			vscode.window.showInformationMessage("Receiver started on port 3030");
		});
	});
	context.subscriptions.push(startReceiverCommand);

	// Stop Receiver command
	const stopReceiverCommand = vscode.commands.registerCommand('codereflect.stopReceiver', () => {
		if (server) {
			server.close();
			vscode.window.showInformationMessage('Receiver stopped');
			server = null;
		} else {
			vscode.window.showInformationMessage('No active receiver to stop');
		}
	});
	context.subscriptions.push(stopReceiverCommand);

	// Start Sender command
	const startSenderCommand = vscode.commands.registerCommand('codereflect.startSender', async () => {
		const address = await vscode.window.showInputBox({
			prompt: "Enter receiver address (e.g., localhost:3030)",
			placeHolder: "localhost:3030"
		});

		if (!address) return; // User cancelled input

		const [host, port] = address.split(':');
		const net = require("net");

		try {
			client = net.connect(parseInt(port), host, () => {
				vscode.window.showInformationMessage(`Connected to receiver at ${host}:${port}`);
			});

			client.on('error', (err) => {
				vscode.window.showErrorMessage(`Connection error: ${err.message}`);
				client = null;
			});

			client.on('close', () => {
				vscode.window.showInformationMessage('Connection to receiver closed');
				client = null;
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
		}
	});
	context.subscriptions.push(startSenderCommand);

	// Stop Sender command
	const stopSenderCommand = vscode.commands.registerCommand('codereflect.stopSender', () => {
		if (client) {
			client.end();
			vscode.window.showInformationMessage('Sender stopped');
			client = null;
		} else {
			vscode.window.showInformationMessage('No active sender to stop');
		}
	});
	context.subscriptions.push(stopSenderCommand);

	// Debounce timeout
	let timeout;

	// Listen for text changes to send to receiver
	const textChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
		if (!client) return;

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			const text = event.document.getText();
			try {
				// Add a special delimiter to ensure complete transmission
				client.write(text);
				console.log(`Sent ${text.split(/\r?\n/).length} lines to receiver`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to send code: ${error.message}`);
			}
		}, 500); // Wait 500ms before sending (debouncing)
	});
	context.subscriptions.push(textChangeListener);
}

/**
 * Compare typed code with reference code and highlight differences
 * @param {string} typedCode 
 * @param {vscode.TextEditorDecorationType} decorationType
 */
function compareAndHighlight(typedCode, decorationType) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	// Normalize line endings
	const referenceCode = editor.document.getText();
	const refLines = referenceCode.split(/\r?\n/);
	const typedLines = typedCode.split(/\r?\n/);

	console.log(`Comparing: Ref lines: ${refLines.length}, Typed lines: ${typedLines.length}`);

	// Clear previous decorations
	editor.setDecorations(decorationType, []);

	const decorations = [];
	const maxLines = Math.max(refLines.length, typedLines.length);

	for (let i = 0; i < maxLines; i++) {
		// Skip if beyond document bounds
		if (i >= editor.document.lineCount) continue;

		// Get lines or empty string if past the end of either file
		const refLine = i < refLines.length ? refLines[i] : '';
		const typedLine = i < typedLines.length ? typedLines[i] : '';

		// Find where they differ
		const minLength = Math.min(refLine.length, typedLine.length);
		let diffIndex = 0;

		// Find first differing character
		while (diffIndex < minLength && refLine[diffIndex] === typedLine[diffIndex]) {
			diffIndex++;
		}

		// Decide if we need to highlight
		const lineDiffers = diffIndex < minLength || refLine.length !== typedLine.length;

		if (lineDiffers) {
			// Create a range from the differing character to the end of line
			const startPosition = new vscode.Position(i, diffIndex);
			const endPosition = new vscode.Position(i, refLine.length);

			decorations.push({
				range: new vscode.Range(startPosition, endPosition)
			});

			console.log(`Line ${i + 1}: Difference starts at character ${diffIndex + 1}`);
		}
	}

	editor.setDecorations(decorationType, decorations);
}

/**
 * This method is called when your extension is deactivated
 */
function deactivate() {
	// Clean up resources
}

module.exports = {
	activate,
	deactivate
}