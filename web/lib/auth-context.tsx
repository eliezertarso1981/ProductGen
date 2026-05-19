"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  type AuthBootstrap,
  type AuthWorkspace,
  bootstrapProductgenAuth,
  clearAuthSession,
  isProductgenApiConfigured,
} from "./productgen-api";

interface AuthContextValue {
  ready: boolean;
  user: AuthBootstrap["user"] | null;
  workspaces: AuthWorkspace[];
  currentWorkspace: AuthWorkspace | null;
  currentWorkspaceId: string | null;
  refresh: () => Promise<AuthBootstrap | null>;
  clear: () => void;
  can: (permission: string, opts?: { productId?: string }) => boolean;
  role: (opts?: { productId?: string }) => { workspace: string | null; product: string | null };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!isProductgenApiConfigured());
  const [session, setSession] = useState<AuthBootstrap | null>(null);

  const refresh = useCallback(async () => {
    if (!isProductgenApiConfigured()) {
      setReady(true);
      return null;
    }

    const next = await bootstrapProductgenAuth();
    setSession(next);
    setReady(true);
    return next;
  }, []);

  const clear = useCallback(() => {
    clearAuthSession();
    setSession(null);
    setReady(!isProductgenApiConfigured());
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const currentWorkspace =
      session?.workspaces.find((workspace) => workspace.id === session.current_workspace_id) ??
      session?.workspaces[0] ??
      null;

    function can(permission: string, opts?: { productId?: string }) {
      if (!isProductgenApiConfigured()) return true;
      if (!currentWorkspace) return false;
      if (currentWorkspace.permissions?.includes(permission)) return true;

      const productId = opts?.productId ?? session?.current_product_id ?? undefined;
      const product = productId
        ? currentWorkspace.products?.find((item) => item.id === productId)
        : undefined;
      return Boolean(product?.permissions?.includes(permission));
    }

    function role(opts?: { productId?: string }) {
      const productId = opts?.productId ?? session?.current_product_id ?? undefined;
      const product = productId
        ? currentWorkspace?.products?.find((item) => item.id === productId)
        : undefined;
      return {
        workspace: currentWorkspace?.role ?? null,
        product: product?.role ?? null,
      };
    }

    return {
      ready,
      user: session?.user ?? null,
      workspaces: session?.workspaces ?? [],
      currentWorkspace,
      currentWorkspaceId: session?.current_workspace_id ?? null,
      refresh,
      clear,
      can,
      role,
    };
  }, [clear, ready, refresh, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}

export function usePermissions() {
  const { can, role } = useAuth();
  return { can, role };
}
