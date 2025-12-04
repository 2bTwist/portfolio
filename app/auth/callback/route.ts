import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Get the redirect path from the state or default to home
  const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";
  
  // Redirect to the original page
  return NextResponse.redirect(`${origin}${redirectTo}`);
}
