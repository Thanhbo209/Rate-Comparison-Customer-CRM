import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionUser } from "@/lib/user/provision";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(`${baseUrl}/login?error=no_user`);
      }

      try {
        await provisionUser({
          authUserId: user.id,
          email: user.email ?? "",
          name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "User",
          organizationName:
            user.user_metadata?.organization_name ?? "My Organization",
        });
      } catch (provisionErr: unknown) {
        console.error("Failed to provision user:", provisionErr);
        const msg =
          provisionErr instanceof Error
            ? provisionErr.message
            : "Failed to provision user profile";
        return NextResponse.redirect(
          `${baseUrl}/login?error=${encodeURIComponent(msg)}`,
        );
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }

    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  // Fallback if neither code nor error was provided
  return NextResponse.redirect(`${baseUrl}/login?error=invalid_request`);
}
