const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

const isRetryableStatus = (status: number) =>
  status === 429 || status >= 500;

const backoffMs = (attempt: number) => {
  const exponential = BASE_BACKOFF_MS * Math.pow(2, attempt);
  const jitter = Math.random() * BASE_BACKOFF_MS;
  return exponential + jitter;
};

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
        await delay(backoffMs(attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await delay(backoffMs(attempt));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
};
