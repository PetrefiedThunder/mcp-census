/**
 * Census Bureau API client with rate limiting.
 */

const BASE_URL = "https://api.census.gov/data";
const RATE_LIMIT_MS = 200; // 5 req/s to be safe

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Census API ${res.status}: ${body}`);
  }
  return res;
}

function getApiKey(): string {
  const key = process.env.CENSUS_API_KEY;
  if (!key) throw new Error("CENSUS_API_KEY environment variable is required");
  return key;
}

export interface DatasetInfo {
  title: string;
  description: string;
  vintage: string;
  dataset_name: string;
  dataset_url: string;
}

/**
 * Search available Census datasets by keyword.
 */
export async function searchDatasets(query: string): Promise<DatasetInfo[]> {
  const res = await rateLimitedFetch(`${BASE_URL}.json`);
  const data = await res.json() as { dataset: Array<Record<string, unknown>> };
  const q = query.toLowerCase();
  return data.dataset
    .filter((d) => {
      const title = String(d.title ?? "").toLowerCase();
      const desc = String(d.description ?? "").toLowerCase();
      const id = (d.c_dataset as string[] | undefined)?.join("/") ?? "";
      return title.includes(q) || desc.includes(q) || id.toLowerCase().includes(q);
    })
    .slice(0, 25)
    .map((d) => {
      const parts = d.c_dataset as string[] | undefined;
      const vintage = String(d.c_vintage ?? "");
      const datasetPath = parts ? parts.join("/") : "";
      return {
        title: String(d.title ?? ""),
        description: String(d.description ?? "").slice(0, 200),
        vintage,
        dataset_name: datasetPath,
        dataset_url: `${BASE_URL}/${vintage}/${datasetPath}`,
      };
    });
}

export interface VariableInfo {
  name: string;
  label: string;
  concept: string;
  group: string;
}

/**
 * Get variables for a dataset. Optionally filter by search term.
 */
export async function getVariables(
  vintage: string,
  dataset: string,
  search?: string,
  group?: string
): Promise<VariableInfo[]> {
  let url: string;
  if (group) {
    url = `${BASE_URL}/${vintage}/${dataset}/groups/${group}.json`;
  } else {
    url = `${BASE_URL}/${vintage}/${dataset}/variables.json`;
  }
  const res = await rateLimitedFetch(url);
  const data = await res.json() as { variables: Record<string, Record<string, string>> };

  let vars = Object.entries(data.variables).map(([name, info]) => ({
    name,
    label: info.label ?? "",
    concept: info.concept ?? "",
    group: info.group ?? "",
  }));

  if (search) {
    const s = search.toLowerCase();
    vars = vars.filter(
      (v) =>
        v.name.toLowerCase().includes(s) ||
        v.label.toLowerCase().includes(s) ||
        v.concept.toLowerCase().includes(s)
    );
  }

  return vars.slice(0, 50);
}

/**
 * Get supported geographies for a dataset.
 */
export async function getGeographies(
  vintage: string,
  dataset: string
): Promise<Array<{ name: string; hierarchy: string; wildcard: string[] }>> {
  const url = `${BASE_URL}/${vintage}/${dataset}/geography.json`;
  const res = await rateLimitedFetch(url);
  const data = await res.json() as {
    fips: Array<{ name: string; geoLevelDisplay: string; requires?: string[]; wildcard?: string[] }>;
  };
  return data.fips.map((g) => ({
    name: g.name,
    hierarchy: g.geoLevelDisplay,
    wildcard: g.wildcard ?? [],
  }));
}

export interface QueryResult {
  headers: string[];
  rows: string[][];
  total_rows: number;
}

/**
 * Query Census data. Core data retrieval tool.
 */
export async function queryData(params: {
  vintage: string;
  dataset: string;
  variables: string[];
  geo_for: string;
  geo_in?: string;
  limit?: number;
}): Promise<QueryResult> {
  const key = getApiKey();
  const vars = params.variables.join(",");
  let url = `${BASE_URL}/${params.vintage}/${params.dataset}?get=NAME,${vars}&for=${params.geo_for}&key=${key}`;
  if (params.geo_in) {
    url += `&in=${params.geo_in}`;
  }

  const res = await rateLimitedFetch(url);
  const data = (await res.json()) as string[][];

  const headers = data[0];
  let rows = data.slice(1);
  const total = rows.length;
  if (params.limit && params.limit < rows.length) {
    rows = rows.slice(0, params.limit);
  }

  return { headers, rows, total_rows: total };
}

/**
 * Convenience: get population data for a geography.
 */
export async function getPopulation(params: {
  geo_for: string;
  geo_in?: string;
  vintage?: string;
  dataset?: string;
}): Promise<QueryResult> {
  const vintage = params.vintage ?? "2022";
  const dataset = params.dataset ?? "acs/acs5";
  // B01001_001E = total population
  return queryData({
    vintage,
    dataset,
    variables: ["B01001_001E"],
    geo_for: params.geo_for,
    geo_in: params.geo_in,
  });
}
