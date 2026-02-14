# Change Log

All notable changes to the "AI Sync" extension will be documented in this file.

## [0.0.1] - 2026-02-14

### Added
- Initial release
- Clone copilot configuration files from Git repositories
- Smart detection of copilot-related files and directories
- Support for `.github/copilot`, `copilot`, and `.copilot` directories
- Detection of specific copilot files: `.copilotignore`, `copilot.yaml`, `copilot.yml`, `copilot.json`, `copilot-instructions.md`, `copilot.md`
- User-friendly input prompts for repository URL and target path
- Progress indicators during cloning operations
- Configurable default target path setting
- Comprehensive error handling and user feedback
- Temporary directory cleanup on success or failure
- Cancellable clone operations

### Security
- No known vulnerabilities
- Passed CodeQL security analysis
- All dependencies checked against GitHub Advisory Database
