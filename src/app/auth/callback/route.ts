import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

/**
 * Handles OAuth/email verification callback from Supabase Auth.
 * Exchanges the code for a session and redirects to the appropriate page.
 * Also creates user profile if it doesn't exist.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "email"
    | null;
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[AUTH CALLBACK] Started", {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    next,
    origin,
  });

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  // Determine base URL for redirects
  let baseUrl: string;
  if (isLocalEnv) {
    baseUrl = origin;
  } else if (forwardedHost) {
    baseUrl = `https://${forwardedHost}`;
  } else {
    baseUrl = origin;
  }

  console.log("[AUTH CALLBACK] baseUrl:", baseUrl);

  const redirectUrl = `${baseUrl}${next}`;

  // Need either code or token_hash for authentication
  if (!code && !token_hash) {
    console.error("[AUTH CALLBACK] No code or token_hash provided");
    return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`);
  }

  // Create redirect response first - cookies will be set on this response
  const response = NextResponse.redirect(redirectUrl);

  // Create Supabase client that sets cookies directly on the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let data;
  let error;

  // Handle token_hash (email confirmation) or code (OAuth/PKCE)
  if (token_hash && type) {
    console.log("[AUTH CALLBACK] Verifying OTP with token_hash");
    const result = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    data = result.data;
    error = result.error;
    console.log("[AUTH CALLBACK] verifyOtp result:", {
      hasSession: !!result.data?.session,
      hasUser: !!result.data?.user,
      error: result.error?.message,
    });
  } else if (code) {
    console.log("[AUTH CALLBACK] Exchanging code for session");
    const result = await supabase.auth.exchangeCodeForSession(code);
    data = result.data;
    error = result.error;
    console.log("[AUTH CALLBACK] exchangeCode result:", {
      hasSession: !!result.data?.session,
      error: result.error?.message,
    });
  }

  if (error) {
    console.error("[AUTH CALLBACK] Error:", error.message);
    return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_error`);
  }

  // Verify session was created
  const user = data?.session?.user;
  if (!user) {
    console.error("[AUTH CALLBACK] No session created after verification");
    return NextResponse.redirect(`${baseUrl}/login?error=no_session`);
  }

  console.log("[AUTH CALLBACK] User verified:", user.id, user.email);

  // Create profile if needed
  const existingProfile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!existingProfile) {
    try {
      await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        },
      });
    } catch (err) {
      // Ignore duplicate key error (profile may have been created by trigger)
      console.error("Profile creation error:", err);
    }
  }

  return response;
}
