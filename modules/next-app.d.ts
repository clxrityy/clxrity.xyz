import type { NextComponentType, NextPageContext } from "next";
import type { Session } from "next-auth";
import type { Router } from "next/router";

declare module "next/app" {
    type AppProps<P = Record<string, unknown>> = {
        Component: NextComponentType<NextPageContext, any, P>,
        router: Router,
        pageProps: P & {
            session?: Session
        }
    }
}