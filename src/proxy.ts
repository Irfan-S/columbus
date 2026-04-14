export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/compare/:path*", "/profile/:path*", "/pro/:path*", "/admin/:path*"],
};
