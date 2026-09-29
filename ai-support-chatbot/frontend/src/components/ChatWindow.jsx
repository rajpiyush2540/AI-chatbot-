import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../api/api";
import "./ChatWindow.css";

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow({ onStatusChange, documentInfo }) {
  const [tickets, setTickets] = useState([]); // { id, question, answer, error, time }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(crypto.randomUUID());
  const ticketCounter = useRef(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tickets, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || !documentInfo) return;

    ticketCounter.current += 1;
    const ticket = {
      id: ticketCounter.current,
      question: input,
      answer: null,
      error: null,
      time: new Date(),
    };
    setTickets((prev) => [...prev, ticket]);
    setInput("");
    setLoading(true);
    onStatusChange("busy");

    try {
      const data = await sendMessage(sessionId.current, ticket.question);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, answer: data.answer || "No answer received." } : t))
      );
    } catch (err) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, error: "Could not reach the server. Try again." } : t))
      );
    } finally {
      setLoading(false);
      onStatusChange("ready");
    }
  };

  const disabled = !documentInfo;

  return (
    <div className="thread-panel">
      <div className="thread-scroll">
        {tickets.length === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M8 12h8M8 16h5M6 4h12a2 2 0 012 2v14l-4-3H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            <div className="e-title">No tickets yet</div>
            <div className="e-sub">
              {disabled
                ? "Upload a document on the left, then ask your first question about it."
                : "Ask your first question below."}
            </div>
          </div>
        )}

        {tickets.map((t) => (
          <div className="ticket" key={t.id}>
            {t.answer && <span className="stamp">Answered</span>}
            <div className="ticket-head">
              <span className="tno">TICKET #{String(t.id).padStart(3, "0")}</span>
              <span>{fmtTime(t.time)}</span>
            </div>
            <div className="ticket-q">{t.question}</div>
            <hr className="ticket-divider" />
            {t.answer && <div className="ticket-a">{t.answer}</div>}
            {t.error && <div className="ticket-a error">{t.error}</div>}
            {!t.answer && !t.error && (
              <>
                <div className="thinking-label">Reading the file for an answer…</div>
                <div className="scan-bar" />
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="composer">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={disabled ? "Upload a document to start asking questions…" : "Ask a question about the document…"}
          disabled={disabled || loading}
        />
        <button className="ask-btn" onClick={handleSend} disabled={disabled || loading || !input.trim()}>
          Ask
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}