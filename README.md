# Ancient Echoes MCP

Ancient Echoes exposes deterministic Chinese metaphysics computation as a remote
[MCP](https://modelcontextprotocol.io) server: BaZi (Four Pillars), Zi Wei Dou Shu,
Qi Men Dun Jia, Qi Zheng Si Yu, Vedic and Western astrology, Liu Yao, Mei Hua, Da Liu Ren,
Xiao Liu Ren, Tai Yi, almanac and election-day evidence.

The computation engine stays on our servers. This repository only contains the client-side
skill and setup notes, so any client that speaks MCP can call the same versioned tools.

## What you get

| Layer | Free account | Paid plans |
| --- | --- | --- |
| `chart` / `divination` / `election` basic tools | ✅ | ✅ |
| Topic tools (pattern, favorable elements, wealth, group, naming, family) | — | ✅ |
| `lingxi.rag_query` | Billed against your AI plan | Billed against your AI plan |

Every tool response carries `calculationCapability` / `calculationVersion` so results stay
reproducible across releases.

## 1. Get an API key

Sign in at <https://www.ancientechoes.ai> and open **User Center → LingXi Devices**:

- **Web API Key** (`sk-…`): simplest for MCP clients.
- **Device token** (`lxd_…`): pair a machine with a short code; it carries the `mcp` scope by
  default and can be rotated or revoked without touching your password.

Either credential reaches `POST /api/v1/mcp` and `POST /api/v1/tools/:name`.

## 2. Connect an MCP client

Endpoint: `https://www.ancientechoes.ai/api/v1/mcp` (Streamable HTTP).
The server speaks protocol versions `2026-07-28`, `2025-11-25`, `2025-06-18` and `2025-03-26`.

<details>
<summary>Claude Code / Cursor / Codex (Bearer header)</summary>

```json
{
  "mcpServers": {
    "ancient-echoes": {
      "url": "https://www.ancientechoes.ai/api/v1/mcp",
      "transport": "streamable-http",
      "headers": {
        "Authorization": "Bearer sk-your-key"
      }
    }
  }
}
```

</details>

<details>
<summary>Verify with curl (2026-07-28)</summary>

```bash
curl -sS https://www.ancientechoes.ai/api/v1/mcp \
  -H "Authorization: Bearer $ANCIENT_ECHOES_TOKEN" \
  -H "Content-Type: application/json" \
  -H "MCP-Protocol-Version: 2026-07-28" \
  -H "Mcp-Method: server/discover" \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28"}}}'
```

Modern requests must send `MCP-Protocol-Version`, `Mcp-Method`, and (for `tools/call`)
`Mcp-Name` matching the request body. Legacy clients can keep using `initialize`.

</details>

## 3. Call a tool

```bash
curl -sS https://www.ancientechoes.ai/api/v1/tools/bazi.calculate_chart \
  -H "Authorization: Bearer $ANCIENT_ECHOES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input_mode":"birth","year":1990,"month":6,"day":15,"hour":9,"minute":30,
       "is_male":true,"calendar_type":"solar","is_leap_month":false,
       "cast_time_source":"birth","timezone_id":"Asia/Shanghai",
       "split_zi_hour":true,"use_true_time":false,"apply_dst":false}'
```

Rules that matter:

- Pass an explicit civil time, calendar, timezone and (for true solar time) coordinates.
  The server never fills missing fields with its own clock or a default city.
- Paid tools return `tool_entitlement_required` when your plan does not include the feature.
- Quota: 200 tool calls/day and 30 calls/minute per user by default (`429` +
  `tool_quota_exceeded` when exceeded).
- All current tools are read-only. Results are evidence for human reading, not medical,
  legal, investment or life-decision advice.

## Skill

`ancient-echoes-mcp/SKILL.md` teaches an agent how to discover tools, collect the minimum
required parameters, respect entitlements, and report results without inventing
predictions. Drop it into your agent's skills directory.

## License

MIT. The server-side engine, knowledge base and datasets are not part of this repository.
