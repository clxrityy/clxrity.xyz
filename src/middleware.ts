import {
  clerkMiddleware,
  createRouteMatcher
} from "@clerk/nextjs/server";


const isAdminRoute = createRouteMatcher([
  '/admin(.*)'
]);

export default clerkMiddleware((auth, req) => {
  const { sessionClaims } = auth();

  if (isAdminRoute(req) && !sessionClaims) {
    auth().protect(has => {
      return (
        has({ role: 'admin' }) 
      )
    })
  }
}, {
  domain: "https://clxrity.xyz",
  authorizedParties: ['http://localhost:3000', 'https://clxrity.xyz'],
  skipJwksCache: true,
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};