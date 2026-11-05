
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/lib/types";

export async function updateSession(request: NextRequest) {
  if (
    process.env.MAINTENANCE_MODE === "1" &&
    request.nextUrl.pathname !== "/maintenance"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.rewrite(url, { status: 503 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAdmin = path.startsWith("/admin");
  const needsDelivery = path.startsWith("/delivery");

  const needsAuth =
    path.startsWith("/orders") ||
    path.startsWith("/checkout") ||
    needsAdmin ||
    needsDelivery;

  const redirectTo = (pathname: string, withRedirectParam = false) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";

    if (withRedirectParam) {
      url.searchParams.set("redirect", path + request.nextUrl.search);
    }

    return NextResponse.redirect(url);
  };

  if (needsAuth && !user) {
    return redirectTo("/login", true);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, phone, hostel_block")
      .eq("id", user.id)
      .single();

    const role = (profile?.role ?? "user") as Role;

    if (role === "banned") {
      return path === "/banned" ? response : redirectTo("/banned");
    }

    if (path === "/banned") return redirectTo("/");

    if (needsAdmin && role !== "admin") return redirectTo("/403");

    if (
      needsDelivery &&
      role !== "delivery" &&
      role !== "admin"
    ) {
      return redirectTo("/403");
    }

    // Only phone number and hostel are required.
    const profileIncomplete =
      !profile?.phone?.trim() ||
      !profile?.hostel_block?.trim();

    const profileSafePath =
      path === "/profile" ||
      path.startsWith("/api") ||
      path.startsWith("/admin") ||
      path.startsWith("/delivery") ||
      path === "/banned";

    if (profileIncomplete && !profileSafePath) {
      return redirectTo("/profile", true);
    }
  }

  return response;
}
