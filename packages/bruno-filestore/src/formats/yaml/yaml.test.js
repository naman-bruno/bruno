const {
  yamlRequestToJson,
  jsonRequestToYaml,
  yamlCollectionToJson,
  jsonCollectionToYaml,
  yamlEnvironmentToJson,
  jsonEnvironmentToYaml
} = require('./index');

describe('YAML Format Implementation', () => {
  describe('Request Parsing', () => {
    it('should parse a YAML HTTP request', () => {
      const yamlContent = `
meta:
  name: Test Request
  seq: 1
http:
  method: GET
  url: https://api.example.com
  params:
    query:
      - name: param1
        value: value1
    path: []
  headers:
    - name: Content-Type
      value: application/json
  body:
    type: json
    data: |-
      {
        "key": "value"
      }
  auth:
    type: none
vars:
  pre-request:
    - name: testVar
      value: testValue
scripts:
  pre-request: console.log('pre-request');
`;

      const result = yamlRequestToJson(yamlContent);
      
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('name', 'Test Request');
      expect(result).toHaveProperty('seq', 1);
      expect(result).toHaveProperty('type', 'http');
      expect(result).toHaveProperty('http');
      expect(result.http).toHaveProperty('method', 'GET');
      expect(result.http).toHaveProperty('url', 'https://api.example.com');
      expect(result.vars).toHaveProperty('pre-request');
      expect(result.scripts).toHaveProperty('pre-request', "console.log('pre-request');");
    });

    it('should parse a YAML GraphQL request', () => {
      const yamlContent = `
meta:
  name: GraphQL Test
  seq: 2
graphql:
  method: post
  url: https://graphql.example.com
  headers:
    - name: Content-Type
      value: application/json
  body:
    type: graphql
    query: |-
      query {
        users {
          id
          name
        }
      }
    variables: |-
      {
        "limit": 10
      }
`;

      const result = yamlRequestToJson(yamlContent);
      
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('name', 'GraphQL Test');
      expect(result).toHaveProperty('seq', 2);
      expect(result).toHaveProperty('type', 'graphql');
      expect(result).toHaveProperty('graphql');
      expect(result.graphql).toHaveProperty('method', 'post');
      expect(result.graphql).toHaveProperty('url', 'https://graphql.example.com');
      expect(result.graphql.body).toHaveProperty('type', 'graphql');
      expect(result.graphql.body).toHaveProperty('query');
      expect(result.graphql.body).toHaveProperty('variables');
    });
  });

  describe('Request Stringification', () => {
    it('should convert a request object to YAML', () => {
      const requestObj = {
        meta: {
          name: 'Test Request',
          seq: 1
        },
        name: 'Test Request',
        seq: 1,
        type: 'http',
        http: {
          method: 'GET',
          url: 'https://api.example.com',
          params: {
            query: [
              { name: 'param1', value: 'value1' }
            ],
            path: []
          },
          headers: [
            { name: 'Content-Type', value: 'application/json' }
          ],
          body: {
            type: 'json',
            data: '{\n  "key": "value"\n}'
          },
          auth: {
            type: 'none'
          }
        },
        vars: {
          'pre-request': [
            { name: 'testVar', value: 'testValue' }
          ]
        },
        scripts: {
          'pre-request': "console.log('pre-request');"
        }
      };

      const yamlString = jsonRequestToYaml(requestObj);
      
      expect(yamlString).toContain('meta:');
      expect(yamlString).toContain('name: Test Request');
      expect(yamlString).toContain('seq: 1');
      expect(yamlString).toContain('http:');
      expect(yamlString).toContain('method: GET');
      expect(yamlString).toContain('url: https://api.example.com');
      expect(yamlString).toContain('vars:');
      expect(yamlString).toContain('scripts:');
      
      // Parse it back to verify roundtrip
      const parsedBack = yamlRequestToJson(yamlString);
      expect(parsedBack.name).toEqual(requestObj.name);
      expect(parsedBack.type).toEqual(requestObj.type);
      expect(parsedBack.http.method).toEqual(requestObj.http.method);
      expect(parsedBack.http.url).toEqual(requestObj.http.url);
    });
  });

  describe('Environment Processing', () => {
    it('should parse a YAML environment file', () => {
      const yamlContent = `
name: Development
variables:
  - name: baseUrl
    value: https://dev.example.com
    type: string
  - name: apiKey
    value: dev-api-key
    type: string
    secret: true
`;

      const result = yamlEnvironmentToJson(yamlContent);
      
      expect(result).toHaveProperty('name', 'Development');
      expect(result).toHaveProperty('variables');
      expect(result.variables).toHaveLength(2);
      expect(result.variables[0]).toHaveProperty('name', 'baseUrl');
      expect(result.variables[0]).toHaveProperty('value', 'https://dev.example.com');
      expect(result.variables[1]).toHaveProperty('secret', true);
    });

    it('should convert an environment object to YAML', () => {
      const envObj = {
        name: 'Development',
        variables: [
          {
            name: 'baseUrl',
            value: 'https://dev.example.com',
            type: 'string'
          },
          {
            name: 'apiKey',
            value: 'dev-api-key',
            type: 'string',
            secret: true
          }
        ]
      };

      const yamlString = jsonEnvironmentToYaml(envObj);
      
      expect(yamlString).toContain('name: Development');
      expect(yamlString).toContain('variables:');
      expect(yamlString).toContain('name: baseUrl');
      expect(yamlString).toContain('value: https://dev.example.com');
      expect(yamlString).toContain('secret: true');
      
      // Parse it back to verify roundtrip
      const parsedBack = yamlEnvironmentToJson(yamlString);
      expect(parsedBack.name).toEqual(envObj.name);
      expect(parsedBack.variables.length).toEqual(envObj.variables.length);
    });
  });
}); 