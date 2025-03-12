const _ = require('lodash');
const { 
  parseRequest: _parseRequest,
  parseEnvironment,
  parseCollection: _parseCollection
} = require('@usebruno/filestore');

const parseRequest = (bru, ignoreReqResFields) => {
  try {
    const json = _parseRequest(bru, ignoreReqResFields);

    if (ignoreReqResFields) {
      return json;
    }

    let requestType = _.get(json, 'meta.type');
    if (requestType === 'http') {
      requestType = 'http-request';
    } else if (requestType === 'graphql') {
      requestType = 'graphql-request';
    } else {
      requestType = 'http';
    }

    const sequence = _.get(json, 'meta.seq');

    const transformedJson = {
      type: requestType,
      name: _.get(json, 'meta.name'),
      seq: !isNaN(sequence) ? Number(sequence) : 1,
      request: {
        method: _.upperCase(_.get(json, 'http.method')),
        url: _.get(json, 'http.url'),
        auth: _.get(json, 'auth', {}),
        params: _.get(json, 'params', []),
        headers: _.get(json, 'headers', []),
        body: _.get(json, 'body', {}),
        vars: _.get(json, 'vars', []),
        assertions: _.get(json, 'assertions', []),
        script: _.get(json, 'script', {}),
        tests: _.get(json, 'tests', '')
      }
    };

    transformedJson.request.body.mode = _.get(json, 'http.body', 'none');
    transformedJson.request.auth.mode = _.get(json, 'http.auth', 'none');
    
    return transformedJson;
  } catch (err) {
    return bru;
  }
};

const parseEnv = (bru) => {
  try {
    const json = parseEnvironment(bru);

    return json;
  } catch (err) {
    return bru;
  }
};

const parseCollection = (bru) => {
  try {
    const json = _parseCollection(bru);

    const transformedJson = {
      request: {
        headers: _.get(json, 'headers', []),
        auth: _.get(json, 'auth', {}),
        script: _.get(json, 'script', {}),
        vars: _.get(json, 'vars', {}),
        tests: _.get(json, 'tests', '')
      }
    };

    if(json.meta && json.meta.name) {
      transformedJson.meta = json.meta;
    }
    
    return transformedJson;
  } catch (err) {
    console.error(err);
    return bru;
  }
};

const getEnvVars = (environment = {}) => {
  const variables = environment.variables;
  if (!variables || !variables.length) {
    return {};
  }

  const envVars = {};
  _.each(variables, (variable) => {
    if (variable.enabled) {
      envVars[variable.name] = variable.value;
    }
  });

  return envVars;
};

const options = {};
const getOptions = () => {
  return options;
};

module.exports = {
  parseRequest,
  parseEnv,
  parseCollection,
  getEnvVars,
  getOptions
};
