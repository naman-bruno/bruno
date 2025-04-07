const {
  bruRequestToJson,
  jsonRequestToBru,
  bruCollectionToJson,
  jsonCollectionToBru,
  bruEnvironmentToJson,
  jsonEnvironmentToBru
} = require('./formats/bru');
const {
  yamlRequestToJson,
  jsonRequestToYaml,
  yamlCollectionToJson,
  jsonCollectionToYaml,
  yamlEnvironmentToJson,
  jsonEnvironmentToYaml
} = require('./formats/yaml');
const { dotenvToJson } = require('@usebruno/lang');
const { BruParserWorker } = require('./workers');
const {
  detectFormatFromContent,
  detectFormatFromFilename,
  getExtensionForFormat,
  getFormatFromCollectionConfig,
  getFileExtensionForFormat
} = require('./utils/format-detector');

/**
 * Parse a request from a file
 * @param {string} content - The content of the file
 * @param {Object} options - Options for parsing
 * @param {string} options.format - Format to use ('bru', 'yaml', or 'auto')
 * @returns {Object} - Parsed request object
 */
const parseRequest = (content, options = {}) => {
  // If no format is specified, autodetect it
  const format = options.format || detectFormatFromContent(content);
  
  if (format === 'yaml') {
    return yamlRequestToJson(content);
  }
  
  // Default to BRU
  return bruRequestToJson(content);
};

/**
 * Stringify a request object to file content
 * @param {Object} requestObj - The request object to stringify
 * @param {Object} options - Options for stringifying
 * @param {string} options.format - Format to use ('bru', 'yaml')
 * @returns {string} - Stringified request content
 */
const stringifyRequest = (requestObj, options = {}) => {
  // Default to BRU format if not specified
  const format = options.format || 'bru';
  
  if (format === 'yaml') {
    return jsonRequestToYaml(requestObj);
  }
  
  // Default to BRU
  return jsonRequestToBru(requestObj);
};

/**
 * Parse a collection from a file
 * @param {string} content - The content of the file
 * @param {Object} options - Options for parsing
 * @param {string} options.format - Format to use ('bru', 'yaml', or 'auto')
 * @returns {Object} - Parsed collection object
 */
const parseCollection = (content, options = {}) => {
  // If no format is specified, autodetect it
  const format = options.format || detectFormatFromContent(content);
  
  if (format === 'yaml') {
    return yamlCollectionToJson(content);
  }
  
  // Default to BRU
  return bruCollectionToJson(content);
};

/**
 * Stringify a collection object to file content
 * @param {Object} collectionObj - The collection object to stringify
 * @param {boolean} isFolder - Whether this is a folder not a collection
 * @param {Object} options - Options for stringifying
 * @param {string} options.format - Format to use ('bru', 'yaml')
 * @returns {string} - Stringified collection content
 */
const stringifyCollection = (collectionObj, isFolder = false, options = {}) => {
  // Default to BRU format if not specified
  const format = options.format || 'bru';
  
  if (format === 'yaml') {
    return jsonCollectionToYaml(collectionObj, isFolder);
  }
  
  // Default to BRU
  return jsonCollectionToBru(collectionObj, isFolder);
};

/**
 * Parse a folder from a file
 * @param {string} content - The content of the file
 * @param {Object} options - Options for parsing
 * @param {string} options.format - Format to use ('bru', 'yaml', or 'auto')
 * @returns {Object} - Parsed folder object
 */
const parseFolder = (content, options = {}) => {
  // If no format is specified, autodetect it
  const format = options.format || detectFormatFromContent(content);
  
  if (format === 'yaml') {
    return yamlCollectionToJson(content);
  }
  
  // Default to BRU
  return bruCollectionToJson(content);
};

/**
 * Stringify a folder object to file content
 * @param {Object} folderObj - The folder object to stringify
 * @param {Object} options - Options for stringifying
 * @param {string} options.format - Format to use ('bru', 'yaml')
 * @returns {string} - Stringified folder content
 */
const stringifyFolder = (folderObj, options = {}) => {
  // Default to BRU format if not specified
  const format = options.format || 'bru';
  
  if (format === 'yaml') {
    // Pass isFolder=true to indicate this is a folder not a collection
    return jsonCollectionToYaml(folderObj, true);
  }
  
  // Default to BRU
  // Pass isFolder=true to indicate this is a folder not a collection
  return jsonCollectionToBru(folderObj, true);
};

/**
 * Parse an environment from a file
 * @param {string} content - The content of the file
 * @param {Object} options - Options for parsing
 * @param {string} options.format - Format to use ('bru', 'yaml', or 'auto')
 * @returns {Object} - Parsed environment object
 */
const parseEnvironment = (content, options = {}) => {
  // If no format is specified, autodetect it
  const format = options.format || detectFormatFromContent(content);
  
  if (format === 'yaml') {
    return yamlEnvironmentToJson(content);
  }
  
  // Default to BRU
  return bruEnvironmentToJson(content);
};

/**
 * Stringify an environment object to file content
 * @param {Object} envObj - The environment object to stringify
 * @param {Object} options - Options for stringifying
 * @param {string} options.format - Format to use ('bru', 'yaml')
 * @returns {string} - Stringified environment content
 */
const stringifyEnvironment = (envObj, options = {}) => {
  // Default to BRU format if not specified
  const format = options.format || 'bru';
  
  if (format === 'yaml') {
    return jsonEnvironmentToYaml(envObj);
  }
  
  // Default to BRU
  return jsonEnvironmentToBru(envObj);
};

/**
 * Parse .env file to JSON
 * @param {string} content - The content of the .env file
 * @returns {Object} - Parsed environment variables as key-value pairs
 */
const parseDotEnv = (content) => {
  return dotenvToJson(content);
};

// Enhanced parse function with worker support
const parseRequestViaWorker = async (data, options = {}) => {
  if (options?.worker) {
    if (!options.workerConfig) {
      throw new Error('Worker configuration must be provided when using worker option');
    }
    
    const { WorkerQueue, scriptsPath } = options.workerConfig;
    const fileParserWorker = new BruParserWorker({
      WorkerQueue,
      scriptsPath
    });

    const json = await fileParserWorker.parseRequest(data);
    return parseRequest(json, { format: options.format || 'bru' });
  }
  
  return parseRequest(data, options);
};

// Enhanced stringify function with worker support
const stringifyRequestViaWorker = async (data, options = {}) => {
  if (options?.worker) {
    if (!options.workerConfig) {
      throw new Error('Worker configuration must be provided when using worker option');
    }
    
    const { WorkerQueue, scriptsPath } = options.workerConfig;
    const fileParserWorker = new BruParserWorker({
      WorkerQueue,
      scriptsPath
    });

    return fileParserWorker.stringifyRequest(data, options);
  }
  
  return stringifyRequest(data, options);
};

module.exports = {
  // Format detection utilities
  detectFormatFromContent,
  detectFormatFromFilename,
  getExtensionForFormat,
  getFormatFromCollectionConfig,
  getFileExtensionForFormat,
  
  // Basic parsing/stringifying functions
  parseRequest,
  stringifyRequest,
  parseCollection,
  stringifyCollection,
  parseFolder,
  stringifyFolder,
  parseEnvironment,
  stringifyEnvironment,
  parseDotEnv,
  
  // Worker-based functions
  BruParserWorker,
  parseRequestViaWorker,
  stringifyRequestViaWorker
}; 