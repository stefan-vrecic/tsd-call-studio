// Call Studio Desktop (prototype): one window with Call Studio on the left and a side panel that can show Chanty, Stripe or
// Calendar. Sites like those can't be shown inside a normal browser page (they forbid it with X-Frame-Options), but an
// app window can host them, with their own saved logins. Start Call Studio's server first (python3 server.py).
const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const selftest = process.argv.includes('--selftest');
const openExternal = (url) => { if (selftest) console.log('OPEN-EXTERNAL', url); else shell.openExternal(url); };
// which links open in the side panel instead of the system browser
function panelFor(url) {
  try {
    const host = new URL(url).hostname;
    if (host === 'chanty.com' || host.endsWith('.chanty.com')) return 'chanty';
    if (host === 'dashboard.stripe.com') return 'stripe';
    if (host === 'calendar.google.com') return 'calendar';
    return null;
  } catch (e) { return null; }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 960, title: 'Call Studio', backgroundColor: '#dce4ef',
    webPreferences: { webviewTag: true, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
  });
  win.loadFile(path.join(__dirname, 'shell.html'));

  // a link from Call Studio (target=_blank) to Chanty / Stripe / Calendar opens in the side panel; anything else in the real browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    const panel = panelFor(url);
    if (panel) win.webContents.send('open-in-panel', panel, url);
    else openExternal(url);
    return { action: 'deny' };
  });
  // same for links clicked inside the side panel's sites: keep them out of stray windows
  app.on('web-contents-created', (_e, contents) => {
    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
    }
  });

  if (selftest) {
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      try {
        const info = await win.webContents.executeJavaScript(`new Promise(r => setTimeout(() => {
          const w = document.getElementById('web-chanty');
          r({ webview: !!w, url: w && w.getURL && w.getURL(), title: w && w.getTitle && w.getTitle(),
              studioFrame: document.getElementById('studio').src, side: getComputedStyle(document.getElementById('side')).display,
              widths: [document.getElementById('studio').getBoundingClientRect().width, document.getElementById('side').getBoundingClientRect().width] });
        }, 4000))`);
        console.log('SELFTEST', JSON.stringify(info));
        await win.webContents.executeJavaScript(`document.getElementById('web-chanty').executeJavaScript("(()=>{const a=document.createElement('a');a.href='https://talk.aloware.io/contacts/171576220';a.target='_blank';a.textContent='x';document.body.appendChild(a);a.click();return 'clicked';})()")`);
        await new Promise(r => setTimeout(r, 1500));
        const img = await win.webContents.capturePage();
        fs.writeFileSync('/tmp/callstudio-desktop.png', img.toPNG());
        console.log('SELFTEST screenshot saved');
      } catch (e) { console.log('SELFTEST error', e.message); }
      app.quit();
    }, 6000));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
