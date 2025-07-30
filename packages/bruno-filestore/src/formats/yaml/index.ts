import * as _ from 'lodash';
import * as YAML from 'yaml';

export const yamlRequestToJson = (data: string | any, parsed: boolean = false): any => {
  try {
    const json = parsed ? data : YAML.parse(data);

    let requestType = _.get(json, 'meta.type');
    if (!requestType) {
      // Determine type based on structure
      if (_.get(json, 'graphql')) {
        requestType = 'graphql-request';
      } else {
        requestType = 'http-request';
      }
    } else if (requestType === 'http') {
      requestType = 'http-request';
    } else if (requestType === 'graphql') {
      requestType = 'graphql-request';
    }

    const sequence = _.get(json, 'meta.seq');
    const httpSection = _.get(json, 'http') || _.get(json, 'graphql');
    
    const transformedJson = {
      type: requestType,
      name: _.get(json, 'meta.name'),
      seq: !_.isNaN(sequence) ? Number(sequence) : 1,
      settings: _.get(json, 'settings', {}),
      tags: _.get(json, 'meta.tags', []),
      request: {
        method: _.upperCase(_.get(httpSection, 'method')),
        url: _.get(httpSection, 'url'),
        params: [],
        headers: _.get(httpSection, 'headers', []),
        auth: {},
        body: {} as any,
        script: _.get(json, 'scripts', {}),
        vars: _.get(json, 'vars', {}),
        assertions: _.get(json, 'assertions', []),
        tests: _.get(json, 'tests', ''),
        docs: _.get(json, 'docs', '')
      }
    };

    // Convert YAML params structure to JSON format
    const params = _.get(httpSection, 'params', {});
    if (params.query && Array.isArray(params.query)) {
      transformedJson.request.params = transformedJson.request.params.concat(
        params.query.map((param: any) => ({
          ...param,
          type: 'query',
          enabled: param.disabled !== true
        }))
      );
    }
    if (params.path && Array.isArray(params.path)) {
      transformedJson.request.params = transformedJson.request.params.concat(
        params.path.map((param: any) => ({
          ...param,
          type: 'path',
          enabled: param.disabled !== true
        }))
      );
    }

    // Transform headers
    transformedJson.request.headers = transformedJson.request.headers.map((header: any) => ({
      ...header,
      enabled: header.disabled !== true
    }));

    // Transform auth - properly handle auth object conversion
    const authSection = _.get(httpSection, 'auth', {}) as any;
    transformedJson.request.auth = {
      mode: _.get(authSection, 'type', 'none')
    } as any;
    
    // Copy valid auth fields based on mode, excluding YAML-specific fields like 'type' and 'inherit'
    const authMode = (transformedJson.request.auth as any).mode;
    if (authMode !== 'none' && authMode !== 'inherit') {
      // Copy auth type-specific fields
      Object.keys(authSection).forEach(key => {
        if (key !== 'type' && key !== 'inherit') {
          (transformedJson.request.auth as any)[key] = authSection[key];
        }
      });
    }

    // Transform body
    const bodySection = _.get(httpSection, 'body', {}) as any;
    transformedJson.request.body = {
      mode: _.get(bodySection, 'type', 'none')
    } as any;
    if (_.get(httpSection, 'body.data')) {
      transformedJson.request.body.raw = _.get(httpSection, 'body.data');
    }
    if (_.get(httpSection, 'body.query')) {
      transformedJson.request.body.graphql = {
        query: _.get(httpSection, 'body.query'),
        variables: _.get(httpSection, 'body.variables', '')
      };
    }

    // Transform script structure
    transformedJson.request.script = {
      req: _.get(json, 'scripts.pre-request', ''),
      res: _.get(json, 'scripts.post-response', '')
    };

    // Transform vars structure
    transformedJson.request.vars = {
      req: _.get(json, 'vars.pre-request', []).map((v: any) => ({
        ...v,
        enabled: v.disabled !== true
      })),
      res: _.get(json, 'vars.post-response', []).map((v: any) => ({
        ...v,
        enabled: v.disabled !== true
      }))
    };

    return transformedJson;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const jsonRequestToYaml = (json: any): string => {
  try {
    let type = _.get(json, 'type');
    let sectionKey = 'http';
    if (type === 'http-request') {
      type = 'http';
      sectionKey = 'http';
    } else if (type === 'graphql-request') {
      type = 'graphql';
      sectionKey = 'graphql';
    } else {
      type = 'http';
      sectionKey = 'http';
    }

    const sequence = _.get(json, 'seq');
    const yamlObj: any = {
      meta: {
        name: _.get(json, 'name'),
        seq: !_.isNaN(sequence) ? Number(sequence) : 1
      }
    };

    // Add type only if it's graphql
    if (type === 'graphql') {
      yamlObj.meta.type = type;
    }

    // Add tags if they exist
    const tags = _.get(json, 'tags', []);
    if (tags.length > 0) {
      yamlObj.meta.tags = tags;
    }

    // HTTP/GraphQL section
    yamlObj[sectionKey] = {
      method: _.lowerCase(_.get(json, 'request.method')),
      url: _.get(json, 'request.url')
    };

    // Params
    const params = _.get(json, 'request.params', []);
    const queryParams = params.filter((p: any) => p.type === 'query');
    const pathParams = params.filter((p: any) => p.type === 'path');

    if (queryParams.length > 0 || pathParams.length > 0) {
      yamlObj[sectionKey].params = {};
      if (queryParams.length > 0) {
        yamlObj[sectionKey].params.query = queryParams.map((param: any) => ({
          name: param.name,
          value: param.value,
          ...(param.type && { type: param.type }),
          ...(param.description && { description: param.description }),
          ...(param.enabled === false && { disabled: true })
        }));
      }
      if (pathParams.length > 0) {
        yamlObj[sectionKey].params.path = pathParams.map((param: any) => ({
          name: param.name,
          value: param.value,
          ...(param.type && { type: param.type }),
          ...(param.description && { description: param.description }),
          ...(param.enabled === false && { disabled: true })
        }));
      }
    }

    // Headers
    const headers = _.get(json, 'request.headers', []);
    if (headers.length > 0) {
      yamlObj[sectionKey].headers = headers.map((header: any) => ({
        name: header.name,
        value: header.value,
        ...(header.description && { description: header.description }),
        ...(header.enabled === false && { disabled: true })
      }));
    }

    // Body
    const bodyMode = _.get(json, 'request.body.mode');
    if (bodyMode && bodyMode !== 'none') {
      yamlObj[sectionKey].body = {
        type: bodyMode
      };

      if (bodyMode === 'json' || bodyMode === 'raw') {
        const rawData = _.get(json, 'request.body.raw');
        if (rawData) {
          yamlObj[sectionKey].body.data = rawData;
        }
      } else if (bodyMode === 'graphql') {
        const graphqlData = _.get(json, 'request.body.graphql');
        if (graphqlData?.query) {
          yamlObj[sectionKey].body.query = graphqlData.query;
        }
        if (graphqlData?.variables) {
          yamlObj[sectionKey].body.variables = graphqlData.variables;
        }
      }
    }

    // Auth
    const authMode = _.get(json, 'request.auth.mode');
    if (authMode && authMode !== 'none') {
      yamlObj[sectionKey].auth = {
        type: authMode,
        [authMode]: _.get(json, `request.auth.${authMode}`, {})
      };
    }

    // Variables
    const reqVars = _.get(json, 'request.vars.req', []);
    const resVars = _.get(json, 'request.vars.res', []);
    if (reqVars.length > 0 || resVars.length > 0) {
      yamlObj.vars = {};
      if (reqVars.length > 0) {
        yamlObj.vars['pre-request'] = reqVars.map((v: any) => ({
          name: v.name,
          value: v.value,
          ...(v.description && { description: v.description }),
          ...(v.enabled === false && { disabled: true })
        }));
      }
      if (resVars.length > 0) {
        yamlObj.vars['post-response'] = resVars.map((v: any) => ({
          name: v.name,
          value: v.value,
          ...(v.description && { description: v.description }),
          ...(v.enabled === false && { disabled: true })
        }));
      }
    }

    // Scripts
    const reqScript = _.get(json, 'request.script.req', '');
    const resScript = _.get(json, 'request.script.res', '');
    if (reqScript || resScript) {
      yamlObj.scripts = {};
      if (reqScript) {
        yamlObj.scripts['pre-request'] = reqScript;
      }
      if (resScript) {
        yamlObj.scripts['post-response'] = resScript;
      }
    }

    // Tests
    const tests = _.get(json, 'request.tests', '');
    if (tests) {
      yamlObj.tests = tests;
    }

    // Docs
    const docs = _.get(json, 'request.docs', '');
    if (docs) {
      yamlObj.docs = docs;
    }

    // Settings
    const settings = _.get(json, 'settings', {});
    if (Object.keys(settings).length > 0) {
      yamlObj.settings = settings;
    }

    return YAML.stringify(yamlObj);
  } catch (error) {
    throw error;
  }
};

export const yamlCollectionToJson = (data: string | any, parsed: boolean = false): any => {
  try {
    const json = parsed ? data : YAML.parse(data);

    const transformedJson: any = {
      request: {
        headers: _.get(json, 'headers', []),
        auth: _.get(json, 'auth', {}),
        script: _.get(json, 'script', {}),
        vars: _.get(json, 'vars', {}),
        tests: _.get(json, 'tests', '')
      },
      settings: _.get(json, 'settings', {}),
      docs: _.get(json, 'docs', '')
    };

    // add meta if it exists (for folder bru file)
    if (json.meta) {
      transformedJson.meta = {
        name: json.meta.name
      };
      
      if (json.meta.seq !== undefined) {
        const sequence = json.meta.seq;
        transformedJson.meta.seq = !isNaN(sequence) ? Number(sequence) : 1;
      }
    }

    return transformedJson;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const jsonCollectionToYaml = (json: any, isFolder?: boolean): string => {
  try {
    const collectionYamlObj: any = {
      headers: _.get(json, 'request.headers', []),
      script: {
        req: _.get(json, 'request.script.req', ''),
        res: _.get(json, 'request.script.res', '')
      },
      vars: {
        req: _.get(json, 'request.vars.req', []),
        res: _.get(json, 'request.vars.res', [])
      },
      tests: _.get(json, 'request.tests', ''),
      auth: _.get(json, 'request.auth', {}),
      docs: _.get(json, 'docs', '')
    };

    // add meta if it exists (for folder bru file)
    if (json?.meta) {
      collectionYamlObj.meta = {
        name: json.meta.name
      };
      
      if (json.meta.seq !== undefined) {
        const sequence = json.meta.seq;
        collectionYamlObj.meta.seq = !isNaN(sequence) ? Number(sequence) : 1;
      }
    }

    if (!isFolder) {
      collectionYamlObj.auth = _.get(json, 'request.auth', {});
    }

    return YAML.stringify(collectionYamlObj);
  } catch (error) {
    throw error;
  }
};

export const yamlEnvironmentToJson = (yaml: string): any => {
  try {
    const json = YAML.parse(yaml);

    // the app env format requires each variable to have a type
    if (json && json.variables && json.variables.length) {
      _.each(json.variables, (v: any) => (v.type = 'text'));
    }

    return json;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const jsonEnvironmentToYaml = (json: any): string => {
  try {
    return YAML.stringify(json);
  } catch (error) {
    throw error;
  }
}; 