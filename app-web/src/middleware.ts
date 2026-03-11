import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher(["/feed(.*)", "/saved(.*)", "/tracker(.*)"]);
const isAuthPage = createRouteMatcher(["/"]);

export default clerkMiddleware(async (auth, req) => {
  // Skip all auth checks in development
  if (process.env.NODE_ENV === "development") return;

  const { userId } = await auth();

  // Signed-in user visiting auth page → send to feed
  if (isAuthPage(req) && userId) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }

  // Unauthenticated user visiting a protected route → send to sign-in
  if (isProtected(req) && !userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
