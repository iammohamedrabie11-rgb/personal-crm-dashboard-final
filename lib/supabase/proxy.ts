import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const authRoutes = new Set(["/login", "/signup"]);

function getSupabaseProxyEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase proxy environment variables.");
  }

  return { supabaseUrl, supabaseKey };
}

function isPublicRoute(pathname: string) {
  return authRoutes.has(pathname) || pathname.startsWith("/auth/");
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    target.cookies.set(name, value, options);
  });
}

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  if (pathname === "/login") {
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  } else {
    url.search = "";
  }

  const redirectResponse = NextResponse.redirect(url);
  copyCookies(response, redirectResponse);

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      redirectResponse.headers.set(key, value);
    }
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabaseKey } = getSupabaseProxyEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && !isPublicRoute(pathname)) {
    return redirectWithCookies(request, response, "/login");
  }

  if (user && authRoutes.has(pathname)) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}
