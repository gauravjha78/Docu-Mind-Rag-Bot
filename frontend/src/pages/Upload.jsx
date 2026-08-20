import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Upload.css";

function makeStars(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 1.8,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 6,
  }));
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | error | success
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const stars = useMemo(() => makeStars(45), []);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("access_token", token);
      window.history.replaceState({}, document.title, "/upload");
    }

    const storedToken = localStorage.getItem("access_token");

    if (!storedToken) {
      navigate("/");
    }
  }, [navigate]);

  const pickFile = (selected) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setStatus("error");
      setMessage("Only PDF files are supported");
      return;
    }
    setFile(selected);
    setStatus("idle");
    setMessage("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const uploadFile = async () => {
    const token = localStorage.getItem("access_token");

    if (!file) {
      setStatus("error");
      setMessage("Please select a PDF");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.document_id) {
        setStatus("success");
        setMessage("Document processed successfully");
        navigate(`/chat?doc=${data.document_id}`);
      } else {
        setStatus("error");
        setMessage(data.detail || "Upload failed");
      }
    } catch (err) {
      console.log(err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="up-root">
      <div className="up-orb up-orb-1" />
      <div className="up-orb up-orb-2" />
      <div className="up-star-layer">
        {stars.map((s) => (
          <span
            key={s.id}
            className="up-star"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="up-grid" />

      {/* top strip: brand + step progress, not a standard navbar */}
      <header className="up-topbar">
        <div className="up-brand">
          <span className="up-brand-mark">◆</span>
          <span className="up-brand-name">DocuMind</span>
        </div>

        <div className="up-steps">
          <div className={`up-step ${!file || status !== "success" ? "up-step-active" : "up-step-done"}`}>
            <span className="up-step-dot">1</span>
            <span className="up-step-label">Upload</span>
          </div>
          <div className="up-step-line" />
          <div className="up-step">
            <span className="up-step-dot">2</span>
            <span className="up-step-label">Chat</span>
          </div>
        </div>
      </header>

      <main className="up-layout">
        {/* left: upload flow */}
        <section className="up-panel up-panel-left">
          <span className="up-eyebrow">Get started</span>
          <h1 className="up-title">Upload your PDF</h1>
          <p className="up-sub">
            Drop a document below and DocuMind will read it, index it, and get ready to answer
            your questions.
          </p>

          <label
            className={`up-dropzone ${isDragging ? "up-dropzone-active" : ""} ${
              file ? "up-dropzone-filled" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="up-input-hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            {!file ? (
              <div className="up-dropzone-empty">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 16V4M12 4L7 9M12 4L17 9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="up-drop-title">Drag &amp; drop your PDF here</p>
                <p className="up-drop-sub">or click to browse from your device</p>
              </div>
            ) : (
              <div className="up-file-chip">
                <div className="up-file-icon">PDF</div>
                <div className="up-file-info">
                  <span className="up-file-name">{file.name}</span>
                  <span className="up-file-size">{formatBytes(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="up-file-remove"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                    setStatus("idle");
                    setMessage("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </label>

          <button
            onClick={uploadFile}
            disabled={isUploading}
            className="up-btn"
          >
            {isUploading ? (
              <>
                <span className="up-spinner" />
                Processing…
              </>
            ) : (
              "Upload PDF"
            )}
          </button>

          {message && (
            <p className={`up-message up-message-${status}`}>
              {status === "success" ? "✓ " : status === "error" ? "⚠ " : ""}
              {message}
            </p>
          )}
        </section>

        {/* right: where the chat will live once a document is processed */}
        <section className="up-panel up-panel-right">
          <div className="up-chat-preview">
            <div className="up-chat-bubble up-chat-bubble-1">
              <span className="up-typing-dot" />
              <span className="up-typing-dot" />
              <span className="up-typing-dot" />
            </div>
            <div className="up-chat-bubble up-chat-bubble-2" />
            <h2 className="up-chat-title">Your Study Partner</h2>
            <p className="up-chat-sub">
              Once your document finishes processing, ask anything about it .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Upload;
