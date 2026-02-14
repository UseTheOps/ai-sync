# AI Sync

A Visual Studio Code extension for cloning and syncing GitHub Copilot configuration files from git repositories.

## Features

- **Clone Copilot Files**: Easily clone GitHub Copilot configuration files from any git repository
- **Smart File Detection**: Automatically detects copilot-related files and directories including:
  - `.github/copilot`, `copilot`, or `.copilot` directories
  - Specific copilot configuration files: `.copilotignore`, `copilot.yaml`, `copilot.yml`, `copilot.json`, `copilot-instructions.md`, `copilot.md`
- **Configurable Target Path**: Choose where to save the cloned files (default: `.github/copilot`)
- **Progress Indicators**: Visual feedback during the cloning process

## Usage

1. Open your workspace in VS Code
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
3. Type "AI Sync: Clone Copilot Files from Repository"
4. Enter the Git repository URL (e.g., `https://github.com/username/repository.git`)
5. Enter the target path where copilot files should be saved (default: `.github/copilot`)
6. Wait for the operation to complete

## Configuration

You can configure the default target path in VS Code settings:

```json
{
  "ai-sync.defaultTargetPath": ".github/copilot"
}
```

## Requirements

- VS Code 1.90.0 or higher
- Git installed on your system

## Installation

### From VSIX (Development)

1. Download the `.vsix` file
2. In VS Code, go to Extensions view
3. Click on "..." menu and select "Install from VSIX..."
4. Select the downloaded `.vsix` file

### Development

1. Clone this repository
2. Run `npm install` to install dependencies
3. Press `F5` to start debugging the extension

## Building

```bash
npm install
npm run compile
```

## License

MIT - See [LICENSE](LICENSE) file for details