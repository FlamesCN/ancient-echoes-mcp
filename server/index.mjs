#!/usr/bin/env node
// Ancient Echoes MCP — stdio bridge.
//
// The engine stays on the hosted server. This process only speaks MCP over
// stdio and forwards `tools/call` to `POST /api/v1/tools/<name>` with the
// caller's own credential. `initialize` / `tools/list` / `ping` never touch the
// network, so registry probes and client discovery work without a token.
//
// Env:
//   ANCIENT_ECHOES_TOKEN      Web API Key (sk-…) or device token (lxd_…)
//   ANCIENT_ECHOES_BASE_URL   default https://www.ancientechoes.ai
//   ANCIENT_ECHOES_TIMEOUT_MS default 45000

import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const catalog = JSON.parse(readFileSync(path.join(here, 'tools.json'), 'utf8'))
const SUPPORTED_VERSIONS = ['2026-07-28', '2025-11-25', '2025-06-18', '2025-03-26']
const SERVER_INFO = { name: 'ancient-echoes-mcp', version: '1.0.1' }

const baseUrl = (process.env.ANCIENT_ECHOES_BASE_URL ?? 'https://www.ancientechoes.ai').replace(/\/+$/u, '')
const timeoutMs = Number(process.env.ANCIENT_ECHOES_TIMEOUT_MS ?? 45_000)

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function result(id, value) {
  send({ jsonrpc: '2.0', id, result: value })
}

function error(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data === undefined ? {} : { data }) } })
}

async function callTool(name, args) {
  const token = (process.env.ANCIENT_ECHOES_TOKEN ?? '').trim()
  if (!token) {
    throw Object.assign(new Error('Ancient Echoes 未鉴权：设置 ANCIENT_ECHOES_TOKEN（Web API Key 或设备令牌）后重试。'), { code: -32001 })
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error(`请求超时（${timeoutMs}ms）`)), timeoutMs)
  let response
  try {
    response = await fetch(`${baseUrl}/api/v1/tools/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        accept: 'application/json',
        'user-agent': `${SERVER_INFO.name}/${SERVER_INFO.version}`,
      },
      body: JSON.stringify(args ?? {}),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    throw Object.assign(new Error(`服务端返回了非 JSON 响应：${text.slice(0, 200)}`), { code: -32603 })
  }
  if (!response.ok || body.success === false) {
    const code = body.code ?? `http_${response.status}`
    throw Object.assign(new Error(`[${code}] ${body.message ?? '远程工具调用失败'}`), { code: -32002, status: response.status })
  }
  return body
}

async function handle(message) {
  const { id, method, params } = message
  if (method === 'initialize') {
    const requested = params?.protocolVersion
    result(id, {
      protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : '2025-11-25',
      capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER_INFO,
      instructions: `Ancient Echoes deterministic metaphysics tools. ${catalog.tools.length} read-only tools; results carry calculation capability/version. Set ANCIENT_ECHOES_TOKEN to call them.`,
    })
    return
  }
  if (method === 'server/discover') {
    result(id, {
      supportedVersions: SUPPORTED_VERSIONS,
      capabilities: { tools: { listChanged: false } },
      instructions: 'Ancient Echoes deterministic metaphysics tools.',
    })
    return
  }
  if (method === 'ping') {
    result(id, {})
    return
  }
  if (method === 'tools/list') {
    result(id, { tools: catalog.tools })
    return
  }
  if (method === 'tools/call') {
    try {
      const body = await callTool(params?.name, params?.arguments)
      result(id, {
        content: [{ type: 'text', text: JSON.stringify(body.data ?? body) }],
        structuredContent: body,
        isError: false,
      })
    } catch (cause) {
      result(id, {
        content: [{ type: 'text', text: String(cause.message ?? cause) }],
        isError: true,
      })
    }
    return
  }
  error(id, -32601, `Method not found: ${method}`)
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
rl.on('line', (line) => {
  const trimmed = line.trim()
  if (!trimmed) return
  let message
  try {
    message = JSON.parse(trimmed)
  } catch {
    error(null, -32700, 'Parse error')
    return
  }
  // notifications have no id and must not receive a response
  if (message.id === undefined || message.id === null) return
  handle(message).catch((cause) => error(message.id, -32603, String(cause.message ?? cause)))
})
