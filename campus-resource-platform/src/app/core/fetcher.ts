export interface FetcherOptions extends RequestInit {
    retries?: number;
    backoffMs?: number;
    timeoutMs?: number;
    onError?: (error: Error, status?: number) => void;
    onUnauthorized?: () => void;
}

export class FetchError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'FetchError';
    }
}

/**
 * Universal resilient fetcher with exponential backoff, request timeout,
 * and automatic 401 unauthenticated redirect handling.
 */
export async function resilientFetch<T = unknown>(
    url: string,
    options: FetcherOptions = {}
): Promise<T> {
    const {
        retries = 3,
        backoffMs = 400,
        timeoutMs = 12000,
        onError,
        onUnauthorized,
        ...fetchOptions
    } = options;

    let attempt = 0;
    let delay = backoffMs;

    while (attempt <= retries) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });

            clearTimeout(timer);

            if (response.status === 401) {
                if (onUnauthorized) {
                    onUnauthorized();
                } else if (typeof window !== 'undefined') {
                    localStorage.removeItem('uid');
                    sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
                    window.location.href = '/login';
                }
                throw new FetchError('Session expired. Please log in again.', 401);
            }

            if (response.status === 403) {
                throw new FetchError('Access denied. You do not have permission.', 403);
            }

            if (!response.ok) {
                let errorData: unknown;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = await response.text();
                }

                // If 5xx server error and retry attempts remain, perform backoff
                if (response.status >= 500 && attempt < retries) {
                    attempt++;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2;
                    continue;
                }

                throw new FetchError(
                    (errorData as Record<string, string>)?.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorData
                );
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return (await response.json()) as T;
            }
            return (await response.text()) as unknown as T;
        } catch (err: unknown) {
            clearTimeout(timer);

            const isAbort = (err as Error)?.name === 'AbortError';
            const errorMessage = isAbort
                ? `Request timed out after ${timeoutMs}ms`
                : (err as Error)?.message || 'Network request failed';

            if (attempt < retries && !isAbort && !(err instanceof FetchError && err.status < 500)) {
                attempt++;
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2;
                continue;
            }

            const finalError = err instanceof FetchError ? err : new FetchError(errorMessage, 0);
            if (onError) {
                onError(finalError, finalError.status);
            }
            throw finalError;
        }
    }

    throw new FetchError('Maximum fetch retries exceeded', 0);
}
