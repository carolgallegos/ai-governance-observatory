# AGRI methodology (working paper)

**AGRI** — AI Governance Readiness Index — is a composite I use inside this observatory. It is **not** published by any international body.

## Why these five dimensions?

I chose regulation, investment, education, open data, and research because they show up in almost every national AI strategy I read. They are imperfect proxies, but they are comparable across the eight jurisdictions in the seed.

| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Regulation | 25% | Is there a clear rulebook, enforcement, sandboxes? |
| Investment | 15% | Public money, compute, industrial policy |
| Education | 20% | Skills, universities, workforce programmes |
| Open data | 15% | Can outsiders audit what the state does with data? |
| Research | 25% | Institutes, publications, international links |

## Scoring

Each dimension is scored **0–5** by hand when I enter the seed. I convert to percent, apply weights, round to one decimal. Formula lives in `backend/app/services/scoring.py`.

## Limits

- Eight entities, not the whole world.  
- EU appears as a bloc; member states also have their own rows.  
- Scores reflect my reading at import time — they will age.  
- I do not claim statistical significance; this is for **comparison and teaching**, not league tables in the press.

## Changes

If I update weights, I will note the version here and bump the year on stored scores.
