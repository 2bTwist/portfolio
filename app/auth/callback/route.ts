import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const next = requestUrl.searchParams.get('next') || '/blog'

  // Redirect back to the page they were on
  // The auth state will be handled client-side by Supabase
  return NextResponse.redirect(new URL(next, request.url))
}
