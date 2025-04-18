import each from 'lodash/each';
import get from 'lodash/get';
import { validateSchema, transformItemsInCollection, hydrateSeqInCollection, uuid } from '../common';

const parseGraphQL = (text) => {
  try {
    const graphql = JSON.parse(text);

    return {
      query: graphql.query,
      variables: JSON.stringify(graphql.variables, null, 2)
    };
  } catch (e) {
    return {
      query: '',
      variables: ''
    };
  }
};

const addSuffixToDuplicateName = (item, index, allItems) => {
  // Check if the request name already exist and if so add a number suffix
  const nameSuffix = allItems.reduce((nameSuffix, otherItem, otherIndex) => {
    if (otherItem.name === item.name && otherIndex < index) {
      nameSuffix++;
    }
    return nameSuffix;
  }, 0);
  return nameSuffix !== 0 ? `${item.name}_${nameSuffix}` : item.name;
};

const regexVariable = new RegExp('{{.*?}}', 'g');

const normalizeVariables = (value) => {
  value = value || '';
  const variables = value.match(regexVariable) || [];
  each(variables, (variable) => {
    value = value.replace(variable, variable.replace('_.', '').replaceAll(' ', ''));
  });
  return value;
};

const transformInsomniaRequestItem = (request, index, allRequests) => {
  const name = addSuffixToDuplicateName(request, index, allRequests);

  const brunoRequestItem = {
    uid: uuid(),
    name,
    type: 'http-request',
    request: {
      url: request.url,
      method: request.method,
      auth: {
        mode: 'none',
        basic: null,
        bearer: null,
        digest: null
      },
      headers: [],
      params: [],
      body: {
        mode: 'none',
        json: null,
        text: null,
        xml: null,
        formUrlEncoded: [],
        multipartForm: []
      }
    }
  };

  each(request.headers, (header) => {
    brunoRequestItem.request.headers.push({
      uid: uuid(),
      name: header.name,
      value: header.value,
      description: header.description,
      enabled: !header.disabled
    });
  });

  each(request.parameters, (param) => {
    brunoRequestItem.request.params.push({
      uid: uuid(),
      name: param.name,
      value: param.value,
      description: param.description,
      type: 'query',
      enabled: !param.disabled
    });
  });

  each(request.pathParameters, (param) => {
    brunoRequestItem.request.params.push({
      uid: uuid(),
      name: param.name,
      value: param.value,
      description: '',
      type: 'path',
      enabled: true
    });
  });

  const authType = get(request, 'authentication.type', '');

  if (authType === 'basic') {
    brunoRequestItem.request.auth.mode = 'basic';
    brunoRequestItem.request.auth.basic = {
      username: normalizeVariables(get(request, 'authentication.username', '')),
      password: normalizeVariables(get(request, 'authentication.password', ''))
    };
  } else if (authType === 'bearer') {
    brunoRequestItem.request.auth.mode = 'bearer';
    brunoRequestItem.request.auth.bearer = {
      token: normalizeVariables(get(request, 'authentication.token', ''))
    };
  }

  const mimeType = get(request, 'body.mimeType', '').split(';')[0];

  if (mimeType === 'application/json') {
    brunoRequestItem.request.body.mode = 'json';
    brunoRequestItem.request.body.json = request.body.text;
  } else if (mimeType === 'application/x-www-form-urlencoded') {
    brunoRequestItem.request.body.mode = 'formUrlEncoded';
    each(request.body.params, (param) => {
      brunoRequestItem.request.body.formUrlEncoded.push({
        uid: uuid(),
        name: param.name,
        value: param.value,
        description: param.description,
        enabled: !param.disabled
      });
    });
  } else if (mimeType === 'multipart/form-data') {
    brunoRequestItem.request.body.mode = 'multipartForm';
    each(request.body.params, (param) => {
      brunoRequestItem.request.body.multipartForm.push({
        uid: uuid(),
        type: 'text',
        name: param.name,
        value: param.value,
        description: param.description,
        enabled: !param.disabled
      });
    });
  } else if (mimeType === 'text/plain') {
    brunoRequestItem.request.body.mode = 'text';
    brunoRequestItem.request.body.text = request.body.text;
  } else if (mimeType === 'text/xml' || mimeType === 'application/xml') {
    brunoRequestItem.request.body.mode = 'xml';
    brunoRequestItem.request.body.xml = request.body.text;
  } else if (mimeType === 'application/graphql') {
    brunoRequestItem.type = 'graphql-request';
    brunoRequestItem.request.body.mode = 'graphql';
    brunoRequestItem.request.body.graphql = parseGraphQL(request.body.text);
  }

  return brunoRequestItem;
};

const parseInsomniaCollection = (_insomniaCollection) => {
  const brunoCollection = {
    name: '',
    uid: uuid(),
    version: '1',
    items: [],
    environments: []
  };

  try {
    const insomniaExport = _insomniaCollection;
    const insomniaResources = get(insomniaExport, 'resources', []);
    const insomniaCollection = insomniaResources.find((resource) => resource._type === 'workspace');

    if (!insomniaCollection) {
      throw new Error('Collection not found inside Insomnia export');
    }

    brunoCollection.name = insomniaCollection.name;

    const requestsAndFolders =
      insomniaResources.filter((resource) => resource._type === 'request' || resource._type === 'request_group') ||
      [];

    function createFolderStructure(resources, parentId = null) {
      const requestGroups =
        resources.filter((resource) => resource._type === 'request_group' && resource.parentId === parentId) || [];
      const requests = resources.filter((resource) => resource._type === 'request' && resource.parentId === parentId);

      const folders = requestGroups.map((folder, index, allFolder) => {
        const name = addSuffixToDuplicateName(folder, index, allFolder);
        const requests = resources.filter(
          (resource) => resource._type === 'request' && resource.parentId === folder._id
        );

        return {
          uid: uuid(),
          name,
          type: 'folder',
          items: createFolderStructure(resources, folder._id).concat(requests.map(transformInsomniaRequestItem))
        };
      });

      return folders.concat(requests.map(transformInsomniaRequestItem));
    }

    brunoCollection.items = createFolderStructure(requestsAndFolders, insomniaCollection._id);
    return brunoCollection;
  } catch (err) {
    throw new Error('An error occurred while parsing the Insomnia collection');
  }
};

export const insomniaToBruno = (insomniaCollection) => {
  try {
    const collection = parseInsomniaCollection(insomniaCollection);
    const transformedCollection = transformItemsInCollection(collection);
    const hydratedCollection = hydrateSeqInCollection(transformedCollection);
    const validatedCollection = validateSchema(hydratedCollection);
    return validatedCollection;
  } catch (err) {
    console.error(err);
    throw new Error('Import collection failed');
  }
};

export default insomniaToBruno;
