import {
  bruRequestToJson,
  jsonRequestToBru,
  bruCollectionToJson,
  jsonCollectionToBru,
  bruEnvironmentToJson,
  jsonEnvironmentToBru
} from './formats/bru';
import {
  yamlRequestToJson,
  jsonRequestToYaml,
  yamlCollectionToJson,
  jsonCollectionToYaml,
  yamlEnvironmentToJson,
  jsonEnvironmentToYaml
} from './formats/yaml';
import {
  openCollectionToJson,
  jsonToOpenCollection,
  updateRequestInOpenCollection,
  addRequestToOpenCollection,
  removeRequestFromOpenCollection
} from './formats/opencollection';
import { dotenvToJson } from '@usebruno/lang';
import BruParserWorker from './workers';
import {
  ParseOptions,
  StringifyOptions,
  ParsedRequest,
  ParsedCollection,
  ParsedEnvironment
} from './types';
import { bruRequestParseAndRedactBodyData } from './formats/bru/utils/request-parse-and-redact-body-data';

export const parseRequest = (content: string, options: ParseOptions = { format: 'bru' }): any => {
  if (options.format === 'bru') {
    return bruRequestToJson(content);
  } else if (options.format === 'yaml') {
    return yamlRequestToJson(content);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

export const parseRequestAndRedactBody = (content: string, options: ParseOptions = { format: 'bru' }): any => {
  if (options.format === 'bru') {
    return bruRequestParseAndRedactBodyData(content);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

export const stringifyRequest = (requestObj: ParsedRequest, options: StringifyOptions = { format: 'bru' }): string => {
  if (options.format === 'bru') {
    return jsonRequestToBru(requestObj);
  } else if (options.format === 'yaml') {
    return jsonRequestToYaml(requestObj);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

let globalWorkerInstance: BruParserWorker | null = null;

const getWorkerInstance = (): BruParserWorker => {
  if (!globalWorkerInstance) {
    globalWorkerInstance = new BruParserWorker();
  }
  return globalWorkerInstance;
};

// Helper function to detect format from file extension
export const detectFormatFromExtension = (filename: string): 'bru' | 'yaml' | 'opencollection' => {
  const ext = filename.toLowerCase();
  if (ext.endsWith('.yml') || ext.endsWith('.yaml')) {
    // Check if it's an opencollection file based on naming convention
    if (filename.toLowerCase().includes('collection.yml') || filename.toLowerCase().includes('collection.yaml')) {
      return 'opencollection';
    }
    return 'yaml';
  }
  return 'bru';
};

// Helper function to detect format from content (basic heuristic)
export const detectFormatFromContent = (content: string): 'bru' | 'yaml' | 'opencollection' => {
  const trimmed = content.trim();
  // Check for opencollection format (has collection-level structure)
  if (trimmed.includes('type: collection') && trimmed.includes('items:')) {
    return 'opencollection';
  }
  // YAML typically starts with meta: or has key: value structure
  if (trimmed.includes('meta:') && (trimmed.includes('http:') || trimmed.includes('graphql:'))) {
    return 'yaml';
  }
  return 'bru';
};

export const parseRequestViaWorker = async (content: string, options?: { format?: 'bru' | 'yaml' | 'opencollection' | 'auto'; filename?: string }): Promise<any> => {
  const fileParserWorker = getWorkerInstance();
  let format: 'bru' | 'yaml' | 'opencollection' = 'bru';  
  
  if (options?.format === 'auto') {
    if (options.filename) {
      format = detectFormatFromExtension(options.filename);
    } else {
      format = detectFormatFromContent(content);
    }
  } else if (options?.format) {
    format = options.format as 'bru' | 'yaml' | 'opencollection';
  }
  
  // For opencollection, we can't use worker thread, parse directly
  if (format === 'opencollection') {
    return parseRequest(content, { format });
  }
  
  return await fileParserWorker.parseRequest(content, format as 'bru' | 'yaml');
};

export const stringifyRequestViaWorker = async (requestObj: any, options?: { format?: 'bru' | 'yaml' }): Promise<string> => {
  const fileParserWorker = getWorkerInstance();
  const format = options?.format || 'bru';
  return await fileParserWorker.stringifyRequest(requestObj, format);
};

export const parseCollection = (content: string, options: ParseOptions = { format: 'bru' }): any => {
  if (options.format === 'bru') {
    return bruCollectionToJson(content);
  } else if (options.format === 'yaml') {
    return yamlCollectionToJson(content);
  } else if (options.format === 'opencollection') {
    return openCollectionToJson(content);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

export const stringifyCollection = (collectionObj: ParsedCollection, options: StringifyOptions = { format: 'bru' }): string => {
  if (options.format === 'bru') {
    return jsonCollectionToBru(collectionObj, false);
  } else if (options.format === 'yaml') {
    return jsonCollectionToYaml(collectionObj, false);
  } else if (options.format === 'opencollection') {
    return jsonToOpenCollection(collectionObj);
  }

  throw new Error(`Unsupported format: ${options.format}`);
};

export const parseFolder = (content: string, options: ParseOptions = { format: 'bru' }): any => {
  if (options.format === 'bru') {
    return bruCollectionToJson(content);
  } else if (options.format === 'yaml') {
    return yamlCollectionToJson(content);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

export const stringifyFolder = (folderObj: any, options: StringifyOptions = { format: 'bru' }): string => {
  if (options.format === 'bru') {
    return jsonCollectionToBru(folderObj, true);
  } else if (options.format === 'yaml') {
    return jsonCollectionToYaml(folderObj, true);
  } else if (options.format === 'opencollection') {
    // For opencollection, we don't create individual folder files
    // Return empty string as folders are managed within the collection.yml
    return '';
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

export const parseEnvironment = (content: string, options: ParseOptions = { format: 'bru' }): any => {
  if (options.format === 'bru') {
    return bruEnvironmentToJson(content);
  } else if (options.format === 'yaml') {
    return yamlEnvironmentToJson(content);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};

export const stringifyEnvironment = (envObj: ParsedEnvironment, options: StringifyOptions = { format: 'bru' }): string => {
  if (options.format === 'bru') {
    return jsonEnvironmentToBru(envObj);
  } else if (options.format === 'yaml') {
    return jsonEnvironmentToYaml(envObj);
  }
  throw new Error(`Unsupported format: ${options.format}`);
};


export const parseDotEnv = (content: string): Record<string, string> => {
  return dotenvToJson(content);
};

export { BruParserWorker };
export * from './types';

// Export opencollection specific functions
export {
  openCollectionToJson,
  jsonToOpenCollection,
  updateRequestInOpenCollection,
  addRequestToOpenCollection,
  removeRequestFromOpenCollection
};