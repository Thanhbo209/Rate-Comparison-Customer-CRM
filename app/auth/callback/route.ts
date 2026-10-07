import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/";

  // Determine site base URL (supporting reverse proxy / load balancer headers if present)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  // Handle provider-level error (e.g. user cancelled Google consent)
  if (error || errorDescription) {
    const errorMsg = errorDescription || error || "oauth_failed";
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`,
    );
  }

  // Handle authorization code exchange
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }

    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  // Fallback if neither code nor error was provided
  return NextResponse.redirect(`${baseUrl}/login?error=invalid_request`);
}
