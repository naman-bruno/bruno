/**
 * YAML format implementation for Bruno
 * Contains functions to convert between YAML and JSON for requests, collections, and environments
 */

const yaml = require('js-yaml');

/**
 * Convert YAML request to JSON object
 * @param {string} yamlContent - YAML content
 * @returns {Object} - JSON request object
 */
const yamlRequestToJson = (yamlContent) => {
  try {
    // Parse YAML to JSON
    const jsonData = yaml.load(yamlContent);
    
    // Extract request type (http or graphql)
    const requestType = jsonData.http ? 'http' : 'graphql';
    
    // Create a well-formed Bruno request object
    return {
      meta: jsonData.meta || {},
      name: jsonData.meta?.name || 'Unnamed Request',
      seq: jsonData.meta?.seq || 1,
      type: requestType,
      [requestType]: jsonData[requestType] || {},
      vars: jsonData.vars || {},
      tests: jsonData.tests,
      scripts: jsonData.scripts || {},
      docs: jsonData.docs
    };
  } catch (error) {
    throw new Error(`Failed to parse YAML request: ${error.message}`);
  }
};

/**
 * Convert JSON request to YAML string
 * @param {Object} jsonData - JSON request object
 * @returns {string} - YAML content
 */
const jsonRequestToYaml = (jsonData) => {
  try {
    // Clone the data to avoid modifying the original
    const requestData = { ...jsonData };
    
    // Extract the request type
    const requestType = requestData.type;
    
    // Create a well-formed YAML structure
    const yamlObj = {
      meta: requestData.meta || {
        name: requestData.name,
        seq: requestData.seq || 1
      }
    };
    
    // Add request-specific data
    if (requestType === 'http' || requestType === 'graphql') {
      yamlObj[requestType] = requestData[requestType];
    }
    
    // Add optional fields if they exist
    if (requestData.vars) {
      yamlObj.vars = requestData.vars;
    }
    
    if (requestData.tests) {
      yamlObj.tests = requestData.tests;
    }
    
    if (requestData.scripts) {
      yamlObj.scripts = requestData.scripts;
    }
    
    if (requestData.docs) {
      yamlObj.docs = requestData.docs;
    }
    
    // Convert to YAML string
    return yaml.dump(yamlObj, {
      indent: 2,
      lineWidth: -1, // No line wrapping
      noRefs: true,
      quotingType: '"'
    });
  } catch (error) {
    throw new Error(`Failed to convert request to YAML: ${error.message}`);
  }
};

/**
 * Convert YAML collection to JSON object
 * @param {string} yamlContent - YAML content
 * @returns {Object} - JSON collection object
 */
const yamlCollectionToJson = (yamlContent) => {
  try {
    // Parse YAML to JSON
    const jsonData = yaml.load(yamlContent);
    
    return {
      meta: jsonData.meta || {},
      name: jsonData.meta?.name || 'Unnamed Collection',
      ...jsonData
    };
  } catch (error) {
    throw new Error(`Failed to parse YAML collection: ${error.message}`);
  }
};

/**
 * Convert JSON collection to YAML string
 * @param {Object} jsonData - JSON collection object
 * @param {boolean} isFolder - Whether this is a folder not a collection
 * @returns {string} - YAML content
 */
const jsonCollectionToYaml = (jsonData, isFolder = false) => {
  try {
    // Clone the data to avoid modifying the original
    const collectionData = { ...jsonData };
    
    // Create a well-formed YAML structure
    const yamlObj = {
      meta: collectionData.meta || {
        name: collectionData.name
      }
    };
    
    // Add all other properties
    for (const key in collectionData) {
      if (key !== 'meta' && key !== 'name') {
        yamlObj[key] = collectionData[key];
      }
    }
    
    // Convert to YAML string
    return yaml.dump(yamlObj, {
      indent: 2,
      lineWidth: -1, // No line wrapping
      noRefs: true,
      quotingType: '"'
    });
  } catch (error) {
    throw new Error(`Failed to convert collection to YAML: ${error.message}`);
  }
};

/**
 * Convert YAML environment to JSON object
 * @param {string} yamlContent - YAML content
 * @returns {Object} - JSON environment object
 */
const yamlEnvironmentToJson = (yamlContent) => {
  try {
    // Parse YAML to JSON
    const jsonData = yaml.load(yamlContent);
    
    return {
      name: jsonData.name || 'Unnamed Environment',
      variables: jsonData.variables || []
    };
  } catch (error) {
    throw new Error(`Failed to parse YAML environment: ${error.message}`);
  }
};

/**
 * Convert JSON environment to YAML string
 * @param {Object} jsonData - JSON environment object
 * @returns {string} - YAML content
 */
const jsonEnvironmentToYaml = (jsonData) => {
  try {
    // Convert to YAML string
    return yaml.dump(jsonData, {
      indent: 2,
      lineWidth: -1, // No line wrapping
      noRefs: true,
      quotingType: '"'
    });
  } catch (error) {
    throw new Error(`Failed to convert environment to YAML: ${error.message}`);
  }
};

module.exports = {
  yamlRequestToJson,
  jsonRequestToYaml,
  yamlCollectionToJson,
  jsonCollectionToYaml,
  yamlEnvironmentToJson,
  jsonEnvironmentToYaml
}; 