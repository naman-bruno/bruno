# Bruno VS Code Extension

A VS Code extension for working with Bruno API files (`.bru`) directly in Visual Studio Code.

## Features

- **Rich UI Editor**: Edit and run Bruno API requests with a familiar interface similar to Bruno Desktop
- **File Explorer Integration**: Displays HTTP method badges (GET, POST, etc.) in front of .bru files in the VS Code explorer
- **Run API Requests**: Send API requests directly from the editor and view formatted responses
- **Edit API Requests**: Update URL, headers, query parameters, and body directly in the VS Code interface
- **Real-time Updates**: Changes in the UI automatically update the underlying .bru file
- **Editor Flexibility**: Switch between UI mode and text mode based on your preference

## Screenshots

![Bruno VS Code Extension](https://raw.githubusercontent.com/usebruno/bruno/main/packages/bruno-vs-code/docs/screenshot.png)

## Requirements

- Visual Studio Code 1.80.0 or higher

## Getting Started

1. Install the extension
2. Open a directory containing Bruno API collections (with `.bru` files)
3. You'll see HTTP method badges in the explorer for valid .bru files
4. Click on a .bru file to open it in the Bruno editor interface
5. Edit parameters, headers, and body content directly in the interface
6. Click "Send" to execute requests and view responses

## Usage

### Switching Between Editor Modes

The extension provides two ways to edit Bruno files:

- **UI Mode**: A rich interface similar to Bruno Desktop with tabs and visual components
- **Text Mode**: Standard text editing of the raw .bru file

You can switch between modes:

1. Via the command palette: `Bruno: Open in UI Editor` or `Bruno: Open in Text Editor`
2. Via the context menu: Right-click on a .bru file in the explorer or editor
3. Via settings: Set your preferred default mode in VS Code settings (Bruno > Editor > Default Mode)

Note: Collection and folder definition files (.bru files named "collection.bru" or "folder.bru") will always open in text mode.

### Editing Requests

- **URL**: Enter the URL directly in the address bar at the top
- **Query Parameters**: Add, edit or remove query parameters in the "Params" tab
- **Headers**: Manage request headers in the "Headers" tab
- **Body**: Edit the request body in the "Body" tab

### Sending Requests

- Click the "Send" button in the top-right corner to send the request
- The response will appear in the "Response" section
- View response status, headers, body, and timing information

### Saving Changes

- Changes made in the UI editor are immediately applied to the file
- Use standard save shortcuts (Cmd+S or Ctrl+S) to save the file
- The edited file will show an indicator when it has unsaved changes

## Limitations

This extension is a lightweight version of the main Bruno API client and has some limitations:

- Advanced authentication methods are not fully supported
- Proxy configuration is not supported
- Environment variables have limited support
- Pre/post request scripts support is limited
- Workspace variables are not fully supported

For full Bruno functionality, please use the main Bruno desktop application.

## Development

### Building the Extension

1. Clone the Bruno repository
2. Navigate to the extension directory: `cd packages/bruno-vs-code`
3. Install dependencies: `npm install`
4. Build the extension: `npm run compile`

### Running the Extension in Development Mode

1. Open the bruno-vs-code directory in VS Code
2. Press F5 to start debugging, which will launch a new VS Code window with the extension loaded
3. Open a directory with .bru files to test the extension

## License

This extension is released under the same license as Bruno. 