# Bruno Filestore

The `@usebruno/filestore` package provides file storage and parsing functionality for Bruno.

## Features

- Parse and stringify .bru files for requests, collections, environments
- Parse and stringify .yml/.yaml files for requests, collections, environments
- Auto-detect file formats (BRU or YAML)
- Worker-based async processing for large files
- Format detection utilities

## Installation

```bash
npm install @usebruno/filestore
```

## Usage

### Basic Usage

```javascript
const { 
  parseRequest, 
  stringifyRequest,
  parseCollection,
  stringifyCollection,
  parseEnvironment,
  stringifyEnvironment
} = require('@usebruno/filestore');

// Parse a .bru request file
const bruContent = `meta {
  name: My Request
  type: http
}
http-request {
  method: GET
  url: https://example.com
}`;

const requestObj = parseRequest(bruContent);
console.log(requestObj);

// Stringify a request object to .bru format
const newBruContent = stringifyRequest(requestObj);
console.log(newBruContent);

// Parse a YAML request file
const yamlContent = `
meta:
  name: My Request
  type: http
http:
  method: GET
  url: https://example.com
`;

const yamlRequestObj = parseRequest(yamlContent);
console.log(yamlRequestObj);

// Stringify a request object to YAML format
const newYamlContent = stringifyRequest(requestObj, { format: 'yaml' });
console.log(newYamlContent);
```

### Worker-based Async Processing

```javascript
const { parseRequestViaWorker, stringifyRequestViaWorker } = require('@usebruno/filestore');

// Define your worker implementation
const workerConfig = {
  WorkerQueue: MyWorkerQueueImplementation,
  scriptsPath: '/path/to/worker/scripts'
};

// Parse a large .bru file using a worker
const json = await parseRequestViaWorker(bruContent, { 
  worker: true, 
  workerConfig 
});

// Stringify to YAML format using a worker
const yaml = await stringifyRequestViaWorker(requestObj, { 
  worker: true, 
  workerConfig,
  format: 'yaml'
});
```

### Format Detection

```javascript
const { 
  detectFormatFromContent, 
  detectFormatFromFilename,
  getExtensionForFormat,
  getFormatFromCollectionConfig
} = require('@usebruno/filestore');

// Detect format from content
const format = detectFormatFromContent(fileContent);
console.log(format); // 'bru' or 'yaml'

// Detect format from filename
const formatFromFilename = detectFormatFromFilename('request.yml');
console.log(formatFromFilename); // 'yaml'

// Get appropriate file extension
const extension = getExtensionForFormat('yaml');
console.log(extension); // '.yml'

// Get format preference from collection config
const formatPref = getFormatFromCollectionConfig({
  fileFormat: 'yaml'
});
console.log(formatPref); // 'yaml'
```

## API

### Core Functions

- `parseRequest(content, options = {})`: Parse request file content
  - `options.format`: 'bru', 'yaml', or auto-detected if not specified

- `stringifyRequest(requestObj, options = {})`: Stringify request object
  - `options.format`: 'bru' (default) or 'yaml'

- `parseCollection(content, options = {})`: Parse collection file content
  - `options.format`: 'bru', 'yaml', or auto-detected if not specified

- `stringifyCollection(collectionObj, isFolder = false, options = {})`: Stringify collection object
  - `options.format`: 'bru' (default) or 'yaml'

- `parseFolder(content, options = {})`: Parse folder file content
  - `options.format`: 'bru', 'yaml', or auto-detected if not specified

- `stringifyFolder(folderObj, options = {})`: Stringify folder object
  - `options.format`: 'bru' (default) or 'yaml'

- `parseEnvironment(content, options = {})`: Parse environment file content
  - `options.format`: 'bru', 'yaml', or auto-detected if not specified

- `stringifyEnvironment(envObj, options = {})`: Stringify environment object
  - `options.format`: 'bru' (default) or 'yaml'

- `parseDotEnv(content)`: Parse .env file content

### Worker Functions

- `parseRequestViaWorker(content, options = {})`: Parse request using a worker thread
  - `options.worker`: Set to true to enable worker processing
  - `options.workerConfig`: Worker configuration object
  - `options.format`: 'bru' (default) or 'yaml'

- `stringifyRequestViaWorker(requestObj, options = {})`: Stringify request using a worker thread
  - `options.worker`: Set to true to enable worker processing
  - `options.workerConfig`: Worker configuration object
  - `options.format`: 'bru' (default) or 'yaml'

### Format Detection

- `detectFormatFromContent(content)`: Detect format ('bru' or 'yaml') from content
- `detectFormatFromFilename(filename)`: Detect format ('bru' or 'yaml') from filename
- `getExtensionForFormat(format)`: Get the file extension for a format
- `getFormatFromCollectionConfig(collectionConfig)`: Get format preference from collection config

## Creating a Collection with YAML Support

When creating a new collection, add the `fileFormat` property to the collection config:

```javascript
const brunoConfig = {
  version: '1',
  name: collectionName,
  type: 'collection',
  fileFormat: 'yaml', // Use YAML for this collection
  ignore: ['node_modules', '.git']
};
```

All new files created within this collection will use the YAML format by default. 