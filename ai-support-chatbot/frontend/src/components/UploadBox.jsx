import { useState, useRef } from "react";
import { uploadDocument } from "../api/api";
import "./UploadBox.css";

const ACCEPTED = [".pdf", ".docx", ".txt", ".md"];

function extIcon(ext) {
  if (ext === "docx") return { cls: "docx", label: "DOC" };
  if (ext === "pdf") return { cls: "pdf", label: "PDF" };
  return { cls: "txt", label: "TXT" };
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadBox({ onStatusChange, onDocumentReady, documentInfo }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const caseNumberRef = useRef(1);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setUploading(true);
    onStatusChange("busy");

    try {
      const res = await uploadDocument(file);
      if (res.success) {
        caseNumberRef.current += 1;
        onDocumentReady({
          name: file.name,
          size: file.size,
          ext: file.name.split(".").pop().toLowerCase(),
          chunkCount: res.document.chunkCount,
          caseNumber: caseNumberRef.current,
          uploadedAt: new Date(),
        });
        onStatusChange("ready");
      } else {
        setError(res.message || "Upload failed. Try a different file.");
        onStatusChange("idle");
      }
    } catch (err) {
      setError(err.message || "Something went wrong uploading that file.");
      onStatusChange("idle");
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e) => handleFile(e.target.files[0]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const resetUpload = () => {
    onDocumentReady(null);
    onStatusChange("idle");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Case file view (after a successful upload) ----
  if (documentInfo) {
    const icon = extIcon(documentInfo.ext);
    const padded = String(documentInfo.caseNumber).padStart(4, "0");
    return (
      <div>
        <div className="case-file">
          <div className="tab">
            <span>CASE FILE</span>
            <span className="case-no">№ {padded}</span>
          </div>
          <div className="body">
            <div className="file-row">
              <div className={`file-icon ${icon.cls}`}>{icon.label}</div>
              <div>
                <div className="file-name">{documentInfo.name}</div>
                <div className="file-meta">
                  <span>{fmtBytes(documentInfo.size)}</span>
                  <span>{documentInfo.chunkCount} chunks</span>
                  <span>uploaded {documentInfo.uploadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
            <button className="replace-btn" onClick={resetUpload}>Replace document</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Dropzone view (before upload) ----
  return (
    <div>
      <div
        className={`dropzone ${dragActive ? "drag" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload a document"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <>
            <div className="dz-title">Reading your file…</div>
            <div className="scan-bar" />
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 3v12m0-12l4 4m-4-4l-4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            <div className="dz-title">Upload a document</div>
            <div className="dz-sub">Drop a file here, or click to browse</div>
            <div className="dz-formats">.TXT · .MD · .DOCX · .PDF</div>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onInputChange}
        disabled={uploading}
        style={{ display: "none" }}
      />
      {error && <div className="banner">{error}</div>}
    </div>
  );
}