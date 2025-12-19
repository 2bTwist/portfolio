import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirect_to") ?? "/";

  console.log("[Auth Callback] Starting...");
  console.log("[Auth Callback] URL:", request.url);
  console.log("[Auth Callback] Code present:", !!code);
  console.log("[Auth Callback] Redirect to:", redirectTo);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("[Auth Callback] Exchange result - Error:", error?.message ?? "none");
    console.log("[Auth Callback] Exchange result - Session:", !!data?.session);

    if (!error) {
      // Build the redirect URL
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      console.log("[Auth Callback] Forwarded host:", forwardedHost);
      console.log("[Auth Callback] Is local:", isLocalEnv);
      console.log("[Auth Callback] Origin:", origin);

      if (isLocalEnv) {
        const url = `${origin}${redirectTo}`;
        console.log("[Auth Callback] Redirecting (local) to:", url);
        return NextResponse.redirect(url);
      } else if (forwardedHost) {
        const url = `https://${forwardedHost}${redirectTo}`;
        console.log("[Auth Callback] Redirecting (prod) to:", url);
        return NextResponse.redirect(url);
      } else {
        const url = `${origin}${redirectTo}`;
        console.log("[Auth Callback] Redirecting (fallback) to:", url);
        return NextResponse.redirect(url);
      }
    } else {
      console.log("[Auth Callback] Error exchanging code:", error);
    }
  } else {
    console.log("[Auth Callback] No code in URL!");
  }

  // Return to homepage with error
  console.log("[Auth Callback] Redirecting to error page");
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`);
}
