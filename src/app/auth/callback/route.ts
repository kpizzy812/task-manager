import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Handles OAuth callback from Supabase Auth.
 * Exchanges the code for a session and redirects to the appropriate page.
 * Also creates user profile if it doesn't exist.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user and create profile if needed
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists, create if not
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
            // Ignore duplicate key error
            console.error("Profile creation error:", err);
          }
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If there's no code or an error occurred, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
