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
        icon: path.join(__dirname, "assets/icon.png"), // We'll add this later
        titleBarStyle: "default",
        show: false // Don't show until ready-to-show
    });

    // Load the UI from built files
    const uiBuildPath = path.join(__dirname, "build", "index.html");

    mainWindow.loadFile(uiBuildPath).then(() => {
        console.log("Successfully loaded UI from:", uiBuildPath);
    }).catch((error) => {
        console.error("Failed to load UI files:", error.message);
        console.log("Make sure to run 'yarn build' first");

        // Create a simple error page
        mainWindow.loadURL(`data:text/html;charset=utf-8,
            <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h1>UI Build Not Found</h1>
                    <p>Please run <code>yarn build</code> to build the UI files.</p>
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
                        // Handle import private key
                        console.log("Import Private Key clicked");
                    }
                },
                {
                    label: "Export Private Key",
                    accelerator: "CmdOrCtrl+E",
                    click: () => {
                        // Handle export private key
                        console.log("Export Private Key clicked");
                    }
                },
                { type: "separator" },
                {
                    label: "Connect Hardware Wallet",
                    accelerator: "CmdOrCtrl+H",
                    click: () => {
                        // Handle connect hardware wallet
                        console.log("Connect Hardware Wallet clicked");
                    }
                },
                {
                    label: "Wallet Connect",
                    accelerator: "CmdOrCtrl+W",
                    click: () => {
                        // Handle wallet connect
                        console.log("Wallet Connect clicked");
                    }
                },
                { type: "separator" },
                {
                    label: "Settings",
                    accelerator: "CmdOrCtrl+,",
                    click: () => {
                        // Handle settings
                        console.log("Settings clicked");
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
                    accelerator: "CmdOrCtrl+Q",
                    click: () => {
                        console.log("Quick Play clicked");
                    }
                },
                {
                    label: "Tournament",
                    accelerator: "CmdOrCtrl+T",
                    click: () => {
                        console.log("Tournament clicked");
                    }
                },
                { type: "separator" },
                {
                    label: "Game History",
                    click: () => {
                        console.log("Game History clicked");
                    }
                },
                {
                    label: "Statistics",
                    click: () => {
                        console.log("Statistics clicked");
                    }
                }
            ]
        },
        {
            label: "Tools",
            submenu: [
                {
                    label: "Bot Manager",
                    click: () => {
                        console.log("Bot Manager clicked");
                    }
                },
                {
                    label: "Hand Analyzer",
                    click: () => {
                        console.log("Hand Analyzer clicked");
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
                        console.log("How to Play clicked");
                    }
                },
                {
                    label: "Keyboard Shortcuts",
                    click: () => {
                        console.log("Keyboard Shortcuts clicked");
                    }
                },
                { type: "separator" },
                {
                    label: "About Block52 Poker VM",
                    click: () => {
                        console.log("About clicked");
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

        // Remove quit from File menu on macOS since it's in the app menu
        template[1].submenu = template[1].submenu.filter(item => item.label !== "Quit");
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Initialize Settings Manager and IPC handlers
function initializeSettingsIPC() {
    // Note: We'll create a simplified version since importing TypeScript directly is complex
    // In production, you'd want to compile the SettingsManager to JavaScript first

    // Simple in-memory storage for now - can be enhanced with SQLite later
    let settings = {
        nodeUrls: ["https://mainnet.block52.com", "https://backup.block52.com"],
        useVPN: false,
        connectedNodes: 12
    };

    // Handle adding a node
    ipcMain.handle("settings:addNode", async (event, nodeUrl) => {
        try {
            if (!settings.nodeUrls.includes(nodeUrl)) {
                settings.nodeUrls.push(nodeUrl);
                console.log("Node added:", nodeUrl);
            }
            return { success: true };
        } catch (error) {
            console.error("Failed to add node:", error);
            return { success: false, error: error.toString() };
        }
    });

    // Handle getting node URLs
    ipcMain.handle("settings:getNodes", async () => {
        try {
            return { success: true, nodeUrls: settings.nodeUrls };
        } catch (error) {
            console.error("Failed to get nodes:", error);
            return { success: false, error: error.toString() };
        }
    });

    // Handle VPN toggle
    ipcMain.handle("settings:toggleVPN", async () => {
        try {
            settings.useVPN = !settings.useVPN;
            return { success: true, useVPN: settings.useVPN };
        } catch (error) {
            console.error("Failed to toggle VPN:", error);
            return { success: false, error: error.toString() };
        }
    });

    // Handle getting all settings
    ipcMain.handle("settings:getAll", async () => {
        try {
            return { success: true, settings };
        } catch (error) {
            console.error("Failed to get settings:", error);
            return { success: false, error: error.toString() };
        }
    });

    // Handle updating connected nodes count
    ipcMain.handle("settings:updateConnectedNodes", async (event, count) => {
        try {
            settings.connectedNodes = count;
            return { success: true };
        } catch (error) {
            console.error("Failed to update connected nodes:", error);
            return { success: false, error: error.toString() };
        }
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    createWindow();
    initializeSettingsIPC();
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
