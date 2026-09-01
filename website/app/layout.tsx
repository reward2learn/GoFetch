import type { Metadata } from "next";
import { Providers } from "./providers";
import { TenantProvider } from "@/components/providers/TenantProvider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GoFetch — Global Shopping & Delivery",
  description:
    "Buy from anywhere, delivered by travelers. Powered by USDC escrow.",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Early intercepts — run BEFORE any Web3 SDK loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === "undefined") return;

                // 1. Block analytics/telemetry endpoints
                //    The SDK captures fetch early, so we override it before anything else.
                var origFetch = window.fetch;
                window.fetch = function() {
                  var url = (typeof arguments[0] === "string")
                    ? arguments[0]
                    : (arguments[0] instanceof Request)
                      ? arguments[0].url
                      : (arguments[0] && arguments[0].href) || "";
                  if (url.indexOf("pulse.walletconnect.org") !== -1 ||
                      url.indexOf("cca-lite.coinbase.com") !== -1 ||
                      url.indexOf("experimental-analytics.coinbase.com") !== -1) {
                    return Promise.resolve(new Response("{}"));
                  }
                  return origFetch.apply(this, arguments);
                };

                // 2. Mock navigator.clipboard for Coinbase Wallet SDK
                if (!navigator.clipboard) {
                  navigator.clipboard = {};
                }
                navigator.clipboard.writeText = function() { return Promise.resolve(); };
                navigator.clipboard.readText = function() { return Promise.resolve(""); };
              })();
            `,
          }}
        />
        <Providers>
          <TenantProvider>{children}</TenantProvider>
        </Providers>
      </body>
    </html>
  );
}
