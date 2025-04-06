const { parentPort } = require('worker_threads');
const { yamlRequestToJson } = require('@usebruno/filestore');

parentPort.on('message', (workerData) => {
  try {
    const { data, options } = workerData;
    const yaml = data;
    const json = yamlRequestToJson(yaml);
    parentPort.postMessage(json);
  }
  catch(error) {
    console.error(error);
    parentPort.postMessage({ error: error?.message });
  }
}); 