const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const isDev = process.argv.includes("--dev");

let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 960,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            preload: path.join(__dirname, "preload.js")
        },
        icon: path.join(__dirname, "../assets/icons/icon.png"),
        titleBarStyle: "default",
        show: false // Don't show until ready-to-show
    });

    // Load the UI from built files
    const uiBuildPath = path.join(__dirname, "../app/index.html");

    mainWindow.loadFile(uiBuildPath).then(() => {
        console.log("Successfully loaded UI from:", uiBuildPath);
    }).catch((error) => {
        console.error("Failed to load UI files:", error.message);
        console.log("Make sure to run the build script first");

        // Create a simple error page
        mainWindow.loadURL(`data:text/html;charset=utf-8,
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: white;">
                    <h1>UI Build Not Found</h1>
                    <p>Please run <code>./scripts/build.sh</code> to build the application.</p>
                    <p>Error: ${error.message}</p>
                </body>
            </html>
        `);
    });

    // Open DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Show window when ready
    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
    });

    // Handle window closed
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    // Create the application menu
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: "Wallet",
            submenu: [
                {
                    label: "Import Private Key",
                    accelerator: "CmdOrCtrl+I",
                    click: () => {
                        mainWindow.webContents.send("menu:importKey");
                    }
                },
                {
                    label: "Export Private Key",
                    accelerator: "CmdOrCtrl+E",
                    click: () => {
                        mainWindow.webContents.send("menu:exportKey");
                    }
                },
                { type: "separator" },
                {
                    label: "Settings",
                    accelerator: "CmdOrCtrl+,",
                    click: () => {
                        mainWindow.webContents.send("menu:settings");
                    }
                },
                { type: "separator" },
                {
                    label: "Quit",
                    accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: "Game",
            submenu: [
                {
                    label: "Quick Play",
                    accelerator: "CmdOrCtrl+P",
                    click: () => {
                        mainWindow.webContents.send("menu:quickPlay");
                    }
                },
                {
                    label: "Join Table",
                    accelerator: "CmdOrCtrl+J",
                    click: () => {
                        mainWindow.webContents.send("menu:joinTable");
                    }
                },
                { type: "separator" },
                {
                    label: "Game History",
                    click: () => {
                        mainWindow.webContents.send("menu:gameHistory");
                    }
                }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Reload",
                    accelerator: "CmdOrCtrl+R",
                    click: () => {
                        mainWindow.webContents.reload();
                    }
                },
                {
                    label: "Toggle Full Screen",
                    accelerator: process.platform === "darwin" ? "Ctrl+Cmd+F" : "F11",
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                { type: "separator" },
                {
                    label: "Developer Tools",
                    accelerator: process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        },
        {
            label: "Help",
            submenu: [
                {
                    label: "How to Play",
                    click: () => {
                        mainWindow.webContents.send("menu:howToPlay");
                    }
                },
                {
                    label: "Keyboard Shortcuts",
                    click: () => {
                        mainWindow.webContents.send("menu:shortcuts");
                    }
                },
                { type: "separator" },
                {
                    label: "About Block52 Poker",
                    click: () => {
                        mainWindow.webContents.send("menu:about");
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === "darwin") {
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    label: "About " + app.getName(),
                    role: "about"
                },
                { type: "separator" },
                {
                    label: "Services",
                    role: "services",
                    submenu: []
                },
                { type: "separator" },
                {
                    label: "Hide " + app.getName(),
                    accelerator: "Command+H",
                    role: "hide"
                },
                {
                    label: "Hide Others",
                    accelerator: "Command+Shift+H",
                    role: "hideothers"
                },
                {
                    label: "Show All",
                    role: "unhide"
                },
                { type: "separator" },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: () => {
                        app.quit();
                    }
                }
            ]
        });

        // Remove quit from Wallet menu on macOS since it's in the app menu
        template[1].submenu = template[1].submenu.filter(item => item.label !== "Quit");
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Initialize IPC handlers
function initializeIPC() {
    // Handle app info request
    ipcMain.handle("app:getInfo", async () => {
        return {
            name: app.getName(),
            version: app.getVersion(),
            platform: process.platform
        };
    });

    // Handle window controls
    ipcMain.handle("window:minimize", async () => {
        mainWindow.minimize();
    });

    ipcMain.handle("window:maximize", async () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.handle("window:close", async () => {
        mainWindow.close();
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();
    initializeIPC();
});

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS, re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
    contents.on("new-window", (event, navigationUrl) => {
        event.preventDefault();
        console.log("Blocked new window to:", navigationUrl);
    });
});
