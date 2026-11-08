import { createRoot } from "react-dom/client";
import { WorkspaceProvider } from "./workspaceState";
import { Workspace } from "./workspace";
import "./style.css";
import "./workspace.css";
createRoot(document.getElementById("root")!).render(
  <WorkspaceProvider>
    <Workspace />
  </WorkspaceProvider>,
);
