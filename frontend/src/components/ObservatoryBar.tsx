import Link from "next/link";
import { api } from "@/lib/api";

export async function ObservatoryBar() {
  let meta: Awaited<ReturnType<typeof api.observatoryMeta>> | null = null;
  try {
    meta = await api.observatoryMeta();
  } catch {
    meta = null;
  }

  if (!meta) return null;

  const formatted = new Date(meta.last_updated).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="observatory-bar" role="complementary" aria-label="Observatory metadata">
      <div className="observatory-bar-inner">
        <span>
          <strong>Last updated</strong> {formatted}
        </span>
        <span className="observatory-bar-sep" aria-hidden>
          ·
        </span>
        <span>
          <strong>{meta.jurisdictions}</strong> jurisdictions
        </span>
        <span className="observatory-bar-sep" aria-hidden>
          ·
        </span>
        <span>
          <strong>{meta.governance_frameworks}</strong> governance frameworks
        </span>
        <span className="observatory-bar-sep" aria-hidden>
          ·
        </span>
        <span>
          <strong>{meta.policy_sources}</strong> policy sources indexed
        </span>
        <span className="observatory-bar-sep" aria-hidden>
          ·
        </span>
        <Link href="/methodology">Methodology</Link>
      </div>
    </div>
  );
}
