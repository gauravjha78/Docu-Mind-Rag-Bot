import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Chat.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


function formatBytes(bytes) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function Chat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDoc = searchParams.get("doc");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // multi-document support
  const [documents, setDocuments] = useState(
    initialDoc ? [{ id: initialDoc, name: "Current document", size: null }] : []
  );
  const [activeDocId, setActiveDocId] = useState(initialDoc || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // selection-to-copy + highlights panel (reserved for your export feature)
  const [highlights, setHighlights] = useState([]);
  const [selection, setSelection] = useState(null); // { text, x, y }

  const scrollRef = useRef(null);


  // API
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  const sendMessage = async () => {
    const token = localStorage.getItem("access_token");

    if (!activeDocId) {
      setMessage("No document selected. Upload a PDF first.");
      return;
    }
    if (!question.trim()) {
      return;
    }

    const userText = question;
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setQuestion("");
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: userText,
          document_id: activeDocId,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.answer) {
        setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
      } else {
        setMessage(data.detail || "Something went wrong");
      }
    } catch (err) {
      setLoading(false);
      setMessage("Something went wrong. Please try again.",err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ---- upload another PDF from inside the chat ----
  const uploadNewDoc = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are supported");
      return;
    }

    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/auth/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.document_id) {
        const newDoc = { id: data.document_id, name: file.name, size: file.size };
        setDocuments((prev) => [...prev, newDoc]);
        setActiveDocId(data.document_id);
        setSearchParams({ doc: data.document_id });
        setMessages([]);
      } else {
        setMessage(data.detail || "Upload failed");
      }
    } catch (err) {
      setMessage("Upload failed. Please try again.",err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const switchDoc = (id) => {
    setActiveDocId(id);
    setSearchParams({ doc: id });
    setMessages([]);
  };

  // ---- select text in a message to save/copy it ----
  const handleTextSelect = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();

    if (!text) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = scrollRef.current?.getBoundingClientRect();

    setSelection({
      text,
      x: rect.left + rect.width / 2 - (containerRect?.left || 0),
      y: rect.top - (containerRect?.top || 0),
    });
  };

  const saveHighlight = () => {
    if (!selection) return;
    setHighlights((prev) => [...prev, { id: Date.now(), text: selection.text }]);
    navigator.clipboard?.writeText(selection.text).catch(() => {});
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const removeHighlight = (id) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div className="ch-root">
      <div className="ch-ring ch-ring-1" />
      <div className="ch-ring ch-ring-2" />
      <span className="ch-sparkle ch-sparkle-tl">✦</span>
      <span className="ch-sparkle ch-sparkle-tr">✦</span>
      <span className="ch-sparkle ch-sparkle-bl">✦</span>
      <span className="ch-sparkle ch-sparkle-br">✦</span>

      {/* ---------- left rail: documents ---------- */}
      <aside className="ch-rail">
        <div className="ch-brand">
          <span className="ch-brand-mark">◆</span>
          <span className="ch-brand-name">DocuMind</span>
        </div>

        <span className="ch-rail-label">Documents</span>

        <div className="ch-doc-list">
          {documents.length === 0 && (
            <p className="ch-doc-empty">No documents yet — upload one to begin.</p>
          )}
          {documents.map((doc) => (
            <button
              key={doc.id}
              className={`ch-doc-card ${doc.id === activeDocId ? "ch-doc-card-active" : ""}`}
              onClick={() => switchDoc(doc.id)}
            >
              <span className="ch-doc-icon">PDF</span>
              <span className="ch-doc-meta">
                <span className="ch-doc-name">{doc.name}</span>
                {doc.size ? <span className="ch-doc-size">{formatBytes(doc.size)}</span> : null}
              </span>
            </button>
          ))}
        </div>

        <label className="ch-upload-btn">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="ch-input-hidden"
            onChange={(e) => uploadNewDoc(e.target.files?.[0])}
          />
          {isUploading ? (
            <>
              <span className="ch-spinner" /> Uploading…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Upload another PDF
            </>
          )}
        </label>
      </aside>

      {/* ---------- center: conversation ---------- */}
      <main className="ch-main">
        <header className="ch-header">
          <div>
            <h1 className="ch-title">Chat with your PDF</h1>
            {activeDoc && <p className="ch-header-sub">Talking to “{activeDoc.name}”</p>}
          </div>
          {loading && (
            <span className="ch-generating">
              Thinking<span className="ch-generating-dot" />
            </span>
          )}
        </header>

        <div className="ch-messages" ref={scrollRef} onMouseUp={handleTextSelect}>
          {messages.length === 0 && (
            <div className="ch-empty-state">
              <p>Ask anything about your document — answers will show up here.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`ch-bubble-row ${msg.role === "user" ? "ch-row-user" : ""}`}>
            <div className={`ch-bubble ${msg.role === "user" ? "ch-bubble-user" : "ch-bubble-bot"}`}>
          {msg.role === "bot" ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
            ) : (
            msg.text
      )}
    </div>
  </div>
))}

          {loading && (
            <div className="ch-bubble-row">
              <div className="ch-bubble ch-bubble-bot ch-bubble-typing">
                <span className="ch-typing-dot" />
                <span className="ch-typing-dot" />
                <span className="ch-typing-dot" />
              </div>
            </div>
          )}

          {selection && (
            <button
              className="ch-copy-float"
              style={{ left: selection.x, top: selection.y }}
              onClick={saveHighlight}
            >
              Copy / Save
            </button>
          )}
        </div>

        {message && <p className="ch-error">{message}</p>}

        <div className="ch-input-bar">
          <input
            type="text"
            placeholder="Ask a question…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="ch-input"
          />
          <button onClick={sendMessage} className="ch-send-btn" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12L20 4L13 20L11 13L4 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </main>

      {/* ---------- right panel: reserved for your copy / export feature ---------- */}
      <aside className="ch-side">
        <span className="ch-rail-label">Highlights</span>

        <div className="ch-highlight-list">
          {highlights.length === 0 ? (
            <p className="ch-doc-empty">
              Select any text in the chat to save it here for later.
            </p>
          ) : (
            highlights.map((h) => (
              <div key={h.id} className="ch-highlight-card">
                <p className="ch-highlight-text">{h.text}</p>
                <button className="ch-highlight-remove" onClick={() => removeHighlight(h.id)}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="ch-export">
          <span className="ch-rail-label">Export</span>
          <div className="ch-export-buttons">
            <button className="ch-export-btn" disabled={highlights.length === 0}>
              Word
            </button>
            <button className="ch-export-btn" disabled={highlights.length === 0}>
              PDF
            </button>
          </div>
          <p className="ch-export-note">Hook these up to your export endpoint when ready.</p>
        </div>
      </aside>
    </div>
  );
}

export default Chat;
