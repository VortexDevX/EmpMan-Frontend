import { afterEach, describe, expect, it } from "vitest";
import type { AxiosAdapter, AxiosResponse } from "axios";
import { api, setApiCsrfToken } from "./api";

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  setApiCsrfToken(null);
});

function captureRequest(): { requests: AxiosResponse["config"][]; adapter: AxiosAdapter } {
  const requests: AxiosResponse["config"][] = [];
  return {
    requests,
    adapter: async (config) => {
      requests.push(config);
      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    },
  };
}

describe("remote API security", () => {
  it("always enables credentialed browser requests without an Authorization header", async () => {
    const capture = captureRequest();
    api.defaults.adapter = capture.adapter;

    await api.get("/api/v1/auth/session");

    expect(api.defaults.withCredentials).toBe(true);
    expect(capture.requests[0].headers.get("Authorization")).toBeUndefined();
  });

  it("adds the in-memory CSRF token only to state-changing requests", async () => {
    const capture = captureRequest();
    api.defaults.adapter = capture.adapter;
    setApiCsrfToken("csrf-test-token");

    await api.get("/api/v1/profile");
    await api.post("/api/v1/profile", { name: "Test" });

    expect(capture.requests[0].headers.get("X-CSRF-Token")).toBeUndefined();
    expect(capture.requests[1].headers.get("X-CSRF-Token")).toBe("csrf-test-token");
  });

  it("normalizes legacy API paths", async () => {
    const capture = captureRequest();
    api.defaults.adapter = capture.adapter;

    await api.get("/api/employees");

    expect(capture.requests[0].url).toBe("/api/v1/employees");
  });
});
