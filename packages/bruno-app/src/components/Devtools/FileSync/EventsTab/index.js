import React from 'react';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFolder,
  IconFolderMinus,
} from '@tabler/icons';

const EventRow = ({ event }) => {
  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getFileName = filepath => {
    return filepath.split('/').pop() || filepath;
  };

  const getRelativePath = filepath => {
    const parts = filepath.split('/');
    if (parts.length > 3) {
      return `.../${parts.slice(-2).join('/')}`;
    }
    return filepath;
  };

  return (
    <div className="event-row">
      <div className="event-type-cell">
        <span className={`operation-badge ${event.event}`}>{event.event}</span>
      </div>

      <div className="event-file-cell">
        <span className="file-name">{getFileName(event.filepath)}</span>
      </div>

      <div className="event-path-cell">
        <span className="file-path" title={event.filepath}>
          {event.filepath}
        </span>
      </div>

      <div className="event-time-cell text-right">
        {formatTime(event.timestamp)}
      </div>
    </div>
  );
};

const EventsTab = ({ events, filters }) => {
  const filteredEvents = events.filter(event => filters[event.event]);

  return (
    <div className="events-tab">
      <div className="events-content">
        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <p>No events to display</p>
          </div>
        ) : (
          <div className="events-container">
            <div className="events-header">
              <div>Type</div>
              <div>File</div>
              <div>Path</div>
              <div className="text-right">Time</div>
            </div>
            <div className="events-list">
              {filteredEvents.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsTab;
