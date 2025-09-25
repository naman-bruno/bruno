const pidusage = require('pidusage');

class SystemMonitor {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  start(mainWindow) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics(mainWindow);
    }, 2000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  async collectSystemMetrics(mainWindow) {
    try {
      const stats = await pidusage(process.pid);
      const resourceData = {
        cpu: stats.cpu,
        memory: stats.memory,
        pid: process.pid,
        uptime: process.uptime(),
      };

      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('main:system-resources', resourceData);
      }
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }
}

module.exports = SystemMonitor;
