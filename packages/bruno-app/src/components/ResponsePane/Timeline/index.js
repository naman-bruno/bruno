import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  .line {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    margin: 0;
  }

  .info {
    color: #888;
  }

  .request {
    color: #3498db;
  }

  .response {
    color: #27ae60;
  }

  .error {
    color: #e74c3c;
  }

  .header {
    color: #d35400;
  }

  .data {
    color: #8e44ad;
  }

  .tls {
    color: #16a085;
  }
`;

const Timeline = ({ response }) => {
  response = response || {};
  const timelineEntries = response.timeline || [];

  const renderLine = (entry, index) => {
    const { type, message, data } = entry;
    let className = 'info';

    switch (type) {
      case 'request':
        className = 'request';
        break;
      case 'requestHeader':
        className = 'header';
        break;
      case 'requestData':
        className = 'data';
        break;
      case 'response':
        className = 'response';
        break;
      case 'responseHeader':
        className = 'header';
        break;
      case 'responseData':
        className = 'data';
        break;
      case 'tls':
        className = 'tls';
        break;
      case 'error':
        className = 'error';
        break;
      case 'info':
      default:
        className = 'info';
        break;
    }

    return (
      <div key={index} className={`line ${className}`}>
        {message}
        {data && (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    );
  };

  return (
    <StyledWrapper className="pb-4 w-full">
      <div>
        {timelineEntries.map((entry, index) => renderLine(entry, index))}
      </div>
    </StyledWrapper>
  );
};

export default Timeline;