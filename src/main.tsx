import { createRoot } from "react-dom/client";
import { Workspace } from "./workspace";
import { CallingProof } from "./proof";
import "./style.css";
import "./workspace.css";
createRoot(document.getElementById("root")!).render(
  location.pathname === "/proof" ? <CallingProof /> : <Workspace />,
);
