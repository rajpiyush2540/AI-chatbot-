import { useState } from "react";
import ChatWindow from "./components/ChatWindow";
import UploadBox from "./components/UploadBox";
import "./App.css";

function App() {
  // "idle" | "busy" | "ready" — shared so the header dot reflects both
  // upload progress and question-answering progress.
  const [status, setStatus] = useState("idle");
  const [documentInfo, setDocumentInfo] = useState(null); // { name, chunkCount } once uploaded

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className={`status-dot ${status}`} />
          <div>
            <h1>AI Customer Support</h1>
            <p className="tagline">Answers pulled straight from the document you hand it — nothing invented.</p>
          </div>
        </div>
        <div className="desk-tag">DESK <b>01</b></div>
      </header>

      <div className="layout">
        <UploadBox
          onStatusChange={setStatus}
          onDocumentReady={setDocumentInfo}
          documentInfo={documentInfo}
        />
        <ChatWindow
          onStatusChange={setStatus}
          documentInfo={documentInfo}
        />
      </div>
    </div>
  );
}

export default App;