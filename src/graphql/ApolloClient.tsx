import {
  ApolloClient,
  ApolloLink,
  from,
  HttpOptions,
  InMemoryCache,
  NormalizedCacheObject} from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { destroyCookie, parseCookies } from "nookies";
import { useMemo } from "react";

export let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

const createLink = (opts: HttpOptions = {}) => {
  return createUploadLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
    credentials: 'include',
    fetchOptions: {
      credentials: 'include'
    },
    ...opts
  });
};

function createApolloClient() {
  const uploadLink = createLink();

const errorLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    const { errors, data } = response;
    const networkError = (response as any).networkError;
    const graphQLErrors = errors;

    if (networkError?.message?.includes('401') ||
        graphQLErrors?.some((error: { message: string }) => error.message.includes('Unauthenticated'))) {
      // Clear all user-related cookies
      destroyCookie(null, "access_token", { path: "*" });
      destroyCookie(null, "user_name", { path: "*" });
      destroyCookie(null, "user_email", { path: "*" });
      destroyCookie(null, "customer_id", { path: "*" });
      destroyCookie(null, "driver_id", { path: "*" });
      destroyCookie(null, "company_id", { path: "*" });
      destroyCookie(null, "is_admin", { path: "*" });
      destroyCookie(null, "is_company_admin", { path: "*" });
      destroyCookie(null, "user_id", { path: "*" });
      destroyCookie(null, "state", { path: "*" });
      
      // Clear Apollo cache
      apolloClient?.clearStore().then(() => {
        window.location.href = '/auth/login';
      });
    }

    return response;
  });
});
  
  return new ApolloClient({
    ssrMode: typeof window === "undefined",
    link: from([errorLink, uploadLink]),
    cache: new InMemoryCache({ addTypename: false }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all'
      }
    }
  });
}

export function initializeApollo(initialState = {}) {
  const _apolloClient = apolloClient ?? createApolloClient();

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();
    // Restore the cache using the data passed from getStaticProps/getServerSideProps
    // combined with the existing cached data
    _apolloClient.cache.restore({ ...existingCache, ...initialState });
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") return _apolloClient;
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;
  setAuthToken();
  return _apolloClient;
}

export function useApollo(initialState: NormalizedCacheObject) {
  const store = useMemo(() => initializeApollo(initialState), [initialState]);
  return store;
}

export const setAuthToken = () => {
  const cookies = parseCookies();
  const token = cookies.access_token ? cookies.access_token : "";

  const options: HttpOptions = {
    headers: {
      Authorization: token ? `Bearer ${token}` : null,
    },
  };

  apolloClient.setLink(createLink(options));
};
