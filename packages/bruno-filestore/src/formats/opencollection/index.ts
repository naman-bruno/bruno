import * as _ from 'lodash';
import * as YAML from 'yaml';

interface OpenCollectionSchema {
  name: string;
  description?: string | { content: string; type: string } | null;
  environments?: Environment[];
  items?: Item[];
  base?: {
    headers?: RequestHeader[];
    auth?: Auth;
    variables?: Variable[];
    scripts?: Scripts;
  };
  docs?: string;
}

interface Environment {
  name: string;
  description?: string | { content: string; type: string } | null;
  variables?: Variable[];
}

interface Variable {
  name?: string;
  value?: string | ValueSet | null;
  description?: string | { content: string; type: string } | null;
  disabled?: boolean;
  transient?: boolean;
  default?: string | Value | null;
}

interface Value {
  data: string;
  type: 'string' | 'number' | 'boolean' | 'null' | 'object';
}

interface ValueSet {
  data: string;
  type: 'string' | 'number' | 'boolean' | 'null' | 'object';
  variants?: Variant[];
}

interface Variant {
  data: string;
  description?: string;
}

interface RequestHeader {
  name: string;
  value: string;
  description?: string | { content: string; type: string } | null;
  disabled?: boolean;
}

interface RequestParam {
  name: string;
  value: string;
  description?: string | { content: string; type: string } | null;
  type: 'query' | 'path';
  enabled?: boolean;
}

interface Auth {
  type: 'awsv4' | 'basic' | 'wsse' | 'bearer' | 'digest' | 'ntlm' | 'apikey';
  [key: string]: any;
}

interface Scripts {
  preRequest?: string;
  postResponse?: string;
  tests?: string;
  hooks?: string;
}

interface Assertion {
  expression: string;
  operator: string;
  value: string;
  enabled?: boolean;
  description?: string | { content: string; type: string } | null;
}

type Item = HttpRequest | GraphQLRequest | GrpcRequest | Folder | Script;

interface HttpRequest {
  name?: string;
  type: 'http';
  url?: string;
  method?: string;
  params?: RequestParam[];
  headers?: RequestHeader[];
  body?: RequestBody;
  auth?: Auth;
  scripts?: Scripts;
  variables?: Variable[];
  assertions?: Assertion[];
  docs?: string;
}

interface GraphQLRequest {
  name?: string;
  type: 'graphql';
  // GraphQL specific properties would go here
}

interface GrpcRequest {
  name?: string;
  type: 'grpc';
  // gRPC specific properties would go here
}

interface Folder {
  name?: string;
  type: 'folder';
  items?: Item[];
  headers?: RequestHeader[];
  auth?: Auth;
  variables?: Variable[];
  scripts?: Scripts;
  docs?: string;
}

interface Script {
  type: 'script';
  script?: string;
}

type RequestBody = RawBody | FormUrlEncodedBody | MultipartFormBody | FileBody | null;

interface RawBody {
  type: 'json' | 'text' | 'xml' | 'sparql';
  data: string;
}

type FormUrlEncodedBody = Array<{
  name: string;
  value: string;
  description?: string | { content: string; type: string } | null;
  enabled?: boolean;
}>;

type MultipartFormBody = Array<{
  name: string;
  type: 'text' | 'file';
  value: string | string[];
  description?: string | { content: string; type: string } | null;
  enabled?: boolean;
}>;

type FileBody = Array<{
  filePath: string;
  contentType: string;
  selected: boolean;
}>;

// Parse entire collection from YAML
export const openCollectionToJson = (data: string | any, parsed: boolean = false): any => {
  try {
    const yaml = parsed ? data : YAML.parse(data);
    
    if (!yaml || !yaml.name) {
      throw new Error('Invalid opencollection format - missing name');
    }

    const transformedCollection = {
      version: '1',
      name: yaml.name,
      type: 'collection',
      items: transformItems(yaml.items || []),
      environments: transformEnvironments(yaml.environments || []),
      settings: {}, // Bruno internal settings
      // Collection-level properties should be in root.request for Bruno compatibility
      root: {
        request: {
          auth: transformAuth(yaml.base?.auth) || { mode: 'inherit' },
          headers: transformHeaders(yaml.base?.headers || []),
          vars: transformVariables(yaml.base?.variables || []),
          script: transformScripts(yaml.base?.scripts) || {},
          tests: yaml.base?.scripts?.tests || ''
        },
        docs: yaml.docs || ''
      },
      // Also keep them at the top level for internal consistency
      auth: transformAuth(yaml.base?.auth) || { mode: 'inherit' },
      headers: transformHeaders(yaml.base?.headers || []),
      vars: transformVariables(yaml.base?.variables || []),
      script: transformScripts(yaml.base?.scripts) || {},
      tests: yaml.base?.scripts?.tests || '',
      docs: yaml.docs || ''
    };

    return transformedCollection;
  } catch (error: any) {
    throw new Error(`Failed to parse opencollection: ${error.message}`);
  }
};

// Convert collection JSON to YAML
export const jsonToOpenCollection = (collection: any): string => {
  try {
    const openCollectionData: OpenCollectionSchema = {
      name: collection.name,
      items: transformItemsToSchema(collection.items || []),
      environments: transformEnvironmentsToSchema(collection.environments || [])
    };

    // Add base configuration if there are collection-level settings
    // Check both top-level properties and root.request structure for compatibility
    const baseConfig: any = {};
    
    const auth = collection.root?.request?.auth || collection.auth;
    if (auth && auth.mode !== 'inherit') {
      baseConfig.auth = transformAuthToSchema(auth);
    }
    
    const headers = collection.root?.request?.headers || collection.headers;
    if (headers && headers.length > 0) {
      baseConfig.headers = transformHeadersToSchema(headers);
    }
    
    const vars = collection.root?.request?.vars || collection.vars;
    if (vars && Object.keys(vars).length > 0) {
      baseConfig.variables = transformVariablesToSchema(vars);
    }
    
    const script = collection.root?.request?.script || collection.script;
    const tests = collection.root?.request?.tests || collection.tests;
    if (script && Object.keys(script).length > 0) {
      baseConfig.scripts = transformScriptsToSchema(script, tests);
    }
    
    if (Object.keys(baseConfig).length > 0) {
      openCollectionData.base = baseConfig;
    }

    const docs = collection.root?.docs || collection.docs;
    if (docs) {
      openCollectionData.docs = docs;
    }

    return YAML.stringify(openCollectionData, { indent: 2 });
  } catch (error: any) {
    throw new Error(`Failed to stringify opencollection: ${error.message}`);
  }
};

// Transform items from schema to Bruno format
function transformItems(items: Item[]): any[] {
  return items.map(item => {
    const itemName = 'name' in item ? item.name : 'Untitled';
    const baseItem = {
      uid: generateUid(),
      name: itemName || 'Untitled',
      seq: 1
    };

    if (item.type === 'folder') {
      const folderItem = item as Folder;
      return {
        ...baseItem,
        type: 'folder',
        items: transformItems(folderItem.items || []),
        // Store folder properties directly in request object for Bruno compatibility
        request: {
          auth: transformAuth(folderItem.auth) || { mode: 'inherit' },
          headers: transformHeaders(folderItem.headers || []),
          vars: transformVariables(folderItem.variables || []),
          script: transformScripts(folderItem.scripts) || {},
          docs: folderItem.docs || ''
        }
      };
    } else if (item.type === 'http') {
      const httpItem = item as HttpRequest;
      return {
        ...baseItem,
        type: 'http-request',
        settings: {},
        tags: [],
        request: {
          method: httpItem.method?.toUpperCase() || 'GET',
          url: httpItem.url || '',
          params: transformParams(httpItem.params || []),
          headers: transformHeaders(httpItem.headers || []),
          auth: transformAuth(httpItem.auth) || { mode: 'inherit' },
          body: transformBody(httpItem.body),
          script: transformScripts(httpItem.scripts),
          vars: transformVariables(httpItem.variables || []),
          assertions: transformAssertions(httpItem.assertions || []),
          tests: httpItem.scripts?.tests || '',
          docs: httpItem.docs || ''
        }
      };
    } else if (item.type === 'graphql') {
      return {
        ...baseItem,
        type: 'graphql-request',
        settings: {},
        tags: [],
        request: {
          method: 'POST',
          url: '',
          params: [],
          headers: [],
          auth: { mode: 'inherit' },
          body: { mode: 'graphql', graphql: {} },
          script: {},
          vars: {},
          assertions: [],
          tests: '',
          docs: ''
        }
      };
    }
    
    return baseItem;
  });
}

// Transform items from Bruno format to schema
function transformItemsToSchema(items: any[]): Item[] {
  return items.map(item => {
    if (item.type === 'folder') {
      const folderSchema: Folder = {
        name: item.name,
        type: 'folder',
        items: transformItemsToSchema(item.items || [])
      };
      
      // Add folder-level properties if they exist
      if (item.request?.auth && item.request.auth.mode !== 'inherit') {
        folderSchema.auth = transformAuthToSchema(item.request.auth);
      }
      if (item.request?.headers && item.request.headers.length > 0) {
        folderSchema.headers = transformHeadersToSchema(item.request.headers);
      }
      if (item.request?.vars && (item.request.vars.req?.length > 0 || item.request.vars.res?.length > 0)) {
        folderSchema.variables = transformVariablesToSchema(item.request.vars);
      }
      if (item.request?.script && Object.keys(item.request.script).length > 0) {
        folderSchema.scripts = transformScriptsToSchema(item.request.script, item.request.tests);
      }
      if (item.request?.docs) {
        folderSchema.docs = item.request.docs;
      }
      
      return folderSchema;
    } else if (item.type === 'http-request') {
      return {
        name: item.name,
        type: 'http',
        url: item.request?.url || '',
        method: item.request?.method || 'GET',
        params: transformParamsToSchema(item.request?.params || []),
        headers: transformHeadersToSchema(item.request?.headers || []),
        body: transformBodyToSchema(item.request?.body),
        auth: transformAuthToSchema(item.request?.auth),
        scripts: transformScriptsToSchema(item.request?.script, item.request?.tests),
        variables: transformVariablesToSchema(item.request?.vars),
        assertions: transformAssertionsToSchema(item.request?.assertions || []),
        docs: item.request?.docs || ''
      } as HttpRequest;
    } else if (item.type === 'graphql-request') {
      return {
        name: item.name,
        type: 'graphql'
      } as GraphQLRequest;
    }
    
    return {
      name: item.name,
      type: 'http'
    } as HttpRequest;
  });
}

// Transform environments from schema to Bruno format
function transformEnvironments(environments: Environment[]): any[] {
  return environments.map(env => ({
    uid: generateUid(),
    name: env.name,
    // Note: Bruno's environment schema doesn't support description, so we omit it
    variables: (env.variables || []).map(variable => ({
      uid: generateUid(),
      name: variable.name || '',
      value: typeof variable.value === 'string' ? variable.value : (variable.value || ''),
      type: 'text', // Bruno requires this field
      enabled: variable.disabled !== true,
      secret: variable.transient === true
      // Note: Bruno's variable schema doesn't support description or default, so we omit them
    }))
  }));
}

// Transform environments from Bruno format to schema
function transformEnvironmentsToSchema(environments: any[]): Environment[] {
  return environments.map(env => {
    const schemaEnv: Environment = {
      name: env.name
    };
    
    // Note: Bruno doesn't store environment descriptions internally, so we can't restore them
    
    if (env.variables && env.variables.length > 0) {
      schemaEnv.variables = env.variables.map((variable: any) => {
        const schemaVar: Variable = {
          name: variable.name || '',
          value: variable.value || ''
        };
        
        // Note: Bruno doesn't store variable descriptions internally, so we can't restore them
        
        if (variable.enabled === false) {
          schemaVar.disabled = true;
        }
        
        if (variable.secret === true) {
          schemaVar.transient = true;
          // Note: Bruno doesn't store default values internally, so we can't restore them
        }
        
        return schemaVar;
      });
    }
    
    return schemaEnv;
  });
}

// Transform parameters from schema to Bruno format
function transformParams(params: RequestParam[]): any[] {
  return params.map(param => ({
    uid: generateUid(),
    name: param.name,
    value: param.value,
    type: param.type,
    enabled: param.enabled !== false
  }));
}

// Transform parameters from Bruno format to schema
function transformParamsToSchema(params: any[]): RequestParam[] {
  return params.map(param => ({
    name: param.name || '',
    value: param.value || '',
    type: param.type === 'path' ? 'path' : 'query',
    enabled: param.enabled !== false
  }));
}

// Transform headers from schema to Bruno format
function transformHeaders(headers: RequestHeader[]): any[] {
  return headers.map(header => ({
    uid: generateUid(),
    name: header.name,
    value: header.value,
    enabled: header.disabled !== true
  }));
}

// Transform headers from Bruno format to schema
function transformHeadersToSchema(headers: any[]): RequestHeader[] {
  return headers.map(header => ({
    name: header.name || '',
    value: header.value || '',
    disabled: header.enabled === false
  }));
}

// Transform auth from schema to Bruno format
function transformAuth(auth?: Auth): any {
  if (!auth) return { mode: 'inherit' };
  
  switch (auth.type) {
    case 'basic':
      return {
        mode: 'basic',
        username: (auth as any).username || '',
        password: (auth as any).password || ''
      };
    case 'bearer':
      return {
        mode: 'bearer',
        token: (auth as any).token || ''
      };
    case 'apikey':
      return {
        mode: 'apikey',
        key: (auth as any).key || '',
        value: (auth as any).value || '',
        placement: (auth as any).placement || 'header'
      };
    default:
      return { mode: 'inherit' };
  }
}

// Transform auth from Bruno format to schema
function transformAuthToSchema(auth: any): Auth | undefined {
  if (!auth || auth.mode === 'inherit') return undefined;
  
  switch (auth.mode) {
    case 'basic':
      return {
        type: 'basic',
        username: auth.username || '',
        password: auth.password || ''
      };
    case 'bearer':
      return {
        type: 'bearer',
        token: auth.token || ''
      };
    case 'apikey':
      return {
        type: 'apikey',
        key: auth.key || '',
        value: auth.value || '',
        placement: auth.placement || 'header'
      };
    default:
      return undefined;
  }
}

// Transform body from schema to Bruno format
function transformBody(body?: RequestBody): any {
  if (!body) return { mode: 'none' };
  
  if (typeof body === 'object' && 'type' in body && 'data' in body) {
    const rawBody = body as RawBody;
    return {
      mode: rawBody.type,
      [rawBody.type]: rawBody.data
    };
  }
  
  if (Array.isArray(body)) {
    // Could be form data or file body
    return { mode: 'form', formUrlEncoded: body };
  }
  
  return { mode: 'none' };
}

// Transform body from Bruno format to schema
function transformBodyToSchema(body: any): RequestBody {
  if (!body || body.mode === 'none') return null;
  
  switch (body.mode) {
    case 'json':
    case 'text':
    case 'xml':
      return {
        type: body.mode,
        data: body[body.mode] || ''
      } as RawBody;
    case 'form-encoded':
      return (body.formUrlEncoded || []).map((item: any) => ({
        name: item.name || '',
        value: item.value || '',
        enabled: item.enabled !== false
      })) as FormUrlEncodedBody;
    default:
      return null;
  }
}

// Transform scripts from schema to Bruno format
function transformScripts(scripts?: Scripts): any {
  if (!scripts) return {};
  
  // Return Bruno's expected script structure: { req: '...', res: '...' }
  return {
    req: scripts.preRequest || '',
    res: scripts.postResponse || ''
  };
}

// Transform scripts from Bruno format to schema
function transformScriptsToSchema(script: any, tests?: string): Scripts | undefined {
  const scripts: Scripts = {};
  
  // Handle Bruno's script structure: { req: '...', res: '...' }
  if (script?.req) {
    scripts.preRequest = script.req;
  }
  
  if (script?.res) {
    scripts.postResponse = script.res;
  }
  
  // Also handle legacy format for compatibility
  if (script?.['pre-request']) {
    scripts.preRequest = script['pre-request'];
  }
  
  if (script?.['post-response']) {
    scripts.postResponse = script['post-response'];
  }
  
  if (tests) {
    scripts.tests = tests;
  }
  
  return Object.keys(scripts).length > 0 ? scripts : undefined;
}

// Transform variables from schema to Bruno format
function transformVariables(variables: Variable[]): any {
  return {
    req: variables.map(variable => ({
      uid: generateUid(),
      name: variable.name || '',
      value: typeof variable.value === 'string' ? variable.value : (variable.value || ''),
      description: typeof variable.description === 'string' ? variable.description : (variable.description?.content || ''),
      enabled: variable.disabled !== true,
      secret: variable.transient === true,
      default: variable.default || ''
    })),
    res: []
  };
}

// Transform variables from Bruno format to schema
function transformVariablesToSchema(vars: any): Variable[] {
  const variables: Variable[] = [];
  
  if (vars.req && Array.isArray(vars.req)) {
    variables.push(...vars.req.map((variable: any) => {
      const schemaVar: Variable = {
        name: variable.name || '',
        value: variable.value || ''
      };
      
      // Add optional properties only if they have meaningful values
      if (variable.description) {
        schemaVar.description = variable.description;
      }
      
      if (variable.enabled === false) {
        schemaVar.disabled = true;
      }
      
      if (variable.secret === true) {
        schemaVar.transient = true;
        // Add default value for transient variables if available
        if (variable.default) {
          schemaVar.default = variable.default;
        }
      }
      
      return schemaVar;
    }));
  }
  
  return variables;
}

// Transform assertions from schema to Bruno format
function transformAssertions(assertions: Assertion[]): any[] {
  return assertions.map(assertion => ({
    uid: generateUid(),
    name: assertion.expression,
    value: assertion.value,
    enabled: assertion.enabled !== false
  }));
}

// Transform assertions from Bruno format to schema
function transformAssertionsToSchema(assertions: any[]): Assertion[] {
  return assertions.map(assertion => ({
    expression: assertion.name || '',
    operator: 'eq', // Default operator
    value: assertion.value || '',
    enabled: assertion.enabled !== false
  }));
}

// Simple UID generator
function generateUid(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Update a single request in the opencollection
export const updateRequestInOpenCollection = (collectionYaml: string, requestPath: string, requestData: any): string => {
  try {
    const collection = openCollectionToJson(collectionYaml);
    
    // Find and update the request
    updateItemInCollection(collection.items, requestPath, requestData);
    
    return jsonToOpenCollection(collection);
  } catch (error: any) {
    throw new Error(`Failed to update request in opencollection: ${error.message}`);
  }
};

// Add a new request to the opencollection
export const addRequestToOpenCollection = (collectionYaml: string, folderPath: string, requestData: any): string => {
  try {
    const collection = openCollectionToJson(collectionYaml);
    
    // Find the target folder and add request
    addItemToCollection(collection.items, folderPath, requestData);
    
    return jsonToOpenCollection(collection);
  } catch (error: any) {
    throw new Error(`Failed to add request to opencollection: ${error.message}`);
  }
};

// Remove a request from the opencollection
export const removeRequestFromOpenCollection = (collectionYaml: string, requestPath: string): string => {
  try {
    const collection = openCollectionToJson(collectionYaml);
    
    // Find and remove the request
    removeItemFromCollection(collection.items, requestPath);
    
    return jsonToOpenCollection(collection);
  } catch (error: any) {
    throw new Error(`Failed to remove request from opencollection: ${error.message}`);
  }
};

// Helper functions for manipulating collection items
function updateItemInCollection(items: any[], path: string, newData: any): boolean {
  const pathParts = path.split('/').filter(p => p);
  
  for (let item of items) {
    if (item.name === pathParts[0]) {
      if (pathParts.length === 1) {
        // Update this item
        Object.assign(item, newData);
        return true;
      } else if (item.type === 'folder' && item.items) {
        // Continue searching in folder
        return updateItemInCollection(item.items, pathParts.slice(1).join('/'), newData);
      }
    }
  }
  
  return false;
}

function addItemToCollection(items: any[], folderPath: string, newItem: any): void {
  if (!folderPath) {
    // Add to root
    items.push(newItem);
    return;
  }
  
  const pathParts = folderPath.split('/').filter(p => p);
  
  for (let item of items) {
    if (item.name === pathParts[0]) {
      if (pathParts.length === 1) {
        // Add to this folder
        if (!item.items) item.items = [];
        item.items.push(newItem);
        return;
      } else if (item.type === 'folder' && item.items) {
        // Continue searching in folder
        addItemToCollection(item.items, pathParts.slice(1).join('/'), newItem);
        return;
      }
    }
  }
}

function removeItemFromCollection(items: any[], path: string): boolean {
  const pathParts = path.split('/').filter(p => p);
  
  if (pathParts.length === 1) {
    // Remove from this level
    const index = items.findIndex(item => item.name === pathParts[0]);
    if (index !== -1) {
      items.splice(index, 1);
      return true;
    }
  } else {
    // Continue searching in folders
    for (let item of items) {
      if (item.name === pathParts[0] && item.type === 'folder' && item.items) {
        return removeItemFromCollection(item.items, pathParts.slice(1).join('/'));
      }
    }
  }
  
  return false;
} 