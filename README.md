# mcp-census

Query the US Census Bureau API for demographic, economic, and geographic data.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `search_datasets` | Search available US Census Bureau datasets by keyword (e.g. 'acs', 'decennial', 'business patterns') |
| `get_variables` | List variables available in a Census dataset. Use to discover variable codes before querying data. |
| `get_geographies` | List supported geography levels for a Census dataset (state, county, tract, etc.) |
| `query_data` | Query Census Bureau data. Returns tabular data for specified variables and geography. Requires CENSUS_API_KEY. |
| `get_population` | Convenience tool: get total population (B01001_001E) for a geography. Defaults to ACS 5-year 2022. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-census.git
cd mcp-census
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "census": {
      "command": "node",
      "args": ["/path/to/mcp-census/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-census
```

## License

MIT
