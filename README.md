# CodeReflect

<img src="/api/placeholder/600/120" alt="CodeReflect Banner" />

## Real-Time Code Comparison Tool for Programming Instructors

[![VS Code Marketplace Version](https://img.shields.io/badge/vscode--marketplace-v0.1.0-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

CodeReflect is a VS Code extension designed to help programming instructors during live coding lectures. It enables real-time comparison between reference code and the code being typed, highlighting discrepancies immediately to improve the teaching experience and student comprehension.

---

## 🚀 Features

- **Real-Time Comparison**: Instantly compare reference code with the code you're typing during lectures
- **Character-Level Precision**: Highlights start from the exact character where differences begin
- **Flexible Setup**: Works across two VS Code windows, ideal for dual-monitor teaching setups
- **Customizable**: Adjust highlight colors and comparison behavior to suit your needs
- **Lightweight**: Minimal performance impact on VS Code

<img src="/api/placeholder/800/400" alt="CodeReflect in action" />

---

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Technical Details](#technical-details)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## 💻 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions view by clicking the square icon on the sidebar or pressing `Ctrl+Shift+X`
3. Search for "CodeReflect"
4. Click "Install"

### Manual Installation

1. Download the `.vsix` file from the [latest release](https://github.com/yourusername/codereflect/releases)
2. Open VS Code
3. Go to Extensions view 
4. Click the "..." menu in the top-right corner of the Extensions view
5. Select "Install from VSIX..."
6. Choose the downloaded file

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/codereflect.git

# Navigate to the project directory
cd codereflect

# Install dependencies
npm install

# Package the extension
npm run package
```

---

## 🔍 Usage

### Basic Usage

1. **Setup Your Environment**:
   - Open two VS Code windows
   - In the first window, open your reference code (the correct version)
   - In the second window, open an empty file where you'll type the code

2. **Start the Receiver** (in the reference code window):
   - Open the Command Palette with `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "CodeReflect: Start Receiver" and select it
   - You'll see a notification that the receiver has started on port 3030

3. **Start the Sender** (in the window where you'll type):
   - Open the Command Palette
   - Type "CodeReflect: Start Sender" and select it
   - Enter the receiver address when prompted (usually `localhost:3030`)
   - A confirmation message will appear when connected

4. **Start Coding**:
   - As you type in the sender window, any differences from the reference code will be highlighted in the receiver window
   - The highlights appear at the precise character where differences begin

5. **Stopping the Connection**:
   - When finished, use "CodeReflect: Stop Receiver" and "CodeReflect: Stop Sender" commands

### Teaching Workflow Example

1. **Prepare Before Class**:
   - Create a directory with all your reference code files
   - Have a separate directory for your live coding

2. **During the Lecture**:
   - Display the reference window on a secondary screen visible to students
   - Keep your typing window on your primary screen
   - Explain concepts as you type, with instant visual feedback when you make a mistake
   - Students can see both your typed code and where it differs from the expected result

<img src="/api/placeholder/800/400" alt="Teaching Setup Example" />

---

## 🔧 Technical Details

### How It Works

CodeReflect uses a TCP connection between two VS Code instances:

1. **Receiver Mode**:
   - Creates a server using Node.js's `net` module
   - Listens for incoming code from the sender
   - Compares received code with reference code
   - Highlights differences using VS Code's decoration API

2. **Sender Mode**:
   - Connects to the receiver's TCP server
   - Monitors text changes in the active editor
   - Sends the current document content to the receiver when changes occur
   - Uses debouncing (500ms delay) to prevent overwhelming the connection

3. **Comparison Algorithm**:
   - Splits both reference and typed code into lines
   - For each line, finds the exact character where differences begin
   - Creates precise decorations that highlight only from the differing character
   - Handles special cases like lines of different lengths or extra lines

### Architecture

```
┌───────────────────┐                 ┌────────────────────┐
│                   │                 │                    │
│  Sender Window    │   TCP/3030      │  Receiver Window   │
│  (Typing Code)    │ ─────────────► │  (Reference Code)  │
│                   │                 │                    │
└───────────────────┘                 └────────────────────┘
          │                                     │
          │                                     │
          ▼                                     ▼
┌───────────────────┐                 ┌────────────────────┐
│  onDidChangeText  │                 │  compareAndHighl.  │
│  (Debounced 500ms)│                 │  (Char-by-char)    │
└───────────────────┘                 └────────────────────┘
```

---

## ⚙️ Configuration

CodeReflect can be customized through VS Code settings:

### Extension Settings

* `codereflect.highlightColor`: Change the background color of highlighted differences (default: `"rgba(255, 0, 0, 0.3)"`)
* `codereflect.debounceDelay`: Adjust the typing delay before sending code (default: `500` ms)
* `codereflect.defaultPort`: Set the default port for the receiver (default: `3030`)

```json
// Example settings.json configuration
{
  "codereflect.highlightColor": "rgba(255, 165, 0, 0.4)",
  "codereflect.debounceDelay": 300,
  "codereflect.defaultPort": 4040
}
```

### Keyboard Shortcuts

You can add custom keyboard shortcuts for CodeReflect commands:

```json
// keybindings.json
[
  {
    "key": "ctrl+alt+r",
    "command": "codereflect.startReceiver"
  },
  {
    "key": "ctrl+alt+s",
    "command": "codereflect.startSender"
  },
  {
    "key": "ctrl+alt+x",
    "command": "codereflect.stopReceiver"
  },
  {
    "key": "ctrl+alt+z",
    "command": "codereflect.stopSender"
  }
]
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help improve CodeReflect:

1. **Report Issues**: Found a bug or have a feature request? [Open an issue](https://github.com/yourusername/codereflect/issues).

2. **Submit PRs**: Want to contribute code? Fork the repository and submit a pull request.

3. **Development Setup**:
   ```bash
   # Clone your fork
   git clone https://github.com/yourusername/codereflect.git
   
   # Install dependencies
   npm install
   
   # Start development mode (watches for changes)
   npm run watch
   
   # Launch extension in debug mode with F5
   ```

4. **Coding Standards**:
   - Follow the existing code style
   - Add JSDoc comments for new functions
   - Include tests for new features
   - Update documentation as needed

---

## ❓ Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| **Connection fails** | Ensure no firewall is blocking port 3030 (or your custom port). Try a different port. |
| **No highlights appear** | Check that you started the receiver before the sender. Verify both files have the correct content. |
| **Incorrect highlighting** | Line endings might be different. Try saving both files with the same line endings (LF or CRLF). |
| **Extension doesn't activate** | Make sure VS Code version is 1.60.0 or newer. Try reloading the window. |
| **Performance issues** | Increase the debounce delay if comparison becomes slow with large files. |

### Logs and Diagnostics

To view debug logs:
1. Open the VS Code Command Palette
2. Type and select "Developer: Open Web Inspector"
3. Check the console for CodeReflect log messages

---

## 🛣️ Roadmap

Future plans for CodeReflect include:

- **Multi-file support**: Compare entire directories of files
- **Student mode**: Allow students to connect to the instructor's reference
- **Statistics view**: Show percentage of matching code and common error patterns
- **Diff view integration**: Enhanced visualization of differences
- **Remote teaching**: Support for remote connections (beyond localhost)
- **Language-specific highlighting**: Special rules for different programming languages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgements

CodeReflect was inspired by the challenges faced by programming instructors during live coding sessions. Special thanks to:

- All the programming educators who provided feedback
- The VS Code extension development community
- Contributors who helped improve this tool

---

*Made with ❤️ for coding instructors and their students*