import React from 'react';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconFolder,
  IconFolderMinus,
} from '@tabler/icons';

const EventRow = ({ event, isSelected, onClick }) => {
  const getEventIcon = eventType => {
    switch (eventType) {
      case 'add':
        return <IconPlus size={14} className="event-icon add" />;
      case 'change':
        return <IconEdit size={14} className="event-icon change" />;
      case 'unlink':
        return <IconTrash size={14} className="event-icon unlink" />;
      case 'addDir':
        return <IconFolder size={14} className="event-icon addDir" />;
      case 'unlinkDir':
        return <IconFolderMinus size={14} className="event-icon unlinkDir" />;
      default:
        return <IconEdit size={14} className="event-icon" />;
    }
  };

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
    <div
      className={`event-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(event)}
    >
      <div className="event-cell event-icon-cell">
        {getEventIcon(event.event)}
      </div>
      <div className="event-cell event-type-cell">
        <span className={`event-type ${event.event}`}>{event.event}</span>
      </div>
      <div className="event-cell event-file-cell">
        <span className="file-name">{getFileName(event.filepath)}</span>
      </div>
      <div className="event-cell event-path-cell">
        <span className="file-path" title={event.filepath}>
          {getRelativePath(event.filepath)}
        </span>
      </div>
      <div className="event-cell event-time-cell">
        {formatTime(event.timestamp)}
      </div>
    </div>
  );
};

const EventsTab = ({ events, filters, onFilterToggle, onToggleAll, onClearEvents, selectedEvent, onEventSelect }) => {
  const filteredEvents = events.filter(event => filters[event.event]);

  return (
    <div className="events-tab">
      <div className="events-content">
        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <p>No events to display</p>
          </div>
        ) : (
          <div className="events-table">
            <div className="events-header">
              <div className="event-cell event-icon-cell"></div>
              <div className="event-cell event-type-cell">Type</div>
              <div className="event-cell event-file-cell">File</div>
              <div className="event-cell event-path-cell">Path</div>
              <div className="event-cell event-time-cell">Time</div>
            </div>
            <div className="events-body">
              {filteredEvents.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent?.id === event.id}
                  onClick={onEventSelect}
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
