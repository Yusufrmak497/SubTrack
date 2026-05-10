import { next } from "@vercel/functions";

function hasSessionCookie(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .some((cookie) => cookie.startsWith("bb_session="));
}

export default function middleware(request) {
  const requestId = crypto.randomUUID();
  const url = new URL(request.url);

  if (url.pathname.startsWith("/admin") && !hasSessionCookie(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized admin access" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId
      }
    });
  }

  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);

  return next({
    request: {
      headers
    }
  });
}

export const config = {
  matcher: "/:path*"
};
