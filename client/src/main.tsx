import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

function loadUmamiWhenConfigured() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.toString().trim();
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID?.toString().trim();
  if (!endpoint || !websiteId) return;

  let scriptSrc: string;
  try {
    const base = /^https?:\/\//i.test(endpoint)
      ? endpoint.replace(/\/+$/, "")
      : `https://${endpoint.replace(/^\/+/, "").replace(/\/+$/, "")}`;
    scriptSrc = new URL("umami", `${base}/`).toString();
  } catch {
    console.warn("[analytics] VITE_ANALYTICS_ENDPOINT is not a valid URL; skipping Umami.");
    return;
  }

  const s = document.createElement("script");
  s.defer = true;
  s.src = scriptSrc;
  s.dataset.websiteId = websiteId;
  document.body.appendChild(s);
}

loadUmamiWhenConfigured();

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
