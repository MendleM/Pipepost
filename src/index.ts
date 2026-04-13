import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  seoScoreSchema, handleSeoScore,
  seoMetaSchema, handleSeoMeta,
  seoSchemaInput, handleSeoSchema,
} from "./tools/seo-tools.js";

import {
  publishSchema, handlePublish,
  listPostsSchema, handleListPosts,
} from "./tools/publish-tools.js";

import {
  setupSchema, handleSetup,
  activateSchema, handleActivate,
  handleStatus,
} from "./tools/setup-tools.js";

const server = new McpServer({
  name: "pipepost",
  version: "0.1.0",
});

// SEO Tools
server.tool("seo_score", "Analyze content for SEO quality — readability, keyword density, heading structure, and actionable suggestions", seoScoreSchema.shape, async (input) => {
  const result = await handleSeoScore(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("seo_meta", "Generate meta title, description, and Open Graph tags from content [Pro]", seoMetaSchema.shape, async (input) => {
  const result = await handleSeoMeta(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("seo_schema", "Generate JSON-LD structured data (Article, FAQ, HowTo) [Pro]", seoSchemaInput.shape, async (input) => {
  const result = await handleSeoSchema(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// Publishing Tools
server.tool("publish", "Publish content to a CMS platform (Dev.to free, others Pro)", publishSchema.shape, async (input) => {
  const result = await handlePublish(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("list_posts", "List published and draft posts on a platform [Pro]", listPostsSchema.shape, async (input) => {
  const result = await handleListPosts(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

// Setup Tools
server.tool("setup", "Configure API credentials for a platform", setupSchema.shape, async (input) => {
  const result = await handleSetup(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("activate", "Activate a Pipepost Pro license key", activateSchema.shape, async (input) => {
  const result = await handleActivate(input as never);
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

server.tool("status", "Show current Pipepost configuration and license status", {}, async () => {
  const result = await handleStatus();
  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Pipepost MCP server failed to start:", err);
  process.exit(1);
});
