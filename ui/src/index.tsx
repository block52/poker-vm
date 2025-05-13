import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { NodeRpcProvider } from "./context/NodeRpcContext";

const projectId = import.meta.env.VITE_PROJECT_ID;
if (!projectId) {
    throw new Error("Project ID is not defined in .env file");
}

const url = process.env.NODE_URL;

const root = createRoot(document.getElementById("app") as HTMLElement);
root.render(
    <React.StrictMode>
        <NodeRpcProvider nodeUrl={url}>
            <App />
        </NodeRpcProvider>
    </React.StrictMode>
);
