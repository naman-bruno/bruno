const Network = ({ logs }) => {
  return (
    <div className="bg-black/5 text-white network-logs rounded overflow-auto h-96">
      <pre className="whitespace-pre-wrap">
        {logs.map((currentLog, index) => {
          if (index > 0 && currentLog?.type === 'separator') {
            return <div className="border-t-2 border-gray-500 w-full my-2" key={index} />;
          }
          const nextLog = logs[index + 1];
          const isSameLogType = nextLog?.type === currentLog?.type;
          return <>
            <NetworkLogsEntry key={index} entry={currentLog} />
              {!isSameLogType && <div className="mt-4"/>}
            </>;
        })}
      </pre>
    </div>
  )
}

const safeMessageToString = (message) => {
  if (message === null || message === undefined) {
    return "";
  }
  
  if (typeof message === 'string') {
    return message;
  }
  
  if (message instanceof Error) {
    return message.toString();
  }
  
  if (typeof message === 'object') {
    try {
      return JSON.stringify(message);
    } catch (e) {
      return "Error object could not be stringified";
    }
  }
  
  return String(message);
};

const NetworkLogsEntry = ({ entry }) => {
  const { type, message } = entry;
  let className = '';
  
  // Simple, safe conversion of any message type to string
  const safeMessage = safeMessageToString(message);

  switch (type) {
    case 'request':
      className = 'text-blue-500';
      break;
    case 'response':
      className = 'text-green-500';
      break;
    case 'error':
      className = 'text-red-500';
      break;
    case 'tls':
      className = 'text-purple-500';
      break;
    case 'info':
      className = 'text-yellow-500';
      break;
    default:
      className = 'text-gray-400';
      break;
  }

  return (
    <div className={`${className}`}>
      <div>{safeMessage}</div>
    </div>
  );
};


export default Network;