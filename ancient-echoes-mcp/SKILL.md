---
name: ancient-echoes-mcp
description: Call Ancient Echoes MCP tools for BaZi, Zi Wei, Qi Men, astrology, divination, almanac and election questions; discover tools first, collect only required fields, respect entitlements and report calculation provenance.
triggers:
  - bazi chart
  - four pillars
  - zi wei
  - qimen
  - chinese astrology
  - almanac
  - election date
  - divination
argument-hint: "<metaphysics, almanac or election request>"
---

# Ancient Echoes MCP

## Purpose

Use the authenticated Ancient Echoes MCP server for deterministic Chinese metaphysics
computation. The server owns the engine; this skill only teaches how to discover tools,
supply inputs, and report results honestly.

## When to use

Use for BaZi (Four Pillars), Zi Wei Dou Shu, Qi Men Dun Jia, Qi Zheng Si Yu, Vedic or
Western astrology, Liu Yao, Mei Hua, Da Liu Ren, Xiao Liu Ren, Tai Yi, almanac lookup,
solar terms and election-day screening.

## Workflow

1. Call `tools/list` (or `server/discover` on protocol `2026-07-28`). Use only tools the
   server actually returns; never invent a tool name.
2. Read and keep `calculationCapability`, `calculationVersion`, `requiredEntitlement` and
   `readOnly` from each tool definition.
3. Collect the schema's required fields. Ask for the minimum: birth date, clock time,
   calendar (solar/lunar), leap month, gender, IANA timezone or UTC offset, and coordinates
   only when true solar time or house systems need them. Never ask for ID numbers, exact
   street addresses or unrelated personal data.
4. If the user's time is uncertain (DST, timezone, birth time precision), keep that
   uncertainty in the answer instead of silently choosing a value. The server rejects
   incomplete input; do not fill gaps yourself.
5. Call `tools/call`. Handle these codes explicitly:
   - `tool_authentication_required` — the key is missing or invalid.
   - `tool_entitlement_required` — the plan does not include the feature; say which one is
     needed. Never retry with another key or fabricate a result.
   - `tool_quota_exceeded` — daily or burst quota reached; report the retry window.
6. Verify `apiVersion` (tool API contract) and `calculation` (`capability` + `version`).
   If they disagree with the tool definition, treat it as a server contract error and stop.
7. Report verifiable structure first (pillars, dates, matched almanac entries, relations),
   then conditional interpretation. State the calculation capability and version so the
   user can reproduce it.

## Boundaries

- Current tools are read-only; do not claim to create, save or modify records.
- Do not present results as certain predictions, and do not turn them into medical, legal,
  investment or safety advice.
- Do not infer facts the tool did not return: scores, rankings, compatibility percentages,
  event dates, family composition or health outcomes.
- Do not treat two branches in the same harmony group as a completed combination unless the
  tool says the full set is present.

## Example

```json
{
  "method": "tools/call",
  "params": {
    "name": "bazi.calculate_chart",
    "arguments": {
      "input_mode": "birth",
      "year": 1990, "month": 6, "day": 15, "hour": 9, "minute": 30,
      "is_male": true, "calendar_type": "solar", "is_leap_month": false,
      "cast_time_source": "birth", "timezone_id": "Asia/Shanghai",
      "split_zi_hour": true, "use_true_time": false, "apply_dst": false
    }
  }
}
```

Connection details, credentials and quota live in `README.md`.
