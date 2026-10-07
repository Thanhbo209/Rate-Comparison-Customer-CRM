import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Fallback if neither code nor token_hash is valid
  return NextResponse.redirect(`${baseUrl}/login?error=confirmation_failed`);
}
