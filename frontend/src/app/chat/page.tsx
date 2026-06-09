import { ChatClient } from "./ChatClient";

export default function ChatPage() {
  return (
    <>
      <section className="hero">
        <p className="hero-eyebrow">Analyst desk</p>
        <h1>Ask with sources attached</h1>
        <p className="hero-lead">
          Questions run against uploaded PDFs when available; otherwise the desk falls back to the curated
          country files. Every reply lists where the text came from — page and confidence when I have them.
        </p>
      </section>
      <ChatClient />
    </>
  );
}
