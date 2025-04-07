/**
 * YAML format implementation for Bruno
 * Contains functions to convert between YAML and JSON for requests, collections, and environments
 */

const yaml = require('js-yaml');
const path = require('path');

/**
 * Convert YAML request to JSON object
 * @param {string} yamlContent - YAML content
 * @returns {Object} - JSON request object
 */
const yamlRequestToJson = (yamlContent) => {
  try {
    // Parse YAML to JSON
    const jsonData = yaml.load(yamlContent);
    if (!jsonData) {
      throw new Error('Failed to parse YAML content - empty or invalid YAML');
    }
    
    // Extract request type (http or graphql)
    let requestType = 'http-request';
    if (jsonData.meta && jsonData.meta.type) {
      if (jsonData.meta.type === 'http') {
        requestType = 'http-request';
      } else if (jsonData.meta.type === 'graphql') {
        requestType = 'graphql-request';
      }
    }
    
    const name = jsonData.meta?.name || path.basename(jsonData.filename || '', path.extname(jsonData.filename || '')) || 'Unnamed Request';
    
    const transformedJson = {
      uid: jsonData.uid || null, // Will be set by hydrateRequestWithUuid later
      name: name,
      filename: jsonData.filename || name,
      seq: jsonData.meta?.seq || 1,
      type: requestType,
      request: {
        method: (jsonData.http?.method || 'GET').toUpperCase(),
        url: jsonData.http?.url || '',
        headers: jsonData.headers || [],
        params: jsonData.params || [],
        auth: jsonData.auth || { mode: jsonData.http?.auth || 'none' },
        body: {
          mode: jsonData.body?.mode || jsonData.http?.body || 'none',
          json: jsonData.body?.json || null,
          text: jsonData.body?.text || null,
          xml: jsonData.body?.xml || null,
          sparql: jsonData.body?.sparql || null,
          multipartForm: jsonData.body?.multipartForm || [],
          formUrlEncoded: jsonData.body?.formUrlEncoded || [],
          file: jsonData.body?.file || []
        },
        script: {
          req: (jsonData.script && jsonData.script.req) || '',
          res: (jsonData.script && jsonData.script.res) || ''
        },
        vars: {
          req: (jsonData.vars && jsonData.vars.req) || [],
          res: (jsonData.vars && jsonData.vars.res) || []
        },
        assertions: jsonData.assertions || [],
        tests: jsonData.tests || '',
        docs: jsonData.docs || ''
      }
    };

    return transformedJson;
  } catch (error) {
    console.error('Error in yamlRequestToJson:', error);
    return {
      name: 'Error Parsing Request',
      type: 'http-request',
      seq: 1,
      request: {
        method: 'GET',
        url: '',
        headers: [],
        params: [],
        auth: { mode: 'none' },
        body: {
          mode: 'none',
          json: null,
          text: null,
          xml: null,
          sparql: null,
          multipartForm: [],
          formUrlEncoded: [],
          file: []
        },
        script: { req: '', res: '' },
        vars: { req: [], res: [] },
        assertions: [],
        tests: '',
        docs: ''
      }
    };
  }
};

/**
 * Convert JSON request object to YAML string
 * @param {Object} jsonData - JSON request object
 * @returns {string} - YAML content
 */
const jsonRequestToYaml = (jsonData) => {
  try {
    // Clone the data to avoid modifying the original
    const requestData = { ...jsonData };
    
    // Create a well-formed YAML structure
    const yamlObj = {
      meta: {
        name: requestData.name,
        type: requestData.type === 'http-request' ? 'http' : 
              requestData.type === 'graphql-request' ? 'graphql' : 'http',
        seq: requestData.seq || 1
      },
      http: {
        method: (requestData.request?.method).toLowerCase(),
        url: requestData.request?.url,
        body: (requestData.request?.body?.mode),
        auth: (requestData.request?.auth?.mode)
      }
    };

    // Add auth section if it exists
    if (requestData.request?.auth) {
      yamlObj.auth = {
        mode: requestData.request.auth.mode || 'inherit'
      };
      
      // Add auth specific fields
      if (requestData.request.auth.bearer) {
        yamlObj.auth.bearer = requestData.request.auth.bearer;
      }
      if (requestData.request.auth.basic) {
        yamlObj.auth.basic = requestData.request.auth.basic;
      }
      // Add other auth types as needed
    }
    
    // Add body section if it exists
    if (requestData.request?.body) {
      yamlObj.body = {
        mode: requestData.request.body.mode || 'none'
      };
      
      // Add body type specific content
      if (requestData.request.body.json) {
        yamlObj.body.json = requestData.request.body.json;
      }
      if (requestData.request.body.text) {
        yamlObj.body.text = requestData.request.body.text;
      }
      if (requestData.request.body.xml) {
        yamlObj.body.xml = requestData.request.body.xml;
      }
      if (requestData.request.body.sparql) {
        yamlObj.body.sparql = requestData.request.body.sparql;
      }
      if (requestData.request.body.multipartForm) {
        yamlObj.body.multipartForm = requestData.request.body.multipartForm;
      }
      if (requestData.request.body.formUrlEncoded) {
        yamlObj.body.formUrlEncoded = requestData.request.body.formUrlEncoded;
      }
      if (requestData.request.body.file) {
        yamlObj.body.file = requestData.request.body.file;
      }
    }
    
    // Add headers if they exist
    if (requestData.request?.headers && requestData.request.headers.length > 0) {
      yamlObj.headers = requestData.request.headers;
    }
    
    // Add params if they exist
    if (requestData.request?.params && requestData.request.params.length > 0) {
      yamlObj.params = requestData.request.params;
    }
    
    // Add script if it exists
    if (requestData.request?.script) {
      yamlObj.script = requestData.request.script;
    }
    
    // Add vars if they exist
    if (requestData.request?.vars) {
      yamlObj.vars = requestData.request.vars;
    }
    
    // Add tests if they exist
    if (requestData.request?.tests) {
      yamlObj.tests = requestData.request.tests;
    }
    
    // Add docs if they exist
    if (requestData.request?.docs) {
      yamlObj.docs = requestData.request.docs;
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