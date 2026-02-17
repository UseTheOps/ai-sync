import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import simpleGit from 'simple-git';

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('AI Sync extension is now active');

  const disposable = vscode.commands.registerCommand(
    'ai-sync.cloneCopilotFiles',
    async () => {
      await cloneCopilotFiles();
    }
  );

  context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension
 */
export function deactivate() {}

/**
 * Main function to clone copilot files from a git repository
 */
async function cloneCopilotFiles() {
  try {
    // Get the repository URL from user
    const repoUrl = await vscode.window.showInputBox({
      prompt: 'Enter the Git repository URL',
      placeHolder: 'https://github.com/username/repository.git',
      validateInput: (value) => {
        if (!value) {
          return 'Repository URL is required';
        }
        if (!value.match(/^(https?:\/\/|git@)/)) {
          return 'Please enter a valid Git repository URL';
        }
        return null;
      },
    });

    if (!repoUrl) {
      return; // User cancelled
    }

    // Get target path from configuration or use default
    const config = vscode.workspace.getConfiguration('ai-sync');
    const configuredDefaultPath = config.get<string>('defaultTargetPath');
    const defaultTargetPath =
      configuredDefaultPath || path.join(os.homedir(), '.copilot');
    const defaultTargetPathDisplay = configuredDefaultPath || '~/.copilot';

    const targetPath = await vscode.window.showInputBox({
      prompt: 'Enter the target path where copilot files will be saved',
      placeHolder: defaultTargetPathDisplay,
      value: defaultTargetPath,
    });

    if (!targetPath) {
      return; // User cancelled
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    let targetDir: string;
    try {
      targetDir = resolveTargetPath(targetPath, workspaceFolder);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      vscode.window.showErrorMessage(message);
      return;
    }

    // Show progress
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'AI Sync',
        cancellable: true,
      },
      async (progress, token) => {
        progress.report({ message: 'Cloning repository...' });

        // Create a temporary directory for cloning
        const tmpDir = await fs.promises.mkdtemp(
          path.join(os.tmpdir(), 'ai-sync-')
        );

        try {
          // Ensure tmp directory exists
          await fs.promises.mkdir(tmpDir, { recursive: true });

          if (token.isCancellationRequested) {
            return;
          }

          // Clone the repository
          const git = simpleGit();
          progress.report({ message: 'Downloading repository...' });
          await git.clone(repoUrl, tmpDir, ['--depth', '1']);

          if (token.isCancellationRequested) {
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
            return;
          }

          // Find copilot-related files
          progress.report({ message: 'Finding copilot files...' });
          const copilotFiles = await findCopilotFiles(tmpDir);

          if (copilotFiles.length === 0) {
            vscode.window.showWarningMessage(
              'No copilot files found in the repository'
            );
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
            return;
          }

          // Copy copilot files to target location
          progress.report({ message: 'Copying copilot files...' });
          await fs.promises.mkdir(targetDir, { recursive: true });

          let copiedCount = 0;
          for (const file of copilotFiles) {
            if (token.isCancellationRequested) {
              break;
            }

            const relativePath = path.relative(tmpDir, file);
            const targetFile = path.join(targetDir, relativePath);
            const targetFileDir = path.dirname(targetFile);

            await fs.promises.mkdir(targetFileDir, { recursive: true });
            await fs.promises.copyFile(file, targetFile);
            copiedCount++;
          }

          // Clean up temporary directory
          await fs.promises.rm(tmpDir, { recursive: true, force: true });

          if (!token.isCancellationRequested) {
            vscode.window.showInformationMessage(
              `Successfully copied ${copiedCount} copilot file(s) to ${targetPath}`
            );
          }
        } catch (error) {
          // Clean up on error
          try {
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
          throw error;
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to clone copilot files: ${errorMessage}`);
  }
}

/**
 * Recursively finds copilot-related files in a directory
 */
async function findCopilotFiles(dir: string): Promise<string[]> {
  const copilotFiles: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip .git directory and other hidden directories
    if (entry.isDirectory() && entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory() && entry.name.startsWith('.ai-sync')) {
      continue;
    }

    if (entry.isDirectory()) {
      // Check if this is a copilot-related directory
      if (isCopilotPath(fullPath)) {
        // Recursively get all files in this directory
        const filesInDir = await getAllFilesInDirectory(fullPath);
        copilotFiles.push(...filesInDir);
      } else {
        // Continue searching subdirectories
        const filesInSubdir = await findCopilotFiles(fullPath);
        copilotFiles.push(...filesInSubdir);
      }
    } else if (entry.isFile() && isCopilotFile(entry.name)) {
      copilotFiles.push(fullPath);
    }
  }

  return copilotFiles;
}

/**
 * Gets all files in a directory recursively
 */
async function getAllFilesInDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const filesInSubdir = await getAllFilesInDirectory(fullPath);
      files.push(...filesInSubdir);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Checks if a path is copilot-related
 */
function isCopilotPath(filepath: string): boolean {
  const normalizedPath = filepath.replace(/\\/g, '/').toLowerCase();
  const pathSegments = normalizedPath.split('/');
  
  // Check for specific copilot directory patterns
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    
    // Check for standalone copilot or .copilot directories
    if (segment === 'copilot' || segment === '.copilot') {
      return true;
    }

    // Allow top-level skills/prompts/agents directories
    if (segment === 'skills' || segment === 'prompts' || segment === 'agents') {
      return true;
    }
    
    // Check for .github/copilot pattern
    if (segment === '.github' && i + 1 < pathSegments.length && pathSegments[i + 1] === 'copilot') {
      return true;
    }
    
    // Check for .github/skills pattern
    if (segment === '.github' && i + 1 < pathSegments.length && pathSegments[i + 1] === 'skills') {
      return true;
    }
    
    // Check for .github/prompts pattern
    if (segment === '.github' && i + 1 < pathSegments.length && pathSegments[i + 1] === 'prompts') {
      return true;
    }
    
    // Check for .github/copilot/agents pattern
    if (segment === '.github' && i + 2 < pathSegments.length && 
        pathSegments[i + 1] === 'copilot' && pathSegments[i + 2] === 'agents') {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if a file is copilot-related
 */
function isCopilotFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  
  // Specific copilot configuration files
  const specificCopilotFiles = [
    '.copilotignore',
    'copilot.yaml',
    'copilot.yml',
    'copilot.json',
    'copilot-instructions.md',
    'copilot.md'
  ];
  
  return specificCopilotFiles.includes(lowerFilename);
}

/**
 * Resolves the user-provided target path, supporting absolute paths and tilde expansion.
 * Falls back to workspace-relative paths if a workspace is open.
 */
function resolveTargetPath(
  inputPath: string,
  workspaceFolder?: vscode.WorkspaceFolder
): string {
  const expandedPath = expandUserPath(inputPath);

  if (path.isAbsolute(expandedPath)) {
    return expandedPath;
  }

  if (workspaceFolder) {
    return path.join(workspaceFolder.uri.fsPath, expandedPath);
  }

  throw new Error('Please provide an absolute target path or open a workspace folder.');
}

/**
 * Expands '~' to the current user's home directory.
 */
function expandUserPath(inputPath: string): string {
  if (!inputPath) {
    return inputPath;
  }

  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1));
  }

  return inputPath;
}
