import React from 'react';
import { useSelector } from 'react-redux';
import { IconCpu, IconDatabase, IconClock, IconServer, IconAlertTriangle, IconFile, IconFolder, IconActivity, IconChartLine } from '@tabler/icons';
import StyledWrapper from '../FileSync/StyledWrapper';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const SystemResourceCard = ({ icon: Icon, title, value, subtitle, color = 'default', trend }) => (
  <div className={`resource-card ${color}`}>
    <div className="resource-header">
      <Icon size={20} strokeWidth={1.5} />
      <span className="resource-title">{title}</span>
    </div>
    <div className="resource-value">{value}</div>
    {subtitle && <div className="resource-subtitle">{subtitle}</div>}
    {trend && (
      <div className={`resource-trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'}`}>
        <IconChartLine size={12} strokeWidth={1.5} />
        <span>
          {trend > 0 ? '+' : ''}
          {trend.toFixed(1)}
          %
        </span>
      </div>
    )}
  </div>
);

const StatsGrid = ({ fileOperations, watcherStats, activeWatchers, parsingErrors }) => {
  const totalOperations = fileOperations.length;
  const totalWatchedFiles = Object.values(watcherStats).reduce((sum, stats) => sum + (stats.watchedFiles || 0), 0);
  const totalWatchedDirs = Object.values(watcherStats).reduce((sum, stats) => sum + (stats.watchedDirectories || 0), 0);
  const totalErrors = parsingErrors.length;

  return (
    <div className="stats-grid">
      <div className="stats-section">
        <h3>File System Activity</h3>
        <div className="stats-cards">
          <div className="stat-card primary">
            <div className="stat-icon">
              <IconActivity size={24} strokeWidth={1.5} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalOperations}</div>
              <div className="stat-label">Total Operations</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <IconFile size={24} strokeWidth={1.5} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalWatchedFiles}</div>
              <div className="stat-label">Watched Files</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <IconFolder size={24} strokeWidth={1.5} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalWatchedDirs}</div>
              <div className="stat-label">Watched Directories</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <IconAlertTriangle size={24} strokeWidth={1.5} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalErrors}</div>
              <div className="stat-label">Parse Errors</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Performance = () => {
  const {
    fileOperations,
    watcherStats,
    parsingErrors,
    activeWatchers,
    systemResources
  } = useSelector((state) => state.fileSync);

  const collections = useSelector((state) => state.collections.collections);

  return (
    <StyledWrapper>
      <div className="overview-tab">
        <div className="overview-content">
          <div className="system-resources">
            <h2>System Resources</h2>
            <div className="resource-cards">
              <SystemResourceCard
                icon={IconCpu}
                title="CPU Usage"
                value={`${systemResources.cpu.toFixed(1)}%`}
                subtitle="Current process"
                color={systemResources.cpu > 80 ? 'danger' : systemResources.cpu > 60 ? 'warning' : 'success'}
              />

              <SystemResourceCard
                icon={IconDatabase}
                title="Memory Usage"
                value={formatBytes(systemResources.memory)}
                subtitle="Current process"
                color={systemResources.memory > 500 * 1024 * 1024 ? 'danger' : 'default'}
              />

              <SystemResourceCard
                icon={IconClock}
                title="Uptime"
                value={formatUptime(systemResources.uptime)}
                subtitle="Process runtime"
                color="info"
              />

              <SystemResourceCard
                icon={IconServer}
                title="Process ID"
                value={systemResources.pid || 'N/A'}
                subtitle="Current PID"
                color="default"
              />
            </div>
          </div>

          <StatsGrid
            fileOperations={fileOperations}
            watcherStats={watcherStats}
            activeWatchers={activeWatchers}
            parsingErrors={parsingErrors}
          />
        </div>
      </div>
    </StyledWrapper>
  );
};

export default Performance;
