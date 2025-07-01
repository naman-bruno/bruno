const chalk = require('chalk');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
const https = require('https');
const http = require('http');
const { runSingleRequest } = require('../runner/run-single-request');
const { createCollectionJsonFromPathname } = require('../utils/collection');
const { bruToJson } = require('../utils/bru');

const execAsync = promisify(exec);

const command = 'diagnose <url>';
const desc = 'Run comprehensive network diagnosis comparing Bruno native, Bruno-style, Axios CLI, Axios post-response, cURL, and fetch methods';

const builder = async (yargs) => {
  yargs
    .positional('url', {
      describe: 'URL to diagnose',
      type: 'string'
    })
    .option('method', {
      alias: 'm',
      describe: 'HTTP method',
      type: 'string',
      default: 'GET',
      choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
    })
    .option('header', {
      alias: 'H',
      describe: 'Add header (format: "Name: Value")',
      type: 'array',
      default: []
    })
    .option('data', {
      alias: 'd',
      describe: 'Request body data (JSON string)',
      type: 'string'
    })
    .option('timeout', {
      alias: 't',
      describe: 'Request timeout in milliseconds',
      type: 'number',
      default: 30000
    })
    .option('insecure', {
      alias: 'k',
      describe: 'Allow insecure SSL connections',
      type: 'boolean',
      default: false
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Show verbose output',
      type: 'boolean',
      default: false
    })
    .option('output', {
      alias: 'o',
      describe: 'Output file for detailed results (JSON format)',
      type: 'string'
    })
    .example([
      ['$0 diagnose https://api.github.com/users/octocat', 'Basic GET request diagnosis (6 methods)'],
      ['$0 diagnose https://httpbin.org/post -m POST -d \'{"test": "data"}\'', 'POST request with JSON data'],
      ['$0 diagnose https://httpbin.org/headers -H "Authorization: Bearer token123"', 'Request with custom header'],
      ['$0 diagnose https://httpbin.org/get --verbose', 'Verbose output with detailed timing for all methods']
    ]);
};

// Parse headers from command line format
const parseHeaders = (headerArray) => {
  const headers = {};
  headerArray.forEach(header => {
    const colonIndex = header.indexOf(':');
    if (colonIndex > 0) {
      const name = header.substring(0, colonIndex).trim();
      const value = header.substring(colonIndex + 1).trim();
      headers[name] = value;
    }
  });
  return headers;
};

// Create a temporary Bruno request file for native execution
const createBrunoRequestFile = (url, method, headers, data) => {
  let bodySection = '';
  if (data) {
    const jsonString = JSON.stringify(data, null, 2);
    const indentedJson = jsonString.split('\n').map(line => `  ${line}`).join('\n');
    bodySection = `body:json {\n${indentedJson}\n}`;
  }

  const requestContent = `meta {
  name: Network Diagnosis - Bruno Native
  type: http
  seq: 1
}

${method.toLowerCase()} {
  url: ${url}
}

${Object.keys(headers).length > 0 ? 'headers {\n' + Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`).join('\n') + '\n}' : ''}

${bodySection}
`;

  return requestContent;
};

// Create a temporary Bruno request file with Axios in post-response
const createAxiosPostResponseFile = (url, method, headers, data) => {
  let bodySection = '';
  if (data) {
    const jsonString = JSON.stringify(data, null, 2);
    const indentedJson = jsonString.split('\n').map(line => `  ${line}`).join('\n');
    bodySection = `body:json {\n${indentedJson}\n}`;
  }

  const requestContent = `meta {
  name: Network Diagnosis - Axios Post-Response
  type: http
  seq: 1
}

${method.toLowerCase()} {
  url: ${url}
}

${Object.keys(headers).length > 0 ? 'headers {\n' + Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`).join('\n') + '\n}' : ''}

${bodySection}

script:post-response {
  // Axios diagnosis in post-response environment
  const { performance } = require('perf_hooks');
  
  // Store Bruno results
  const brunoResults = {
    success: !!res.status && res.status < 400,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    data: res.body,
    responseTime: res.responseTime,
    timeline: (res.res && res.res.timeline) || [],
    size: res.size || (res.body ? JSON.stringify(res.body).length : 0),
    note: 'Bruno native request execution'
  };
  
  // Enhanced Axios request in post-response
  const runAxiosInPostResponse = async () => {
    try {
      const axios = require('axios');
      const https = require('https');
      const http = require('http');
      
      const axiosStart = performance.now();
      const timing = {};
      const connection = {};
      let certificate = null;
      let timeline = [];
      
      // Create agent for detailed tracking
      const isHttps = '${url}'.startsWith('https://');
      const agentOptions = { 
        keepAlive: false,
        rejectUnauthorized: true
      };
      
      const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
      
      // Hook socket events for timing
      const originalCreateConnection = agent.createConnection;
      agent.createConnection = function(opts, callback) {
        const dnsStart = performance.now();
        timeline.push({ timestamp: dnsStart, event: 'DNS lookup started' });
        
        const socket = originalCreateConnection.call(this, opts, (err, socket) => {
          if (err) return callback(err, socket);
          
          const dnsEnd = performance.now();
          timing.dnsLookup = dnsEnd - dnsStart;
          timeline.push({ 
            timestamp: dnsEnd, 
            event: 'DNS lookup completed',
            duration: timing.dnsLookup + 'ms'
          });
          
          socket.on('connect', () => {
            const tcpEnd = performance.now();
            timing.tcpConnection = tcpEnd - dnsEnd;
            timeline.push({ 
              timestamp: tcpEnd, 
              event: 'TCP connection established',
              duration: timing.tcpConnection + 'ms'
            });
            
            connection.localAddress = socket.localAddress;
            connection.localPort = socket.localPort;
            connection.remoteAddress = socket.remoteAddress;
            connection.remotePort = socket.remotePort;
          });
          
          if (isHttps) {
            socket.on('secureConnect', () => {
              const tlsEnd = performance.now();
              timing.tlsHandshake = tlsEnd - (dnsEnd + timing.tcpConnection);
              timeline.push({ 
                timestamp: tlsEnd, 
                event: 'TLS handshake completed',
                duration: timing.tlsHandshake + 'ms'
              });
              
              const cert = socket.getPeerCertificate();
              if (cert) {
                certificate = {
                  subject: cert.subject,
                  issuer: cert.issuer,
                  validFrom: cert.valid_from,
                  validTo: cert.valid_to,
                  protocol: socket.getProtocol(),
                  cipher: socket.getCipher()
                };
              }
            });
          }
          
          callback(err, socket);
        });
        
        return socket;
      };
      
      const axiosConfig = {
        method: '${method}'.toLowerCase(),
        url: '${url}',
        headers: ${JSON.stringify(headers)},
        timeout: 30000,
        httpAgent: agent,
        httpsAgent: agent,
        validateStatus: () => true
      };
      
      ${data ? `axiosConfig.data = ${JSON.stringify(data)};` : ''}
      
      const response = await axios(axiosConfig);
      const axiosEnd = performance.now();
      const totalTime = axiosEnd - axiosStart;
      
      timeline.push({ 
        timestamp: axiosEnd, 
        event: 'Response received',
        duration: totalTime + 'ms'
      });
      
      return {
        success: response.status < 400,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime: totalTime,
        size: JSON.stringify(response.data).length,
        timeline: timeline,
        timing: {
          total: totalTime,
          ...timing
        },
        connection,
        certificate,
        note: 'Axios execution in post-response script environment'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code,
        note: 'Axios execution failed in post-response script'
      };
    }
  };
  
  // Execute Axios diagnosis
  const axiosResults = await runAxiosInPostResponse();
  
  // Store comprehensive results
  const diagnosisReport = {
    timestamp: new Date().toISOString(),
    url: '${url}',
    method: '${method}',
    brunoNative: brunoResults,
    axiosPostResponse: axiosResults,
    metadata: {
      environment: 'Bruno Post-Response Script',
      userAgent: req.headers['user-agent'] || 'Bruno CLI'
    }
  };
  
  // Replace response with diagnosis report
  res.setBody(JSON.stringify(diagnosisReport, null, 2));
}
`;

  return requestContent;
};

// Run actual Bruno native request
const runBrunoNativeRequest = async (url, method, headers, data, options = {}) => {
  let tempDir;
  let requestFile;
  
  try {
    console.log(chalk.blue('🔄 Running Bruno native request...'));
    
    // Create temporary directory
    tempDir = path.join(process.cwd(), '.bruno-diagnosis-native');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Create bruno.json for the collection
    const brunoConfigPath = path.join(tempDir, 'bruno.json');
    const brunoConfig = {
      version: "1",
      name: "Network Diagnosis",
      type: "collection"
    };
    fs.writeFileSync(brunoConfigPath, JSON.stringify(brunoConfig, null, 2));
    
    // Create Bruno request file
    requestFile = path.join(tempDir, 'diagnosis-native.bru');
    const requestContent = createBrunoRequestFile(url, method, headers, data);
    fs.writeFileSync(requestFile, requestContent);
    
    // Create a minimal collection
    const collection = createCollectionJsonFromPathname(tempDir);
    
    // Read the request file content and parse it
    const requestFileContent = fs.readFileSync(requestFile, 'utf8');
    const item = bruToJson(requestFileContent);
    item.pathname = requestFile;
    
    const brunoStart = Date.now();
    
    const brunoResult = await runSingleRequest(
      item,
      tempDir,
      {}, // runtimeVariables
      {}, // envVariables
      process.env, // processEnvVars
      {}, // brunoConfig
      tempDir, // collectionRoot
      'vm2', // runtime
      collection,
      null // runSingleRequestByPathname
    );
    
    const brunoEnd = Date.now();
    const totalTime = brunoEnd - brunoStart;
    
    if (brunoResult.response && brunoResult.response.data) {
      return {
        success: brunoResult.response.status && brunoResult.response.status < 400,
        status: brunoResult.response.status,
        statusText: brunoResult.response.statusText,
        headers: brunoResult.response.headers,
        data: brunoResult.response.data,
        responseTime: totalTime,
        timeline: brunoResult.response.timeline || [],
        size: brunoResult.response.size || 0,
        timing: { total: totalTime },
        note: 'Bruno native request execution'
      };
    } else {
      return {
        success: false,
        error: brunoResult.error || 'Bruno native request failed',
        note: 'Bruno native execution failed'
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Bruno native request failed',
      code: error.code,
      note: 'Bruno native execution failed'
    };
  } finally {
    // Cleanup
    try {
      if (requestFile && fs.existsSync(requestFile)) {
        fs.unlinkSync(requestFile);
      }
      if (tempDir && fs.existsSync(tempDir)) {
        const brunoConfigPath = path.join(tempDir, 'bruno.json');
        if (fs.existsSync(brunoConfigPath)) {
          fs.unlinkSync(brunoConfigPath);
        }
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
};

// Run Axios in post-response script
const runAxiosPostResponseRequest = async (url, method, headers, data, options = {}) => {
  let tempDir;
  let requestFile;
  
  try {
    console.log(chalk.blue('🔄 Running Axios in post-response script...'));
    
    // Create temporary directory
    tempDir = path.join(process.cwd(), '.bruno-diagnosis-axios-post');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Create bruno.json for the collection
    const brunoConfigPath = path.join(tempDir, 'bruno.json');
    const brunoConfig = {
      version: "1",
      name: "Network Diagnosis Axios Post",
      type: "collection"
    };
    fs.writeFileSync(brunoConfigPath, JSON.stringify(brunoConfig, null, 2));
    
    // Create Bruno request file with Axios post-response
    requestFile = path.join(tempDir, 'diagnosis-axios-post.bru');
    const requestContent = createAxiosPostResponseFile(url, method, headers, data);
    fs.writeFileSync(requestFile, requestContent);
    
    // Create a minimal collection
    const collection = createCollectionJsonFromPathname(tempDir);
    
    // Read the request file content and parse it
    const requestFileContent = fs.readFileSync(requestFile, 'utf8');
    const item = bruToJson(requestFileContent);
    item.pathname = requestFile;
    
    const axiosPostStart = Date.now();
    
    const brunoResult = await runSingleRequest(
      item,
      tempDir,
      {}, // runtimeVariables
      {}, // envVariables
      process.env, // processEnvVars
      {}, // brunoConfig
      tempDir, // collectionRoot
      'vm2', // runtime
      collection,
      null // runSingleRequestByPathname
    );
    
    const axiosPostEnd = Date.now();
    const totalTime = axiosPostEnd - axiosPostStart;
    
    if (brunoResult.response && brunoResult.response.data) {
      try {
        const diagnosisData = JSON.parse(brunoResult.response.data);
        const axiosResults = diagnosisData.axiosPostResponse;
        
        if (axiosResults) {
          return {
            ...axiosResults,
            totalExecutionTime: totalTime // Include overall execution time
          };
        } else {
          return {
            success: false,
            error: 'No Axios results found in post-response',
            note: 'Axios post-response execution failed'
          };
        }
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse post-response results: ' + parseError.message,
          note: 'Axios post-response parsing failed'
        };
      }
    } else {
      return {
        success: false,
        error: brunoResult.error || 'Axios post-response request failed',
        note: 'Axios post-response execution failed'
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Axios post-response request failed',
      code: error.code,
      note: 'Axios post-response execution failed'
    };
  } finally {
    // Cleanup
    try {
      if (requestFile && fs.existsSync(requestFile)) {
        fs.unlinkSync(requestFile);
      }
      if (tempDir && fs.existsSync(tempDir)) {
        const brunoConfigPath = path.join(tempDir, 'bruno.json');
        if (fs.existsSync(brunoConfigPath)) {
          fs.unlinkSync(brunoConfigPath);
        }
        fs.rmdirSync(tempDir);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
};

// Run Bruno-style diagnosis (using axios with Bruno-like agent in CLI)
const runBrunoStyleDiagnosis = async (url, method, headers, data, options = {}) => {
  try {
    console.log(chalk.blue('🔄 Running Bruno-style diagnosis...'));
    
    const brunoStart = Date.now();
    const timing = {};
    const connection = {};
    let certificate = null;
    let timeline = [];
    
    // Create agent similar to Bruno's approach
    const isHttps = url.startsWith('https://');
    const agentOptions = { 
      keepAlive: false,
      rejectUnauthorized: !options.insecure
    };
    
    const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
    
    // Hook socket events for detailed timing (Bruno-style)
    const originalCreateConnection = agent.createConnection;
    agent.createConnection = function(opts, callback) {
      const dnsStart = Date.now();
      timeline.push({ timestamp: dnsStart, event: 'DNS lookup started' });
      
      const socket = originalCreateConnection.call(this, opts, (err, socket) => {
        if (err) return callback(err, socket);
        
        const dnsEnd = Date.now();
        timing.dnsLookup = dnsEnd - dnsStart;
        timeline.push({ 
          timestamp: dnsEnd, 
          event: 'DNS lookup completed',
          duration: timing.dnsLookup + 'ms'
        });
        
        socket.on('connect', () => {
          const tcpEnd = Date.now();
          timing.tcpConnection = tcpEnd - dnsEnd;
          timeline.push({ 
            timestamp: tcpEnd, 
            event: 'TCP connection established',
            duration: timing.tcpConnection + 'ms'
          });
          
          connection.localAddress = socket.localAddress;
          connection.localPort = socket.localPort;
          connection.remoteAddress = socket.remoteAddress;
          connection.remotePort = socket.remotePort;
        });
        
        if (isHttps) {
          socket.on('secureConnect', () => {
            const tlsEnd = Date.now();
            timing.tlsHandshake = tlsEnd - (dnsEnd + timing.tcpConnection);
            timeline.push({ 
              timestamp: tlsEnd, 
              event: 'TLS handshake completed',
              duration: timing.tlsHandshake + 'ms'
            });
            
            const cert = socket.getPeerCertificate();
            if (cert) {
              certificate = {
                subject: cert.subject,
                issuer: cert.issuer,
                validFrom: cert.valid_from,
                validTo: cert.valid_to,
                protocol: socket.getProtocol(),
                cipher: socket.getCipher()
              };
            }
          });
        }
        
        callback(err, socket);
      });
      
      return socket;
    };
    
    const requestConfig = {
      method: method.toLowerCase(),
      url: url,
      headers: headers,
      timeout: options.timeout || 30000,
      httpAgent: agent,
      httpsAgent: agent,
      validateStatus: () => true
    };
    
    if (data) {
      requestConfig.data = data;
    }
    
    const response = await axios(requestConfig);
    const brunoEnd = Date.now();
    const totalTime = brunoEnd - brunoStart;
    
    timeline.push({ 
      timestamp: brunoEnd, 
      event: 'Response received',
      duration: totalTime + 'ms'
    });
    
    return {
      success: response.status < 400,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime: totalTime,
      size: JSON.stringify(response.data).length,
      timeline: timeline,
      timing: {
        total: totalTime,
        ...timing
      },
      connection,
      certificate,
      note: 'Bruno-style execution in CLI environment'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      note: 'Bruno-style execution failed'
    };
  }
};

// Run fetch diagnosis directly in CLI
const runFetchDiagnosis = async (url, method, headers, data, options = {}) => {
  try {
    console.log(chalk.blue('🔄 Running fetch diagnosis...'));
    
    // Try to require node-fetch
    let fetch;
    try {
      fetch = require('node-fetch');
    } catch (e) {
      // Fallback to global fetch if node-fetch is not available
      if (typeof global.fetch === 'function') {
        fetch = global.fetch;
      } else {
        throw new Error('fetch is not available');
      }
    }
    
    const fetchStart = Date.now();
    
    const fetchConfig = {
      method: method,
      headers: headers,
      timeout: options.timeout || 30000
    };
    
    if (data) {
      fetchConfig.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, fetchConfig);
    const responseData = await response.text();
    const fetchEnd = Date.now();
    const totalTime = fetchEnd - fetchStart;
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers ? Object.fromEntries(response.headers.entries()) : {},
      data: responseData,
      responseTime: totalTime,
      size: responseData.length,
      timing: { total: totalTime },
      note: 'Node.js fetch execution in CLI'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      note: 'Fetch execution failed'
    };
  }
};

// Run Axios diagnosis directly in CLI
const runAxiosDiagnosis = async (url, method, headers, data, options = {}) => {
  try {
    const axios = require('axios');
    const https = require('https');
    const http = require('http');
    
    console.log(chalk.blue('🔄 Running Axios diagnosis...'));
    
    const axiosStart = Date.now();
    const timing = {};
    const connection = {};
    let certificate = null;
    
    // Create agent for detailed tracking
    const isHttps = url.startsWith('https://');
    const agentOptions = { 
      keepAlive: false,
      rejectUnauthorized: !options.insecure
    };
    
    const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
    
    // Hook socket events for timing
    const originalCreateConnection = agent.createConnection;
    agent.createConnection = function(opts, callback) {
      const dnsStart = Date.now();
      
      const socket = originalCreateConnection.call(this, opts, (err, socket) => {
        if (err) return callback(err, socket);
        
        const dnsEnd = Date.now();
        timing.dnsLookup = dnsEnd - dnsStart;
        
        socket.on('connect', () => {
          const tcpEnd = Date.now();
          timing.tcpConnection = tcpEnd - dnsEnd;
          
          connection.localAddress = socket.localAddress;
          connection.localPort = socket.localPort;
          connection.remoteAddress = socket.remoteAddress;
          connection.remotePort = socket.remotePort;
        });
        
        if (isHttps) {
          socket.on('secureConnect', () => {
            const tlsEnd = Date.now();
            timing.tlsHandshake = tlsEnd - (dnsEnd + timing.tcpConnection);
            
            const cert = socket.getPeerCertificate();
            if (cert) {
              certificate = {
                subject: cert.subject,
                issuer: cert.issuer,
                validFrom: cert.valid_from,
                validTo: cert.valid_to,
                protocol: socket.getProtocol(),
                cipher: socket.getCipher()
              };
            }
          });
        }
        
        callback(err, socket);
      });
      
      return socket;
    };
    
    const axiosConfig = {
      method: method.toLowerCase(),
      url: url,
      headers: headers,
      timeout: options.timeout || 30000,
      httpAgent: agent,
      httpsAgent: agent,
      validateStatus: () => true
    };
    
    if (data) {
      axiosConfig.data = data;
    }
    
    const response = await axios(axiosConfig);
    const axiosEnd = Date.now();
    const totalTime = axiosEnd - axiosStart;
    
    return {
      success: response.status < 400,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      responseTime: totalTime,
      size: JSON.stringify(response.data).length,
      timing: {
        total: totalTime,
        ...timing
      },
      connection,
      certificate,
      note: 'Axios execution in CLI environment'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      note: 'Axios execution failed'
    };
  }
};

// Run cURL diagnosis directly in CLI
const runCurlDiagnosis = async (url, method, headers, data, options = {}) => {
  try {
    console.log(chalk.blue('🖥️  Running cURL diagnosis...'));
    
    // Build cURL command
    let curlCommand = `curl -v -s -S --location --max-redirs 5`;
    
    if (method !== 'GET') {
      curlCommand += ` -X ${method}`;
    }
    
    // Add headers
    Object.entries(headers).forEach(([name, value]) => {
      curlCommand += ` -H "${name}: ${value}"`;
    });
    
    // Add data
    if (data) {
      curlCommand += ` -d '${JSON.stringify(data)}'`;
    }
    
    // Add timing output with single -w flag
    const timingFormat = '\\n=== CURL_TIMING ===\\ntime_namelookup:%{time_namelookup}\\ntime_connect:%{time_connect}\\ntime_appconnect:%{time_appconnect}\\ntime_starttransfer:%{time_starttransfer}\\ntime_total:%{time_total}\\nhttp_code:%{http_code}\\nremote_ip:%{remote_ip}\\n';
    curlCommand += ` -w '${timingFormat}'`;
    
    if (options.insecure) {
      curlCommand += ` -k`;
    }
    
    curlCommand += ` "${url}"`;
    
    const curlStart = Date.now();
    
    if (options.verbose) {
      console.log(chalk.dim(`Executing: ${curlCommand}`));
    }
    
    const { stdout, stderr } = await execAsync(curlCommand, { 
      timeout: options.timeout || 30000,
      maxBuffer: 1024 * 1024 
    });
    const curlEnd = Date.now();
    const totalTime = curlEnd - curlStart;
    
    // Parse timing data
    const timing = {};
    let responseBody = stdout;
    let httpStatus = null;
    
    const timingSection = stdout.split('=== CURL_TIMING ===')[1];
    if (timingSection) {
      timingSection.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          const trimmedKey = key.trim();
          const trimmedValue = value.trim();
          if (trimmedKey && trimmedValue) {
            timing[trimmedKey] = parseFloat(trimmedValue);
          }
        }
      });
      
      // Get response body (before timing section)
      responseBody = stdout.split('=== CURL_TIMING ===')[0];
      httpStatus = timing.http_code || null;
    } else {
      // Fallback: try to extract status from stderr
      const statusMatch = stderr.match(/< HTTP\/[\d\.]+\s+(\d+)/);
      if (statusMatch) {
        httpStatus = parseInt(statusMatch[1]);
      }
    }
    
    return {
      success: httpStatus && httpStatus < 400,
      status: httpStatus,
      statusText: httpStatus ? 'OK' : 'Unknown',
      data: responseBody,
      responseTime: totalTime,
      size: responseBody.length,
      command: curlCommand,
      verbose: {
        output: stderr.split('\n').filter(line => line.trim()),
        timing: timing
      },
      timing: {
        total: totalTime,
        dnsLookup: timing.time_namelookup ? timing.time_namelookup * 1000 : null,
        tcpConnection: timing.time_connect ? timing.time_connect * 1000 : null,
        tlsHandshake: timing.time_appconnect && timing.time_connect ? 
          (timing.time_appconnect - timing.time_connect) * 1000 : null,
        firstByte: timing.time_starttransfer ? timing.time_starttransfer * 1000 : null
      },
      connection: {
        remoteIp: timing.remote_ip
      },
      note: 'System cURL command execution'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message || 'cURL execution failed',
      stderr: error.stderr || '',
      code: error.code,
      note: 'cURL execution failed'
    };
  }
};

// Print results summary
const printSummary = (results, verbose = false) => {
  console.log('\n' + chalk.bold.green('='.repeat(60)));
  console.log(chalk.bold.green('🎯 NETWORK DIAGNOSIS SUMMARY'));
  console.log(chalk.bold.green('='.repeat(60)));
  
  const methods = [
    { key: 'brunoNative', name: 'BRUNO NATIVE' },
    { key: 'brunoStyle', name: 'BRUNO STYLE' },
    { key: 'axiosCli', name: 'AXIOS CLI' },
    { key: 'axiosPost', name: 'AXIOS POST-RESPONSE' },
    { key: 'curl', name: 'CURL' },
    { key: 'fetch', name: 'FETCH' }
  ];
  let successCount = 0;
  
  methods.forEach(methodInfo => {
    const result = results[methodInfo.key];
    if (result && result.success) {
      successCount++;
      console.log(chalk.green(`✅ ${methodInfo.name}: ${result.status} (${result.responseTime}ms)`));
      
      if (verbose && result.timing) {
        if (result.timing.dnsLookup) console.log(`   ${chalk.dim('DNS:')} ${result.timing.dnsLookup}ms`);
        if (result.timing.tcpConnection) console.log(`   ${chalk.dim('TCP:')} ${result.timing.tcpConnection}ms`);
        if (result.timing.tlsHandshake) console.log(`   ${chalk.dim('TLS:')} ${result.timing.tlsHandshake}ms`);
      }
      
      if (verbose && (methodInfo.key === 'brunoNative' || methodInfo.key === 'brunoStyle') && result.timeline && result.timeline.length > 0) {
        console.log(`   ${chalk.dim('Timeline:')} ${result.timeline.length} events`);
      }
      
      if (verbose && result.note) {
        console.log(`   ${chalk.dim('Note:')} ${result.note}`);
      }
    } else {
      console.log(chalk.red(`❌ ${methodInfo.name}: ${result?.error || 'Unknown error'}`));
      if (verbose && result?.error) {
        console.log(chalk.red(`     Error: ${result.error}`));
      }
      if (verbose && result?.code) {
        console.log(chalk.red(`     Code: ${result.code}`));
      }
    }
  });
  
  console.log('\n' + chalk.bold(`📊 Success Rate: ${successCount}/${methods.length}`));
  
  // Generate recommendations
  const recommendations = [];
  if (successCount === methods.length) {
    console.log(chalk.green('🎉 All methods succeeded - excellent connectivity!'));
  } else if (successCount === 0) {
    console.log(chalk.red('⚠️  All methods failed - check URL and connectivity'));
    recommendations.push('Verify URL is correct and accessible');
    recommendations.push('Check network connectivity and firewall settings');
  } else {
    console.log(chalk.yellow('⚠️  Mixed results - check individual method details'));
    
    // Bruno vs other methods
    if (results.brunoNative?.success && !results.axiosCli?.success) {
      recommendations.push('Bruno native succeeded but Axios CLI failed - possible CLI environment issue');
    }
    if (results.axiosCli?.success && !results.axiosPost?.success) {
      recommendations.push('Axios CLI succeeded but Axios post-response failed - Bruno script environment issue');
    }
    if (results.curl?.success && !results.fetch?.success) {
      recommendations.push('cURL succeeded but fetch failed - possible Node.js/TLS configuration issue');
    }
    if (!results.brunoNative?.success && results.brunoStyle?.success) {
      recommendations.push('Bruno-style succeeded but Bruno native failed - check Bruno internal configuration');
    }
    if (results.brunoNative?.success && results.brunoStyle?.success && !results.axiosCli?.success) {
      recommendations.push('Bruno methods succeeded but CLI Axios failed - authentication or header issue');
    }
    
    // Environment-specific issues
    const cliMethods = [results.brunoStyle, results.axiosCli, results.fetch];
    const postResponseMethods = [results.axiosPost];
    const systemMethods = [results.curl];
    
    const cliSuccess = cliMethods.filter(r => r?.success).length;
    const postSuccess = postResponseMethods.filter(r => r?.success).length;
    const systemSuccess = systemMethods.filter(r => r?.success).length;
    
    if (systemSuccess > 0 && cliSuccess === 0) {
      recommendations.push('System tools work but Node.js methods fail - check Node.js networking configuration');
    }
    if (postSuccess > 0 && cliSuccess === 0) {
      recommendations.push('Post-response scripts work but CLI methods fail - possible CLI environment restrictions');
    }
  }
  
  if (recommendations.length > 0) {
    console.log('\n' + chalk.bold.yellow('💡 RECOMMENDATIONS:'));
    recommendations.forEach((rec, i) => {
      console.log(chalk.yellow(`   ${i + 1}. ${rec}`));
    });
  }
};

const handler = async (argv) => {
  const { url, method, header, data, timeout, insecure, verbose, output } = argv;
  
  console.log(chalk.bold.blue('🚀 Starting Network Diagnosis'));
  console.log(chalk.dim(`URL: ${url}`));
  console.log(chalk.dim(`Method: ${method}`));
  
  const headers = parseHeaders(header);
  const requestData = data ? JSON.parse(data) : null;
  const options = { timeout, insecure, verbose };
  
  const results = {};
  
  try {
    // Run all diagnosis methods sequentially for better error debugging
    console.log(chalk.dim('Starting diagnosis methods...'));
    
    // 1. Bruno native request
    results.brunoNative = await runBrunoNativeRequest(url, method, headers, requestData, options);
    if (!results.brunoNative.success && verbose) {
      console.log(chalk.red(`Bruno Native failed: ${results.brunoNative.error}`));
    }
    
    // 2. Bruno-style (axios with Bruno-like agent in CLI)
    results.brunoStyle = await runBrunoStyleDiagnosis(url, method, headers, requestData, options);
    if (!results.brunoStyle.success && verbose) {
      console.log(chalk.red(`Bruno Style failed: ${results.brunoStyle.error}`));
    }
    
    // 3. Axios in CLI environment
    results.axiosCli = await runAxiosDiagnosis(url, method, headers, requestData, options);
    if (!results.axiosCli.success && verbose) {
      console.log(chalk.red(`Axios CLI failed: ${results.axiosCli.error}`));
    }
    
    // 4. Axios in post-response script
    results.axiosPost = await runAxiosPostResponseRequest(url, method, headers, requestData, options);
    if (!results.axiosPost.success && verbose) {
      console.log(chalk.red(`Axios Post-Response failed: ${results.axiosPost.error}`));
    }
    
    // 5. cURL system command
    results.curl = await runCurlDiagnosis(url, method, headers, requestData, options);
    if (!results.curl.success && verbose) {
      console.log(chalk.red(`cURL failed: ${results.curl.error}`));
    }
    
    // 6. Fetch in CLI
    results.fetch = await runFetchDiagnosis(url, method, headers, requestData, options);
    if (!results.fetch.success && verbose) {
      console.log(chalk.red(`Fetch failed: ${results.fetch.error}`));
    }
    
    // Print summary
    printSummary(results, verbose);
    
    // Save detailed results if requested
    if (output) {
      const detailedResults = {
        timestamp: new Date().toISOString(),
        request: { url, method, headers, data: requestData },
        results,
        metadata: {
          brunoCliVersion: require('../../package.json').version,
          nodeVersion: process.version,
          platform: process.platform
        }
      };
      
      fs.writeFileSync(output, JSON.stringify(detailedResults, null, 2));
      console.log(chalk.green(`\n📁 Detailed results saved to: ${output}`));
    }
    
    console.log(chalk.bold.blue('\n✅ Network diagnosis complete!'));
    
  } catch (error) {
    console.error(chalk.red('❌ Diagnosis failed:'), error.message);
    if (verbose) {
      console.error(chalk.red('Stack trace:'), error.stack);
    }
    process.exit(1);
  }
};

module.exports = {
  command,
  desc,
  builder,
  handler
}; 