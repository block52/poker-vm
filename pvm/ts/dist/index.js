"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const rpc_1 = require("./rpc");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
const version = "0.1.0";
// Define a simple route
app.get("/", (req, res) => {
    res.send(`PVM RPC Server v${version}`);
});
app.post("/", async (req, res) => {
    const body = req.body;
    if (!body) {
        res.status(400).json({ error: "Invalid request" });
    }
    const response = await rpc_1.RPC.handle(body);
    res.json(response);
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map