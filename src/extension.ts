import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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

    // Get workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder is open');
      return;
    }

    // Get target path from configuration or use default
    const config = vscode.workspace.getConfiguration('ai-sync');
    const defaultTargetPath = config.get<string>('defaultTargetPath') || '.github/copilot';

    const targetPath = await vscode.window.showInputBox({
      prompt: 'Enter the target path where copilot files will be saved',
      placeHolder: defaultTargetPath,
      value: defaultTargetPath,
    });

    if (!targetPath) {
      return; // User cancelled
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
        const tmpDir = path.join(
          workspaceFolder.uri.fsPath,
          '.ai-sync-tmp',
          Date.now().toString()
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
          const targetDir = path.join(workspaceFolder.uri.fsPath, targetPath);
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
  return (
    normalizedPath.includes('/.github/copilot') ||
    normalizedPath.includes('/copilot') ||
    normalizedPath.includes('/.copilot')
  );
}

/**
 * Checks if a file is copilot-related
 */
function isCopilotFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return (
    lowerFilename.includes('copilot') ||
    lowerFilename === '.copilotignore' ||
    lowerFilename === 'copilot.yaml' ||
    lowerFilename === 'copilot.yml' ||
    lowerFilename === 'copilot.json'
  );
}
