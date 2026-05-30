import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sha256Hex } from "@/lib/security/hash";
import { logger } from "@/lib/observability/logger";

type AuthRateLimitAction = "auth.sign_in" | "auth.password_reset" | "auth.password_update";

const authRateLimitPolicy: Record<
  AuthRateLimitAction,
  { maxAttempts: number; windowSeconds: number }
> = {
  "auth.sign_in": { maxAttempts: 5, windowSeconds: 900 },
  "auth.password_reset": { maxAttempts: 3, windowSeconds: 900 },
  "auth.password_update": { maxAttempts: 5, windowSeconds: 900 }
};

function firstForwardedIp(forwardedForHeader: string | null) {
  const forwardedIp = forwardedForHeader?.split(",")[0]?.trim();
  return forwardedIp && forwardedIp.length > 0 ? forwardedIp : undefined;
}

export async function consumeAuthRateLimit(action: AuthRateLimitAction, principal: string) {
  const requestHeaders = await headers();
  const ipAddress =
    firstForwardedIp(requestHeaders.get("x-forwarded-for")) ??
    requestHeaders.get("x-real-ip") ??
    "unknown";
  const normalizedPrincipal = principal.trim().toLowerCase();
  const identifierHash = sha256Hex(`${action}:${normalizedPrincipal}:${ipAddress}`);
  const policy = authRateLimitPolicy[action];
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("consume_auth_rate_limit", {
    p_identifier_hash: identifierHash,
    p_rate_limit_action: action,
    p_max_attempts: policy.maxAttempts,
    p_window_seconds: policy.windowSeconds
  });

  if (error) {
    logger.error("auth.rate_limit.rpc_failed", { action, errorCode: error.code ?? null });
    return false;
  }

  return data === true;
}
