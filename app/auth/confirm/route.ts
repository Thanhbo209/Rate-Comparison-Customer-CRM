import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionUser } from "@/lib/user/provision";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  // 1. If PKCE authorization code was passed in the confirmation URL
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
            user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
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
      `${baseUrl}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // 2. If token_hash and type were passed (classic OTP verification)
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
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
            user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
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
      `${baseUrl}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Fallback if neither code nor token_hash is valid
  return NextResponse.redirect(`${baseUrl}/login?error=confirmation_failed`);
}
