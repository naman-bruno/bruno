const crypto = require('crypto');
const { URL } = require('node:url');

/**
 * Akamai EdgeGrid Authentication Helper
 * Based on the Akamai EdgeGrid authentication specification
 * https://techdocs.akamai.com/developer/docs/authenticate-with-edgegrid
 */

function isStrPresent(str) {
  return str && str.trim() !== '' && str.trim() !== 'undefined';
}

/**
 * Generate a timestamp in ISO 8601 basic format
 * @returns {string} Timestamp in format: YYYYMMDDTHHmmss+0000
 */
function makeEdgeGridTimestamp() {
  return new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
}

/**
 * Generate a random nonce (UUID v4)
 * @returns {string} UUID v4 string
 */
function makeEdgeGridNonce() {
  return crypto.randomUUID();
}

/**
 * Create HMAC-SHA256 signature
 * @param {string} data - Data to sign
 * @param {string} key - Secret key for signing
 * @returns {Buffer} HMAC signature
 */
function hmacSha256(data, key) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

/**
 * Create base64-encoded SHA256 hash
 * @param {string} data - Data to hash
 * @returns {string} Base64-encoded hash
 */
function base64Sha256(data) {
  return crypto.createHash('sha256').update(data).digest('base64');
}

/**
 * Create signing key from client secret and timestamp
 * @param {string} clientSecret - Client secret
 * @param {string} timestamp - EdgeGrid timestamp
 * @returns {Buffer} Signing key
 */
function makeSigningKey(clientSecret, timestamp) {
  return hmacSha256(timestamp, clientSecret);
}

/**
 * Create the data to be signed
 * @param {Object} params
 * @param {string} params.method - HTTP method
 * @param {string} params.url - Request URL
 * @param {string} params.headers - Headers to sign
 * @param {string} params.body - Request body
 * @param {number} params.maxBodySize - Maximum body size to sign
 * @returns {string} Data string to be signed
 */
function makeDataToSign({ method, url, headers, body, maxBodySize = 131072 }) {
  const parsedUrl = new URL(url);

  // Get relative path with query string
  const relativePath = parsedUrl.pathname + parsedUrl.search;

  // Construct the canonical request (tab-separated)
  let dataToSign = [
    method.toUpperCase(),
    parsedUrl.protocol.replace(':', ''),
    parsedUrl.host,
    relativePath
  ].join('\t') + '\t';

  // Add canonicalized headers if specified
  if (headers && headers.trim().length > 0) {
    dataToSign += headers.trim() + '\t';
  } else {
    dataToSign += '\t';
  }

  // Add body hash if present and within size limit
  if (body && body.length > 0) {
    const bodyToSign = body.length > maxBodySize ? body.substring(0, maxBodySize) : body;
    dataToSign += base64Sha256(bodyToSign);
  }

  return dataToSign;
}

/**
 * Create the authorization header value
 * @param {Object} params
 * @param {string} params.clientToken - Client token
 * @param {string} params.accessToken - Access token
 * @param {string} params.timestamp - EdgeGrid timestamp
 * @param {string} params.nonce - Nonce value
 * @param {string} params.signature - Request signature
 * @returns {string} Authorization header value
 */
function makeAuthorizationHeader({ clientToken, accessToken, timestamp, nonce, signature }) {
  return `EG1-HMAC-SHA256 client_token=${clientToken};access_token=${accessToken};timestamp=${timestamp};nonce=${nonce};signature=${signature}`;
}

/**
 * Sign an EdgeGrid request
 * @param {Object} config - EdgeGrid configuration
 * @param {string} config.accessToken - Access token
 * @param {string} config.clientToken - Client token
 * @param {string} config.clientSecret - Client secret
 * @param {string} [config.baseURL] - Base URL for the API endpoint
 * @param {string} [config.nonce] - Optional nonce override
 * @param {string} [config.timestamp] - Optional timestamp override
 * @param {string} [config.headersToSign] - Headers to include in signature
 * @param {number} [config.maxBodySize=131072] - Maximum body size to sign (default 128KB)
 * @param {Object} request - Axios request config
 * @returns {string} Authorization header value
 */
export function signEdgeGridRequest(config, request) {
  const { accessToken, clientToken, clientSecret, baseURL, headersToSign } = config;
  // Ensure maxBodySize is a number, default to 128KB if not provided or invalid
  const maxBodySize = config.maxBodySize ? parseInt(config.maxBodySize, 10) : 131072;

  // Validate required fields
  if (!isStrPresent(accessToken)) {
    throw new Error('EdgeGrid: accessToken is required');
  }
  if (!isStrPresent(clientToken)) {
    throw new Error('EdgeGrid: clientToken is required');
  }
  if (!isStrPresent(clientSecret)) {
    throw new Error('EdgeGrid: clientSecret is required');
  }

  // Generate or use provided nonce and timestamp
  const nonce = config.nonce && isStrPresent(config.nonce) ? config.nonce : makeEdgeGridNonce();

  let timestamp;
  if (config.timestamp && isStrPresent(config.timestamp)) {
    // Validate timestamp format: YYYYMMDDTHHmmss+0000
    const timestampPattern = /^\d{8}T\d{6}\+\d{4}$/;
    if (!timestampPattern.test(config.timestamp)) {
      throw new Error(`EdgeGrid: Invalid timestamp format. Expected YYYYMMDDTHHmmss+0000, got: ${config.timestamp}`);
    }
    timestamp = config.timestamp;
  } else {
    timestamp = makeEdgeGridTimestamp();
  }

  // Create signing key
  const signingKey = makeSigningKey(clientSecret, timestamp);

  // Prepare request body
  let bodyString = '';
  if (request.data) {
    if (typeof request.data === 'string') {
      bodyString = request.data;
    } else if (Buffer.isBuffer(request.data)) {
      // For binary data, convert to string (EdgeGrid will hash the raw bytes)
      bodyString = request.data.toString('binary');
    } else if (typeof request.data === 'object') {
      // For objects, serialize to compact JSON
      bodyString = JSON.stringify(request.data);
    }
  }

  // Determine URL to sign - use baseURL if provided, otherwise use request URL
  let urlToSign = request.url;
  if (baseURL && isStrPresent(baseURL)) {
    // Parse the request URL to get the path and query
    const requestUrl = new URL(request.url);
    const baseParsed = new URL(baseURL);
    // Construct URL using baseURL's protocol and host with request's path
    urlToSign = `${baseParsed.protocol}//${baseParsed.host}${requestUrl.pathname}${requestUrl.search}`;
  }

  // Create data to sign
  const dataToSign = makeDataToSign({
    method: request.method,
    url: urlToSign,
    headers: headersToSign || '',
    body: bodyString,
    maxBodySize
  });

  // Create the auth data string (without the EG1-HMAC-SHA256 prefix)
  const authData = [
    `client_token=${clientToken}`,
    `access_token=${accessToken}`,
    `timestamp=${timestamp}`,
    `nonce=${nonce}`
  ].join(';') + ';';

  // Sign the auth data + data to sign
  const signatureData = authData + dataToSign;
  const signature = hmacSha256(signatureData, signingKey).toString('base64');

  // Return complete authorization header
  return makeAuthorizationHeader({
    clientToken,
    accessToken,
    timestamp,
    nonce,
    signature
  });
}

/**
 * Add EdgeGrid interceptor to axios instance
 * @param {Object} axiosInstance - Axios instance
 * @param {Object} request - Request object with edgeGridConfig
 */
export function addEdgeGridInterceptor(axiosInstance, request) {
  const { edgeGridConfig } = request;

  if (!edgeGridConfig) {
    return;
  }

  // Add request interceptor to sign requests
  axiosInstance.interceptors.request.use((config) => {
    try {
      const authHeader = signEdgeGridRequest(edgeGridConfig, config);
      config.headers['Authorization'] = authHeader;
      return config;
    } catch (error) {
      // Enhance error message with more context
      const enhancedError = new Error(`EdgeGrid authentication failed: ${error.message}\n`
        + `Make sure access_token, client_token, and client_secret are configured correctly.`);
      enhancedError.originalError = error;
      enhancedError.config = config;
      console.error('EdgeGrid signing error:', enhancedError.message);
      return Promise.reject(enhancedError);
    }
  },
  (error) => {
    return Promise.reject(error);
  });
}
