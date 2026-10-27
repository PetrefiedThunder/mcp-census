# mcp-census

Query the US Census Bureau API for demographic, economic, and geographic data.

> **Free API** — A free Census API key is required for data retrieval (`query_data`, `get_population`).

## Tools

| Tool | Description |
|------|-------------|
| `search_datasets` | Search available US Census Bureau datasets by keyword (e.g. 'acs', 'decennial', 'business patterns') |
| `get_variables` | List variables available in a Census dataset. Use to discover variable codes before querying data. |
| `get_geographies` | List supported geography levels for a Census dataset (state, county, tract, etc.) |
| `query_data` | Query Census Bureau data. Returns tabular data for specified variables and geography. Requires CENSUS_API_KEY. |
| `get_population` | Convenience tool: get total population (B01001_001E) for a geography. Defaults to ACS 5-year 2022. Requires CENSUS_API_KEY. |

## Installation

Node.js 20 or newer is required to run the server. To install and build this
checkout, use Node.js 20.19+ on the 20.x line or Node.js 22.12+ for the
development dependencies.

```bash
git clone https://github.com/PetrefiedThunder/mcp-census.git
cd mcp-census
npm install
npm run build
```

## API Key Setup

`query_data` and `get_population` require a free Census API key. Request one at
<https://api.census.gov/data/key_signup.html>, then export it:

```bash
export CENSUS_API_KEY=your_key_here
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "census": {
      "command": "node",
      "args": ["/path/to/mcp-census/dist/index.js"],
      "env": {
        "CENSUS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Usage with npx

```bash
CENSUS_API_KEY=your_key_here npx mcp-census
```

## License

Apache-2.0
