const path = require("path");
const { detectFormatFromContent } = require("../utils/format-detector");

/**
 * Get size of data in MB
 * @param {string|Object} data - Data to measure
 * @returns {number} Size in MB
 */
const getSize = (data) => {
  const bytes = typeof data === 'string' 
    ? Buffer.byteLength(data, 'utf8') 
    : Buffer.byteLength(JSON.stringify(data), 'utf8');
  
  return bytes / (1024 * 1024); // Convert to MB
}

/**
 * Lanes are used to determine which worker queue to use based on the size of the data.
 * 
 * This helps with parsing performance by using different queues for different file sizes.
 */
const LANES = [{
  maxSize: 0.005
},{
  maxSize: 0.1
},{
  maxSize: 1
},{
  maxSize: 10
},{
  maxSize: 100
}];

/**
 * WorkerQueue interface - this is a placeholder that will be implemented
 * by the electron or CLI app since worker implementation is platform-specific
 */
class DummyWorkerQueue {
  constructor() {}
  
  enqueue() {
    throw new Error("WorkerQueue not implemented. You must provide your own WorkerQueue implementation.");
  }
}

/**
 * BruParserWorker class for handling async parsing tasks
 */
class BruParserWorker {
  /**
   * Create a new BruParserWorker
   * @param {Object} options - Options
   * @param {Function} options.WorkerQueue - WorkerQueue implementation
   */
  constructor(options = {}) {
    const { WorkerQueue, scriptsPath } = options;

    if (!WorkerQueue) {
      throw new Error('WorkerQueue implementation is required');
    }

    if (!scriptsPath) {
      throw new Error('scriptsPath is required');
    }

    this.WorkerQueue = WorkerQueue;
    this.scriptsPath = scriptsPath;
    
    // Initialize worker queues for each lane
    LANES.forEach(lane => {
      lane.workerQueue = new WorkerQueue();
    });
  }

  /**
   * Get the appropriate worker queue for the data size
   * @param {number} size - Size of data in MB
   * @returns {Object} Worker queue
   */
  getWorkerQueue(size) {
    // Find the first queue that can handle the given size
    // or fallback to the last queue for largest files
    const queueForSize = LANES.find((lane) => 
      lane.maxSize >= size
    );

    return queueForSize?.workerQueue ?? LANES.at(-1).workerQueue;
  }

  /**
   * Enqueue a task
   * @param {Object} params - Task parameters
   * @param {any} params.data - Data to process
   * @param {string} params.scriptFile - Script file name
   * @returns {Promise<any>} Task result
   */
  async enqueueTask({data, scriptFile, options = {} }) {
    const size = getSize(data);
    const workerQueue = this.getWorkerQueue(size);
    return workerQueue.enqueue({
      data,
      priority: size,
      scriptPath: path.join(this.scriptsPath, `${scriptFile}.js`),
      options
    });
  }

  /**
   * Convert BRU to JSON asynchronously
   * @param {string} data - BRU content
   * @param {Object} options - Options for parsing
   * @returns {Promise<Object>} JSON object
   */
  async bruToJson(data, options = {}) {
    return this.enqueueTask({ 
      data, 
      scriptFile: `bru-to-json`,
      options 
    });
  }

  /**
   * Convert JSON to BRU asynchronously
   * @param {Object} data - JSON object
   * @param {Object} options - Options for stringifying
   * @returns {Promise<string>} BRU content
   */
  async jsonToBru(data, options = {}) {
    return this.enqueueTask({ 
      data, 
      scriptFile: `json-to-bru`,
      options 
    });
  }

  /**
   * Parse request from file format to JSON asynchronously
   * @param {string} data - File content (BRU or YAML)
   * @param {Object} options - Options for parsing
   * @returns {Promise<Object>} JSON object representing the request
   */
  async parseRequest(data, options = {}) {
    // If format not specified, auto-detect it
    const format = options.format || detectFormatFromContent(data);
    
    // Use the appropriate script based on format
    const scriptFile = format === 'yaml' ? 'yaml-to-json' : 'bru-to-json';
    
    return this.enqueueTask({
      data,
      scriptFile,
      options
    });
  }

  /**
   * Stringify request from JSON to file format asynchronously
   * @param {Object} data - JSON object representing the request
   * @param {Object} options - Options for stringifying
   * @returns {Promise<string>} File content (BRU or YAML)
   */
  async stringifyRequest(data, options = {}) {
    // Default to BRU format if not specified
    const format = options.format || 'bru';
    
    // Use the appropriate script based on format
    const scriptFile = format === 'yaml' ? 'json-to-yaml' : 'json-to-bru';
    
    return this.enqueueTask({
      data,
      scriptFile,
      options
    });
  }
}

module.exports = {
  BruParserWorker
}; 