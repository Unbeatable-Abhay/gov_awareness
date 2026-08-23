import { apiPost } from "./client";

function getLegalAdvisory(query, accessToken) {
  return apiPost("/legal_advisory", { query }, accessToken);
}

export { getLegalAdvisory };