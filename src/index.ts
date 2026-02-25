#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  searchDatasets,
  getVariables,
  getGeographies,
  queryData,
  getPopulation,
} from "./census-client.js";

const server = new McpServer({
  name: "mcp-census",
  version: "1.0.0",
});

server.tool(
  "search_datasets",
  "Search available US Census Bureau datasets by keyword (e.g. 'acs', 'decennial', 'business patterns')",
  { query: z.string().describe("Search keyword") },
  async ({ query }) => {
    const results = await searchDatasets(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "get_variables",
  "List variables available in a Census dataset. Use to discover variable codes before querying data.",
  {
    vintage: z.string().describe("Year, e.g. '2022'"),
    dataset: z.string().describe("Dataset path, e.g. 'acs/acs5' or 'dec/pl'"),
    search: z.string().optional().describe("Filter variables by keyword"),
    group: z.string().optional().describe("Variable group code, e.g. 'B01001'"),
  },
  async ({ vintage, dataset, search, group }) => {
    const results = await getVariables(vintage, dataset, search, group);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "get_geographies",
  "List supported geography levels for a Census dataset (state, county, tract, etc.)",
  {
    vintage: z.string().describe("Year, e.g. '2022'"),
    dataset: z.string().describe("Dataset path, e.g. 'acs/acs5'"),
  },
  async ({ vintage, dataset }) => {
    const results = await getGeographies(vintage, dataset);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "query_data",
  "Query Census Bureau data. Returns tabular data for specified variables and geography. Requires CENSUS_API_KEY.",
  {
    vintage: z.string().describe("Year, e.g. '2022'"),
    dataset: z.string().describe("Dataset path, e.g. 'acs/acs5'"),
    variables: z.array(z.string()).describe("Variable codes, e.g. ['B01001_001E', 'B19013_001E']"),
    geo_for: z.string().describe("Geography selector, e.g. 'state:*' or 'county:037'"),
    geo_in: z.string().optional().describe("Parent geography, e.g. 'state:06'"),
    limit: z.number().optional().describe("Max rows to return"),
  },
  async (params) => {
    const results = await queryData(params);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.tool(
  "get_population",
  "Convenience tool: get total population (B01001_001E) for a geography. Defaults to ACS 5-year 2022.",
  {
    geo_for: z.string().describe("Geography selector, e.g. 'state:*' or 'county:*'"),
    geo_in: z.string().optional().describe("Parent geography, e.g. 'state:06'"),
    vintage: z.string().optional().describe("Year (default '2022')"),
    dataset: z.string().optional().describe("Dataset (default 'acs/acs5')"),
  },
  async (params) => {
    const results = await getPopulation(params);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
