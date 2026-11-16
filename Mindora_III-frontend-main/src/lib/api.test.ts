import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { apiFetch, getAccessToken, onAccessTokenChange, setAccessToken } from "@/lib/api";

describe("apiFetch session expiry", () => {
  const originalFetch = global.fetch;

  beforeEach(() => setAccessToken("expired-access-token"));
  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      Reflect.deleteProperty(global, "fetch");
    }
    setAccessToken(null);
  });

  it("clears the access token when the refresh request also returns 401", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const tokenListener = jest.fn();
    const unsubscribe = onAccessTokenChange(tokenListener);
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const message = url.endsWith("/api/v1/auth/refresh")
        ? "Refresh session expired"
        : "Access token expired";
      return {
        ok: false,
        status: 401,
        json: async () => ({ message }),
      } as Response;
    });
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: fetchMock,
    });

    await expect(apiFetch("/api/v1/mood/screenings")).rejects.toMatchObject({
      status: 401,
      message: "Access token expired",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/api/v1/auth/refresh");
    expect(getAccessToken()).toBeNull();
    expect(tokenListener).toHaveBeenCalledWith(null);
    unsubscribe();
  });

  it("notifies subscribers when the token changes and stops after unsubscribe", () => {
    const tokenListener = jest.fn();
    const unsubscribe = onAccessTokenChange(tokenListener);

    setAccessToken("refreshed-access-token");
    setAccessToken("refreshed-access-token");
    setAccessToken(null);
    unsubscribe();
    setAccessToken("later-access-token");

    expect(tokenListener.mock.calls).toEqual([["refreshed-access-token"], [null]]);
  });

  it("notifies subscribers when an API request refreshes the access token", async () => {
    const tokenListener = jest.fn();
    const unsubscribe = onAccessTokenChange(tokenListener);
    const fetchMock = jest
      .fn<(...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>>()
      .mockResolvedValueOnce({ ok: false, status: 401 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: "refreshed-access-token" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ result: "ok" }),
      } as Response);
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: fetchMock,
    });

    await expect(apiFetch("/api/v1/mood/screenings")).resolves.toEqual({
      result: "ok",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(tokenListener).toHaveBeenCalledWith("refreshed-access-token");
    const retryOptions = fetchMock.mock.calls[2]?.[1] as RequestInit;
    expect(retryOptions.headers).toMatchObject({
      Authorization: "Bearer refreshed-access-token",
    });
    unsubscribe();
  });
});
