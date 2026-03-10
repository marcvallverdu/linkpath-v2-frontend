import type { TestRequest, TestJobResponse, TestStatusResponse } from "./types";

export async function submitTest(
  apiBaseUrl: string,
  apiKey: string,
  payload: TestRequest
): Promise<TestJobResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as TestJobResponse;
}

export async function submitBatch(
  apiBaseUrl: string,
  apiKey: string,
  tests: TestRequest[]
) {
  const response = await fetch(`${apiBaseUrl}/api/v1/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey
    },
    body: JSON.stringify({ tests })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as {
    batchId: string;
    jobs: TestJobResponse[];
  };
}

export async function fetchStatus(
  apiBaseUrl: string,
  apiKey: string,
  statusUrl: string
): Promise<TestStatusResponse> {
  const url = statusUrl.startsWith("http")
    ? statusUrl
    : `${apiBaseUrl}${statusUrl}`;
  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as TestStatusResponse;
}
