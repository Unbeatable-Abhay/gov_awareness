import { apiGet, apiPost } from "./client";

function getHomeSchemes() {
  return apiGet("/home_schemes");
}

function getHomeSchemeDetails(schemeName) {
  return apiPost("/home_scheme_details", { query: schemeName });
}

export { getHomeSchemes, getHomeSchemeDetails };