const vscode = require('vscode');
const net = require("net");
const os = require("os");

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

	// Helper function to get local IP addresses
	function getLocalIpAddresses() {
		const interfaces = os.networkInterfaces();
		const addresses = [];
		
		for (const interfaceName in interfaces) {
			for (const iface of interfaces[interfaceName]) {
				// Skip over non-IPv4 and internal (loopback) addresses
				if (iface.family === 'IPv4' && !iface.internal) {
					addresses.push(iface.address);
				}
			}
		}
		
		return addresses;
	}

	// Start Receiver command
	const startReceiverCommand = vscode.commands.registerCommand('codereflect.startReceiver', async () => {
		const port = await vscode.window.showInputBox({
			prompt: "Enter port to listen on",
			placeHolder: "3030",
			value: "3030"
		});

		if (!port) return; // User cancelled input

		server = net.createServer((socket) => {
			// Show connection info when a client connects
			vscode.window.showInformationMessage(`Client connected from ${socket.remoteAddress}:${socket.remotePort}`);
			
			socket.on("data", (data) => {
				compareAndHighlight(data.toString(), decorationType);
			});
			
			socket.on("close", () => {
				vscode.window.showInformationMessage(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
			});
			
			socket.on("error", (err) => {
				vscode.window.showErrorMessage(`Socket error: ${err.message}`);
			});
		});
		
		try {
			// Listen on all network interfaces (0.0.0.0) instead of just localhost
			server.listen(parseInt(port), "0.0.0.0", () => {
				const ipAddresses = getLocalIpAddresses();
				
				// Display all available IP addresses to connect to
				if (ipAddresses.length > 0) {
					const addressList = ipAddresses.map(ip => `${ip}:${port}`).join(', ');
					vscode.window.showInformationMessage(
						`Receiver started. Your network addresses: ${addressList}`
					);
				} else {
					vscode.window.showInformationMessage(`Receiver started on port ${port}, but no network interfaces detected`);
				}
			});
			
			server.on("error", (err) => {
				vscode.window.showErrorMessage(`Server error: ${err.message}`);
				server = null;
			});
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to start receiver: ${error.message}`);
		}
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
			prompt: "Enter receiver address (e.g., 192.168.1.5:3030)",
			placeHolder: "192.168.1.5:3030"
		});

		if (!address) return; // User cancelled input

		const [host, port] = address.split(':');
		
		if (!host || !port) {
			vscode.window.showErrorMessage('Invalid address format. Use format: host:port');
			return;
		}

		try {
			client = net.connect(parseInt(port), host, () => {
				vscode.window.showInformationMessage(`Connected to receiver at ${host}:${port}`);
				
				// Send the current document immediately after connecting
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					const text = editor.document.getText();
					client.write(text);
					console.log(`Sent initial document (${text.split(/\r?\n/).length} lines) to receiver`);
				}
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
				client.write(text);
				console.log(`Sent ${text.split(/\r?\n/).length} lines to receiver`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to send code: ${error.message}`);
				// Attempt to reconnect if the connection was lost
				if (client) {
					client.end();
					client = null;
				}
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
	if (client) {
		client.end();
		client = null;
	}
	
	if (server) {
		server.close();
		server = null;
	}
}

module.exports = {
	activate,
	deactivate
}