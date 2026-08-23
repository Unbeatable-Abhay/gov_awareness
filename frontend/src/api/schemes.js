import { apiGet, apiPost } from "./client";

function getHomeSchemes() {
  return apiGet("/home_schemes");
}

function getHomeSchemeDetails(schemeName) {
  return apiPost("/home_scheme_details", { query: schemeName });
}

function matchSchemes(query, excludeNames = []) {
  return apiPost("/scheme_match", { query, exclude: excludeNames });
}

function getSchemeDetails(schemeName, accessToken) {
  return apiPost("/scheme_details", { query: schemeName }, accessToken);
}

export { getHomeSchemes, getHomeSchemeDetails, matchSchemes, getSchemeDetails };