const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
let siteConfig = {};
try { siteConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-config.local.json'), 'utf8')); } catch { /* optional local settings */ }
contextBridge.exposeInMainWorld('desktop', { siteConfig, onOpenInPanel: (cb) => ipcRenderer.on('open-in-panel', (_e, site, url) => cb(site, url)) });
