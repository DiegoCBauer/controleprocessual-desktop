// Aplicativo desktop do Controle Processual.
// Abre o sistema publicado (Vercel) em uma janela própria, sem barra do navegador.
// Como carrega a versão online, toda atualização do sistema aparece aqui automaticamente.
const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_URL = 'https://cpclezarkuchler.vercel.app/';
const APP_ORIGIN = new URL(APP_URL).origin;
const OFFLINE_PAGE = path.join(__dirname, 'offline.html');

let mainWindow = null;

// Uma única instância: ao abrir de novo, apenas traz a janela para frente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

app.setAppUserModelId('br.com.clezarkuchler.controleprocessual');

// ---------- Tamanho e posição da janela ----------
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch (_e) {
    return { width: 1366, height: 860, maximized: true };
  }
}

function saveWindowState(win) {
  try {
    const bounds = win.getNormalBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ ...bounds, maximized: win.isMaximized() }));
  } catch (_e) {}
}

function isAppUrl(url) {
  try {
    return new URL(url).origin === APP_ORIGIN;
  } catch (_e) {
    return false;
  }
}

function openExternal(url) {
  if (/^(https?|mailto|tel):/i.test(url)) shell.openExternal(url);
}

// ---------- Menu ----------
function buildMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Página inicial', accelerator: 'Alt+Home', click: () => mainWindow?.loadURL(APP_URL) },
        { label: 'Abrir no navegador', click: () => shell.openExternal(mainWindow?.webContents.getURL() || APP_URL) },
        { type: 'separator' },
        { label: 'Imprimir…', accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.print() },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', role: 'undo' },
        { label: 'Refazer', role: 'redo' },
        { type: 'separator' },
        { label: 'Recortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Colar', role: 'paste' },
        { label: 'Selecionar tudo', role: 'selectAll' }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', accelerator: 'F5', click: () => mainWindow?.webContents.reload() },
        { label: 'Recarregar (forçar)', accelerator: 'CmdOrCtrl+F5', click: () => mainWindow?.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Aumentar zoom', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { label: 'Diminuir zoom', role: 'zoomOut' },
        { label: 'Zoom padrão', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tela cheia', role: 'togglefullscreen' },
        { label: 'Ferramentas de desenvolvedor', role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Verificar atualizações do aplicativo', click: () => checkForUpdates(true) },
        {
          label: 'Sobre',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Sobre',
            message: 'Controle Processual',
            detail: `C&K Advogados\nVersão do aplicativo: ${app.getVersion()}\n${APP_URL}`
          })
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Menu do botão direito (copiar/colar e sugestões do corretor ortográfico).
function attachContextMenu(contents) {
  contents.on('context-menu', (_event, params) => {
    const items = [];
    for (const suggestion of params.dictionarySuggestions || []) {
      items.push({ label: suggestion, click: () => contents.replaceMisspelling(suggestion) });
    }
    if (params.misspelledWord) {
      items.push({ label: 'Adicionar ao dicionário', click: () => contents.session.addWordToSpellCheckerDictionary(params.misspelledWord) });
      items.push({ type: 'separator' });
    }
    if (params.linkURL) {
      items.push({ label: 'Abrir link no navegador', click: () => openExternal(params.linkURL) });
      items.push({ type: 'separator' });
    }
    if (params.isEditable) {
      items.push({ label: 'Recortar', role: 'cut', enabled: params.editFlags.canCut });
      items.push({ label: 'Copiar', role: 'copy', enabled: params.editFlags.canCopy });
      items.push({ label: 'Colar', role: 'paste', enabled: params.editFlags.canPaste });
      items.push({ label: 'Selecionar tudo', role: 'selectAll' });
    } else if (params.selectionText) {
      items.push({ label: 'Copiar', role: 'copy' });
    }
    if (items.length) Menu.buildFromTemplate(items).popup();
  });
}

// ---------- Janela principal ----------
function createWindow() {
  const state = loadWindowState();
  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width || 1366,
    height: state.height || 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Controle Processual',
    backgroundColor: '#f5f7fb',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  mainWindow.webContents.session.setSpellCheckerLanguages(['pt-BR']);
  if (state.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  ['resize', 'move', 'close'].forEach(evt => mainWindow.on(evt, () => saveWindowState(mainWindow)));
  mainWindow.on('closed', () => { mainWindow = null; });

  const contents = mainWindow.webContents;
  attachContextMenu(contents);

  // Links para fora do sistema (PJe, Eproc, fontes oficiais…) abrem no navegador padrão.
  contents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('blob:') || url === 'about:blank' || isAppUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png') }
      };
    }
    openExternal(url);
    return { action: 'deny' };
  });
  contents.on('did-create-window', child => attachContextMenu(child.webContents));
  contents.on('will-navigate', (event, url) => {
    if (isAppUrl(url) || url.startsWith('file:')) return;
    event.preventDefault();
    openExternal(url);
  });

  // Sem internet: mostra uma página amigável com botão para tentar de novo.
  contents.on('did-fail-load', (_event, errorCode, _desc, validatedURL, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 /* ABORTED */) return;
    if (validatedURL && validatedURL.startsWith('file:')) return;
    mainWindow.loadFile(OFFLINE_PAGE, { query: { url: APP_URL } });
  });

  mainWindow.loadURL(APP_URL);
}

// ---------- Atualização automática do aplicativo ----------
let autoUpdater = null;
function checkForUpdates(manual = false) {
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox(mainWindow, { message: 'Atualizações só funcionam no aplicativo instalado.' });
    return;
  }
  try {
    if (!autoUpdater) {
      autoUpdater = require('electron-updater').autoUpdater;
      autoUpdater.autoDownload = true;
      autoUpdater.on('update-downloaded', info => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          buttons: ['Reiniciar agora', 'Depois'],
          defaultId: 0,
          title: 'Atualização disponível',
          message: `A versão ${info.version} do aplicativo foi baixada.`,
          detail: 'Reinicie para aplicar. Se escolher "Depois", ela será instalada ao fechar o aplicativo.'
        }).then(({ response }) => { if (response === 0) autoUpdater.quitAndInstall(); });
      });
    }
    const pending = autoUpdater.checkForUpdates();
    if (manual) {
      pending.then(result => {
        const latest = result?.updateInfo?.version;
        if (!latest || latest === app.getVersion()) {
          dialog.showMessageBox(mainWindow, { message: `Você já está na versão mais recente (${app.getVersion()}).` });
        }
      }).catch(err => dialog.showMessageBox(mainWindow, { type: 'warning', message: 'Não foi possível verificar atualizações.', detail: String(err?.message || err) }));
    } else {
      pending.catch(() => {});
    }
  } catch (_e) {}
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  setTimeout(() => checkForUpdates(false), 5000);
});

app.on('window-all-closed', () => app.quit());
