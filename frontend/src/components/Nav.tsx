import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          <span className="logo-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="M3 12h18M12 3c2.5 2.8 4 6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </svg>
          </span>
          <span className="logo-text">
            <span className="logo-title">AI Governance Observatory</span>
            <span className="logo-tagline">Compare national AI policy</span>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/">Overview</Link>
          <Link href="/compare">Compare</Link>
          <Link href="/documents">Documents</Link>
          <Link href="/chat">Analyst</Link>
        </div>
      </div>
    </nav>
  );
}
