const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const isDev = process.argv.includes("--dev");

let mainWindow;

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true
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
            label: "File",
            submenu: [
                {
                    label: "New Game",
                    accelerator: "CmdOrCtrl+N",
                    click: () => {
                        // Handle new game
                        console.log("New Game clicked");
                    }
                },
                {
                    label: "Join Game",
                    accelerator: "CmdOrCtrl+J",
                    click: () => {
                        // Handle join game
                        console.log("Join Game clicked");
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

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

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
