import json

from app.core.config import settings


def uses_live_model() -> bool:
    if settings.llm_provider == "openai":
        return bool(settings.openai_api_key)
    if settings.llm_provider == "anthropic":
        return bool(settings.anthropic_api_key)
    return False


async def generate_completion(system: str, user: str) -> str:
    if settings.llm_provider == "openai" and settings.openai_api_key:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        return resp.choices[0].message.content or ""

    if settings.llm_provider == "anthropic" and settings.anthropic_api_key:
        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        resp = await client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2048,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return resp.content[0].text

    return _mock_response(system, user)


def _mock_response(system: str, user: str) -> str:
    if "JSON" in system.upper() or "json" in user.lower():
        return json.dumps(
            {
                "objectives": [
                    "Promote trustworthy and human-centric AI adoption",
                    "Strengthen governance and risk management capacity",
                    "Support innovation with clear accountability",
                ],
                "risks": [
                    "Algorithmic bias and discrimination",
                    "Lack of transparency in high-impact systems",
                    "Insufficient regulatory enforcement capacity",
                ],
                "recommendations": [
                    "Establish national AI governance coordination body",
                    "Mandate impact assessments for high-risk use cases",
                    "Invest in AI literacy and interdisciplinary training",
                ],
                "disclaimer": "Generated in mock mode. Set LLM_PROVIDER=openai for live analysis.",
            }
        )
    return (
        "From the curated country files (mock mode — no live model):\n\n"
        "Sandboxes show up most clearly under the EU AI Act framework; France and Germany route them through "
        "national regulators. Mexico and Brazil reference pilots in strategy text but with thinner detail. "
        "The US tends to run sector-specific experiments rather than a single federal sandbox.\n\n"
        "France vs Germany: both sit under the EU Act and GDPR, but France stresses sovereign compute and "
        "industrial capacity; Germany stresses Mittelstand adoption and co-determination in workplace AI.\n\n"
        "Add OPENAI_API_KEY in .env if you want answers grounded in uploaded PDFs."
    )
