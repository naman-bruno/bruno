import React from 'react';
import { useSelector } from 'react-redux';
import { IconCpu, IconMemory, IconClock, IconEye } from '@tabler/icons';
import StyledWrapper from './StyledWrapper';

const StatCard = ({ icon: Icon, label, value, unit, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ color }}>
      <Icon size={20} strokeWidth={1.5} />
    </div>
    <div className="stat-content">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        <span className="stat-unit">{unit}</span>
      </div>
    </div>
  </div>
);

const Performance = () => {
  const { systemResources, activeWatchers } = useSelector(state => state.performance || {});

  const formatMemory = bytes => {
    if (!bytes) return '0';
    const mb = bytes / 1024 / 1024;
    return mb.toFixed(1);
  };

  const formatUptime = seconds => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const activeWatcherCount = Object.keys(activeWatchers || {}).length;

  return (
    <StyledWrapper>
      <div className="performance-tab">
        <div className="performance-content">
          <div className="stats-grid">
            <StatCard
              icon={IconCpu}
              label="CPU Usage"
              value={systemResources?.cpu?.toFixed(1) || '0'}
              unit="%"
              color="#3b82f6"
            />
            <StatCard
              icon={IconMemory}
              label="Memory Usage"
              value={formatMemory(systemResources?.memory)}
              unit="MB"
              color="#10b981"
            />
            <StatCard
              icon={IconClock}
              label="Uptime"
              value={formatUptime(systemResources?.uptime)}
              unit=""
              color="#f59e0b"
            />
            <StatCard
              icon={IconEye}
              label="Active Watchers"
              value={activeWatcherCount}
              unit=""
              color="#8b5cf6"
            />
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Performance;
