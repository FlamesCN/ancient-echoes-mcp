# Ancient Echoes MCP stdio bridge.
# The computation engine stays on https://www.ancientechoes.ai; this image only
# speaks MCP over stdio and forwards tools/call with the caller's own token.
FROM node:22-alpine
WORKDIR /app
COPY server/tools.json server/index.mjs ./server/
ENV ANCIENT_ECHOES_BASE_URL=https://www.ancientechoes.ai
ENTRYPOINT ["node", "/app/server/index.mjs"]
