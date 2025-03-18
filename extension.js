// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "codereflect" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('codereflect.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from CodeReflect!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
let server;
vscode.commands.registerCommand('extension.StartReciever', () =>{
	const net = require("net");
	server = net.createServer((socket) => {
		socket.on("data", (data) => {
			compareAndHighlight(data.toString());
		});
	});

	server.listen(3030, "localhost");
	vscode.window.showInformationMessage("Reciever started on port 3030");
})

vscode.commands.registerCommand('extension.stopReceiver', () => {
    if (server) {
        server.close();
        vscode.window.showInformationMessage('Receiver stopped');
    }
});

let client;

vscode.commands.registerCommand('extension.startSender', async () => {
	const address = await vscode.window.showInputBox({prompt: "Enter reciever address (e.g., localhost:3030)"});
	const [host, port] = address.split(':');;
	const net = require("net")
	client = net.connect('net');
	clinet = net.connect(port,host, () =>{
		vscode.window.showInformationMessage("Connected to reciever");
	});
});

let timeout;
vscode.workspace.onDidChangeTextDocument((event) => {
    if (!client) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const text = event.document.getText();
        client.write(text);
    }, 500); // Wait 500ms before sending (debouncing)
});

vscode.commands.registerCommand('extension.stopSender', () => {
    if (client) {
        client.end();
        vscode.window.showInformationMessage('Sender stopped');
    }
});

function compareAndHighlight(typedCode){
	const editor = vscode.window.activeTextEditor;
	if(!editor) return;

	const referecneCode =  editor.document.getText();
	const refLines =  referecneCode.split("\n");
	const typedLines = typedCode.split('\n');
	const decorations = [];

	for(let i = 0; i < refLines.length; i++){
		if(refLines[i] !== typedLines[i]){
			decorations.push({
				range: new vscode.Range(i, 0, refLines[i].length),
			});
		}
	}

	const decorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255, 0, 0, 0.3)'
	})

	editor.setDecorations(decorationType, decorations);

}


module.exports = {
	activate,
	deactivate
}
