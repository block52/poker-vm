import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { NodeRpcProvider } from "./context/NodeRpcContext";
import { Profiler } from "react";

const projectId = import.meta.env.VITE_PROJECT_ID;
if (!projectId) {
    throw new Error("Project ID is not defined in .env file");
}

const url = process.env.NODE_URL;

const root = createRoot(document.getElementById("app") as HTMLElement);

function onRenderCallback(
  id: string, 
  _phase: "mount" | "update" | "nested-update",
  actualDuration: number,
  _baseDuration: number,
  _startTime: number,
  _commitTime: number
) {
  // Log or collect performance metrics
  if (actualDuration > 5) {
    console.table({
      component: id,
      renderTime: actualDuration.toFixed(2),
      phase: _phase
    });
  }
}

root.render(
    // <React.StrictMode>
        <Profiler id="AppRoot" onRender={onRenderCallback}>
            <NodeRpcProvider nodeUrl={url}>
                <App />
            </NodeRpcProvider>
        </Profiler>
    // </React.StrictMode>
);
