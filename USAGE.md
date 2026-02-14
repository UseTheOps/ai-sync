# AI Sync - Usage Guide

This guide provides detailed instructions on how to use the AI Sync extension.

## Quick Start

1. **Install the Extension**
   - Download the `ai-sync-0.0.1.vsix` file
   - Open VS Code
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette
   - Type "Extensions: Install from VSIX"
   - Select the downloaded `.vsix` file

2. **Open Your Workspace**
   - Open the folder/workspace where you want to clone copilot files

3. **Run the Command**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "AI Sync: Clone Copilot Files from Repository"
   - Press Enter

4. **Enter Repository URL**
   - Enter the Git repository URL containing copilot files
   - Example: `https://github.com/username/copilot-config.git`

5. **Choose Target Path**
   - Enter the target path (default: `.github/copilot`)
   - The extension will create this directory if it doesn't exist

6. **Wait for Completion**
   - A progress notification will appear
   - Once complete, you'll see a success message with the number of files copied

## What Files Are Detected?

The extension looks for:

### Directories
- `.github/copilot/`
- `copilot/`
- `.copilot/`

### Specific Files
- `.copilotignore`
- `copilot.yaml`
- `copilot.yml`
- `copilot.json`
- `copilot-instructions.md`
- `copilot.md`

All files within copilot-related directories are copied, along with any specifically named copilot configuration files found elsewhere in the repository.

## Configuration

You can customize the default target path in VS Code settings:

1. Open Settings (`Ctrl+,` or `Cmd+,` on Mac)
2. Search for "AI Sync"
3. Change the "Default Target Path" setting
4. Or add to your `settings.json`:

```json
{
  "ai-sync.defaultTargetPath": ".github/copilot"
}
```

## Examples

### Example 1: Clone from GitHub
```
Repository URL: https://github.com/myorg/copilot-configs.git
Target Path: .github/copilot
```

### Example 2: Clone to Custom Location
```
Repository URL: https://github.com/myorg/ai-settings.git
Target Path: .copilot-settings
```

### Example 3: Clone from Private Repository
For private repositories, ensure you have proper Git credentials configured:
- SSH key authentication
- GitHub CLI authentication
- Personal access token

```
Repository URL: git@github.com:myorg/private-copilot-configs.git
Target Path: .github/copilot
```

## Troubleshooting

### Error: "No workspace folder is open"
- Make sure you have opened a folder in VS Code (File → Open Folder)

### Error: "No copilot files found"
- The repository doesn't contain any copilot-related files or directories
- Check that the repository URL is correct

### Error: "Failed to clone"
- Check your internet connection
- Verify the repository URL is correct
- For private repositories, ensure you have proper authentication set up

### Error: Git authentication required
- Set up Git credentials on your system
- Use SSH keys for private repositories
- Or use GitHub CLI: `gh auth login`

## Tips

1. **Organize Copilot Files**: Keep your copilot configurations in a dedicated repository for easy sharing across projects

2. **Version Control**: After cloning, commit the copilot files to your project's repository

3. **Regular Updates**: Re-run the command periodically to sync with the latest copilot configurations from the source repository

4. **Custom Paths**: You can clone to different paths for different types of copilot configurations

## Support

For issues, questions, or feature requests, please visit:
https://github.com/UseTheOps/ai-sync/issues
