import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchDatasets, getVariables, getGeographies, queryData, getPopulation } from "./census-client.js";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CENSUS_API_KEY = "test-key-123";
});

function mockJsonResponse(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data),
  });
}

describe("searchDatasets", () => {
  it("filters datasets by keyword", async () => {
    mockJsonResponse({
      dataset: [
        { title: "American Community Survey 5-Year", description: "ACS 5-year estimates", c_dataset: ["acs", "acs5"], c_vintage: "2022" },
        { title: "County Business Patterns", description: "CBP data", c_dataset: ["cbp"], c_vintage: "2022" },
      ],
    });
    const results = await searchDatasets("acs");
    expect(results).toHaveLength(1);
    expect(results[0].title).toContain("American Community Survey");
    expect(results[0].dataset_name).toBe("acs/acs5");
    expect(results[0].vintage).toBe("2022");
  });

  it("returns empty for no matches", async () => {
    mockJsonResponse({ dataset: [{ title: "CBP", description: "business", c_dataset: ["cbp"], c_vintage: "2020" }] });
    const results = await searchDatasets("xyznothing");
    expect(results).toHaveLength(0);
  });
});

describe("getVariables", () => {
  it("returns and filters variables", async () => {
    mockJsonResponse({
      variables: {
        B01001_001E: { label: "Total Population", concept: "SEX BY AGE", group: "B01001" },
        B19013_001E: { label: "Median Household Income", concept: "INCOME", group: "B19013" },
      },
    });
    const results = await getVariables("2022", "acs/acs5", "population");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("B01001_001E");
  });

  it("fetches group-specific variables", async () => {
    mockJsonResponse({ variables: { B01001_001E: { label: "Total", concept: "SEX BY AGE", group: "B01001" } } });
    await getVariables("2022", "acs/acs5", undefined, "B01001");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/groups/B01001.json"));
  });
});

describe("getGeographies", () => {
  it("parses geography response", async () => {
    mockJsonResponse({
      fips: [
        { name: "state", geoLevelDisplay: "040", wildcard: ["state"] },
        { name: "county", geoLevelDisplay: "050", requires: ["state"], wildcard: ["county"] },
      ],
    });
    const results = await getGeographies("2022", "acs/acs5");
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("state");
  });
});

describe("queryData", () => {
  it("constructs correct URL and parses response", async () => {
    mockJsonResponse([
      ["NAME", "B01001_001E", "state"],
      ["California", "39538223", "06"],
      ["Texas", "29145505", "48"],
    ]);
    const result = await queryData({
      vintage: "2022",
      dataset: "acs/acs5",
      variables: ["B01001_001E"],
      geo_for: "state:*",
    });
    expect(result.headers).toEqual(["NAME", "B01001_001E", "state"]);
    expect(result.rows).toHaveLength(2);
    expect(result.total_rows).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("key=test-key-123"));
  });

  it("includes geo_in when specified", async () => {
    mockJsonResponse([["NAME", "B01001_001E", "state", "county"], ["Los Angeles", "10000000", "06", "037"]]);
    await queryData({
      vintage: "2022",
      dataset: "acs/acs5",
      variables: ["B01001_001E"],
      geo_for: "county:037",
      geo_in: "state:06",
    });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("&in=state:06"));
  });

  it("respects limit", async () => {
    mockJsonResponse([
      ["NAME", "B01001_001E", "state"],
      ["A", "1", "01"], ["B", "2", "02"], ["C", "3", "03"],
    ]);
    const result = await queryData({
      vintage: "2022",
      dataset: "acs/acs5",
      variables: ["B01001_001E"],
      geo_for: "state:*",
      limit: 1,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.total_rows).toBe(3);
  });

  it("throws without API key", async () => {
    delete process.env.CENSUS_API_KEY;
    await expect(
      queryData({ vintage: "2022", dataset: "acs/acs5", variables: ["B01001_001E"], geo_for: "state:*" })
    ).rejects.toThrow("CENSUS_API_KEY");
  });
});

describe("getPopulation", () => {
  it("uses defaults and calls B01001_001E", async () => {
    mockJsonResponse([
      ["NAME", "B01001_001E", "state"],
      ["California", "39538223", "06"],
    ]);
    const result = await getPopulation({ geo_for: "state:06" });
    expect(result.rows[0][0]).toBe("California");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("acs/acs5"));
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("B01001_001E"));
  });
});
