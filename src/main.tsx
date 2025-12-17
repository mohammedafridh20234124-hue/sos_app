import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("🚀 App starting - main.tsx loaded");

const root = document.getElementById("root");
console.log("📍 Root element found:", root);

if (!root) {
  console.error("❌ CRITICAL: #root element not found in DOM!");
  document.body.innerHTML = "<h1>Error: Root element #root not found</h1>";
} else {
  console.log("✅ Creating React root...");
  createRoot(root).render(<App />);
  console.log("✅ App rendered");
}

