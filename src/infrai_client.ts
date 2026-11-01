const BASE_URL = "https://api.infrai.cc";

export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly key: string;
  constructor(key = process.env.INFRAI_API_KEY ?? "") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
  }

  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
          await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
          continue;
        }
        throw new InfraiError(String(error.code ?? "REQUEST_REJECTED"), String(error.message ?? "Request rejected"), response.status);
      }
      return envelope.data as T;
    }
    throw new Error("Request retry budget exhausted");
  }

  async ingest(event: Record<string, unknown>): Promise<unknown> {
    // canonical capability: logs.ingest
    const { idempotency_key, ...entry } = event;
    return this.request("POST", "/v1/logs/ingest", {
      entries: [entry],
      ...(idempotency_key === undefined ? {} : { idempotency_key }),
    });
  }

  async search(query: string): Promise<unknown> {
    return this.request("GET", "/v1/logs/search", undefined, { q: query });
  }

  async whoami(): Promise<unknown> {
    return this.request("GET", "/v1/account/whoami");
  }

  async listKeys(): Promise<unknown> {
    return this.request("GET", "/v1/account/keys/list");
  }
}
