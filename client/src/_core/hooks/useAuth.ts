import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

/** If session fetch never settles (network/proxy hang), unblock the UI after this. */
const SESSION_BOOTSTRAP_MAX_MS = 12_000;

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const redirectOnUnauthenticated = options?.redirectOnUnauthenticated ?? false;
  const redirectPath = useMemo(() => {
    if (options?.redirectPath !== undefined) return options.redirectPath;
    if (!redirectOnUnauthenticated) return "";
    return getLoginUrl();
  }, [redirectOnUnauthenticated, options?.redirectPath]);
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const [sessionBootstrapTimedOut, setSessionBootstrapTimedOut] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(
      () => setSessionBootstrapTimedOut(true),
      SESSION_BOOTSTRAP_MAX_MS,
    );
    return () => window.clearTimeout(id);
  }, []);

  const sessionResolved =
    meQuery.isFetched ||
    meQuery.isError ||
    sessionBootstrapTimedOut;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem("pilothub-auth-user", JSON.stringify(meQuery.data));
    return {
      user: meQuery.data ?? null,
      loading: logoutMutation.isPending || !sessionResolved,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    logoutMutation.error,
    logoutMutation.isPending,
    sessionResolved,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (!redirectPath) return;
    if ((!meQuery.isFetched && !sessionBootstrapTimedOut) || logoutMutation.isPending)
      return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isFetched,
    sessionBootstrapTimedOut,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
