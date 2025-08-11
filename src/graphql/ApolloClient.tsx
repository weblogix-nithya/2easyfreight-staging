import {
  ApolloClient,
  ApolloLink,
  from,
  HttpOptions,
  InMemoryCache,
  NormalizedCacheObject} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { createUploadLink } from "apollo-upload-client";
import { destroyCookie, parseCookies } from "nookies";
import { useMemo } from "react";

export let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

const clearAllCookies = () => {
  const cookieNames = [
    "access_token",
    "user_name",
    "user_email",
    "customer_id",
    "driver_id",
    "company_id",
    "is_admin",
    "is_company_admin",
    "user_id",
    "state",
  ];
  cookieNames.forEach((name) => destroyCookie(null, name, { path: "/" }));
  if (typeof window !== "undefined") {
    try {
      localStorage.clear();
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
  }
};

const createLink = (opts: HttpOptions = {}) =>
  createUploadLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    credentials: "include",
    fetchOptions: { credentials: "include" },
    ...opts,
  });

// ✅ Auth link — reads token from cookies for every request
// apolloclient.tsx
const authLink = setContext((_, { headers }) => {
  const { access_token } = parseCookies();
  const next: Record<string, string> = { ...(headers as any) };
  if (access_token) next.Authorization = `Bearer ${access_token}`;
  else delete next.Authorization;                 // ← important
  return { headers: next };
});



let alreadyRedirecting = false;

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  // Gather all error messages
  const msgs: string[] = [];

  if (graphQLErrors?.length) {
    for (const e of graphQLErrors) if (e?.message) msgs.push(String(e.message));
  }

  const n = networkError as any;
  if (n?.result?.errors?.length) {
    for (const e of n.result.errors)
      if (e?.message) msgs.push(String(e.message));
  }
  if (networkError?.message) msgs.push(String(networkError.message));

  // Only redirect if any message contains the word "unauthenticated"
  const shouldRedirect = msgs.some((m) =>
    m.toLowerCase().includes("unauthenticated"),
  );

  // Debug: see which operation triggered it and with what messages
  if (msgs.length) {
    // eslint-disable-next-line no-console
    console.debug("[Apollo errorLink]", {
      op: operation.operationName,
      msgs,
      shouldRedirect,
    });
  }

  if (!shouldRedirect) return;

  // Don’t redirect if this operation opted out
  const { noAuthRedirect } = operation.getContext?.() || {};
  if (noAuthRedirect) return;

  // Don’t redirect from /auth/*, and only once
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (alreadyRedirecting || path.startsWith("/auth")) return;

  alreadyRedirecting = true;
  clearAllCookies();
  if (typeof window !== "undefined") {
    const next = path || "/admin";
    apolloClient?.clearStore?.().finally(() => {
      window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
    });
  }
});

function createApolloClient() {
  const uploadLink = createLink();
  
  const errorLink = new ApolloLink((operation, forward) => {
    return forward(operation).map((response) => {
      const { errors } = response;
      const networkError = (response as any).networkError;
      const graphQLErrors = errors;

      if (networkError?.message?.includes("401") ||
        graphQLErrors?.some((error: { message: string }) => error.message.includes("Unauthenticated"))) {
        clearAllCookies();

        apolloClient?.clearStore().then(() => {
          window.location.href = "/auth/login";
        });
      }

      return response;
    });
  });

  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: from([errorLink, authLink, uploadLink]),
    cache: new InMemoryCache({ addTypename: false }),
    defaultOptions: {
      watchQuery: { errorPolicy: "all" },
    },
  });
}

export function initializeApollo(initialState = {}) {
  const _apolloClient = apolloClient ?? createApolloClient();

  if (initialState) {
    const existingCache = _apolloClient.extract();
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  if (typeof window === "undefined") return _apolloClient;
  if (!apolloClient) apolloClient = _apolloClient;

  // Call kept for compatibility — now does nothing
  setAuthToken();
  return _apolloClient;
}

// ✅ No-op now, but keeps compatibility with existing calls
export const setAuthToken = () => {
  // No longer needed — authLink now handles this automatically
};

export function useApollo(initialState: NormalizedCacheObject) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}
