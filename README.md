# mcp-census

An MCP (Model Context Protocol) server that wraps the US Census Bureau API, giving AI agents access to demographic data, population statistics, and thousands of Census datasets.

## Features

- **search_datasets** — Search 1,700+ Census datasets by keyword
- **get_variables** — Discover variable codes for any dataset (with filtering)
- **get_geographies** — List supported geography levels (state, county, tract, etc.)
- **query_data** — Query any Census dataset with arbitrary variables and geography
- **get_population** — Convenience wrapper for total population data

## Getting a Free API Key

1. Visit [https://api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html)
2. Fill in your name and email
3. Check your email for the API key (arrives in minutes)
4. Set it as an environment variable: `export CENSUS_API_KEY=your_key_here`

The key is **completely free** with no usage limits beyond reasonable rate limiting.

## Installation

```bash
npm install
npm run build
```

## Usage with MCP

Add to your MCP client config:

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

## Example Queries

**Get population of all US states:**
```
Tool: get_population
geo_for: "state:*"
```

**Get population of all counties in California:**
```
Tool: get_population
geo_for: "county:*"
geo_in: "state:06"
```

**Query median household income by state:**
```
Tool: query_data
vintage: "2022"
dataset: "acs/acs5"
variables: ["B19013_001E"]
geo_for: "state:*"
```

**Search for available datasets:**
```
Tool: search_datasets
query: "decennial"
```

## Common Variable Codes

| Code | Description |
|------|-------------|
| B01001_001E | Total Population |
| B01002_001E | Median Age |
| B19013_001E | Median Household Income |
| B25077_001E | Median Home Value |
| B23025_005E | Unemployed Population |
| B15003_022E | Bachelor's Degree holders |

## Common Geography Codes

| Format | Description |
|--------|-------------|
| `state:*` | All states |
| `state:06` | California |
| `county:*` | All counties (use with `geo_in`) |
| `county:037` | LA County (with `geo_in: state:06`) |
| `place:*` | All places/cities (use with `geo_in`) |
| `us:*` | United States total |

## Development

```bash
npm run dev     # Run with tsx
npm test        # Run tests
npm run build   # Compile TypeScript
```

## License

MIT
