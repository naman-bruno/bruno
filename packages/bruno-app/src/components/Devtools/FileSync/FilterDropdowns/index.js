import React, { useState, useCallback, useMemo } from 'react';
import { IconFilter, IconChevronDown } from '@tabler/icons';

const FilterDropdown = ({ filters, onFilterToggle, onToggleAll, title }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { allEnabled, someEnabled } = useMemo(() => {
    const values = Object.values(filters);
    return {
      allEnabled: values.every(enabled => enabled),
      someEnabled: values.some(enabled => enabled),
    };
  }, [filters]);

  const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);
  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleToggleAll = useCallback(() => onToggleAll(!allEnabled), [onToggleAll, allEnabled]);

  const triggerClassName = `filter-dropdown-trigger ${allEnabled ? 'active' : someEnabled ? 'partial' : ''}`;

  return (
    <div className="filter-dropdown">
      <button className={triggerClassName} onClick={handleToggle}>
        <IconFilter size={14} strokeWidth={1.5} />
        <span>Filter</span>
        <IconChevronDown size={12} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <>
          <div className="filter-dropdown-menu right">
            <div className="filter-dropdown-header">
              <span>{title}</span>
              <button className="filter-toggle-all" onClick={handleToggleAll}>
                {allEnabled ? 'None' : 'All'}
              </button>
            </div>

            <div className="filter-dropdown-body">
              {Object.entries(filters).map(([type, enabled]) => (
                <div key={type} className="filter-dropdown-item">
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => onFilterToggle(type, !enabled)}
                    />
                    <span className="filter-checkbox-indicator"></span>
                    <div className="filter-checkbox-content">
                      <span className="filter-label">{type}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="filter-dropdown-backdrop" onClick={handleClose} />
        </>
      )}
    </div>
  );
};

export const OperationFilterDropdown = props => (
  <FilterDropdown {...props} title="Filter by Operation" />
);

export const EventFilterDropdown = props => (
  <FilterDropdown {...props} title="Filter by Event" />
);

export const ErrorFilterDropdown = props => (
  <FilterDropdown {...props} title="Filter by Error" />
);
