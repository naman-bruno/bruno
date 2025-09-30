import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { IconFilter, IconChevronDown } from '@tabler/icons';

const FilterDropdown = ({ filters, onFilterToggle, onToggleAll, title, counts = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeFilters = useMemo(() => {
    return Object.entries(filters).filter(([_, enabled]) => enabled);
  }, [filters]);

  const allEnabled = useMemo(() => {
    return Object.values(filters).every((enabled) => enabled);
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const handleToggleAll = useCallback(() => onToggleAll(!allEnabled), [onToggleAll, allEnabled]);

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'read': return '#22c55e';
      case 'write': return '#f97316';
      case 'add': return '#10b981';
      case 'change': return '#3b82f6';
      case 'unlink': return '#ef4444';
      case 'adddir': return '#a855f7';
      case 'unlinkdir': return '#ef4444';
      case 'syntax': return '#f59e0b';
      case 'parsing': return '#ef4444';
      case 'runtime': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <button
        className="filter-dropdown-trigger"
        onClick={handleToggle}
        title={`Filter by ${title.toLowerCase()}`}
      >
        <IconFilter size={16} strokeWidth={1.5} />
        <span className="filter-summary">
          {activeFilters.length === Object.keys(filters).length ? 'All' : `${activeFilters.length}/${Object.keys(filters).length}`}
        </span>
        <IconChevronDown size={14} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="filter-dropdown-menu right">
          <div className="filter-dropdown-header">
            <span>{title}</span>
            <button
              className="filter-toggle-all"
              onClick={handleToggleAll}
            >
              {allEnabled ? 'Hide All' : 'Show All'}
            </button>
          </div>

          <div className="filter-dropdown-options">
            {Object.entries(filters).map(([type, enabled]) => (
              <label key={type} className="filter-option">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => onFilterToggle(type, e.target.checked)}
                />
                <div className="filter-option-content">
                  <span
                    className="method-badge"
                    style={{ backgroundColor: getTypeColor(type) }}
                  >
                    {type.toUpperCase()}
                  </span>
                  <span className="filter-option-label">{type}</span>
                  <span className="filter-option-count">
                    (
                    {counts[type] || 0}
                    )
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const OperationFilterDropdown = (props) => (
  <FilterDropdown {...props} title="Filter by Operation" />
);

export const EventFilterDropdown = (props) => (
  <FilterDropdown {...props} title="Filter by Event" />
);
