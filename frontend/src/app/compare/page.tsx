import { CompareClient } from "./CompareClient";
import { api } from "@/lib/api";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a = "MX", b = "FR" } = await searchParams;
  let countries: Awaited<ReturnType<typeof api.countries>> = [];
  try {
    countries = await api.countries();
  } catch {
    /* empty */
  }
  return (
    <>
      <section className="hero">
        <p className="hero-eyebrow">Pairwise analysis</p>
        <h1>Compare jurisdictions</h1>
        <p className="hero-lead">
          Side-by-side notes on regulation, privacy, generative AI, education, and stated risks — plus a radar
          chart and a similarity estimate from the AGRI dimensions.
        </p>
      </section>
      <CompareClient countries={countries} initialA={a} initialB={b} />
    </>
  );
}
