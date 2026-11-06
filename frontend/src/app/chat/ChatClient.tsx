"use client";

import { useState } from "react";
import { CitationCards, type Citation } from "@/components/CitationCards";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { api } from "@/lib/api";

const SUGGESTIONS = [
  "Where are regulatory sandboxes mentioned in the EU file?",
  "How do France and Germany differ on workplace AI?",
  "What risks does Mexico flag for public-sector algorithms?",
];

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  demo?: boolean;
};

export function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chat(text);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: res.answer, citations: res.citations ?? res.sources, demo: res.demo },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Could not reach the API. Is Docker running?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card chat-box">
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.4rem 0.75rem" }}
            onClick={() => send(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.92rem" }}>
            Try one of the prompts above, or ask your own question in plain English.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}`}>
            {msg.demo && (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                Demo mode: no model key is set, so this is a fixed sample answer, not a reply to your question.
              </p>
            )}
            {msg.text}
            {msg.role === "assistant" && msg.citations && <CitationCards citations={msg.citations} />}
          </div>
        ))}
        {loading && <LoadingBlock label="Searching policy corpus…" />}
      </div>
      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your question…"
          disabled={loading}
        />
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
