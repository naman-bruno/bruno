const { parentPort } = require('worker_threads');
const { jsonRequestToYaml } = require('@usebruno/filestore');

parentPort.on('message', (workerData) => {
  try {
    const { data, options } = workerData;
    const json = data;
    const yaml = jsonRequestToYaml(json);
    parentPort.postMessage(yaml);
  }
  catch(error) {
    console.error(error);
    parentPort.postMessage({ error: error?.message });
  }
}); 