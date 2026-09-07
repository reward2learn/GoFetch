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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === "undefined") return;

                // 1. Block analytics/telemetry endpoints
                var origFetch = window.fetch;
                if (origFetch) {
                  window.fetch = function() {
                    var url = (typeof arguments[0] === "string")
                      ? arguments[0]
                      : (arguments[0] instanceof Request)
                        ? arguments[0].url
                        : (arguments[0] && arguments[0].href) || "";
                    if (url.indexOf("pulse.walletconnect.org") !== -1 ||
                        url.indexOf("cca-lite.coinbase.com") !== -1 ||
                        url.indexOf("experimental-analytics.coinbase.com") !== -1 ||
                        url.indexOf("api.toaster.magic.link") !== -1) {
                      return Promise.resolve(new Response("{}"));
                    }
                    return origFetch.apply(this, arguments);
                  };
                }

                // 2. Mock navigator.clipboard before any SDK loads
                if (typeof navigator !== "undefined") {
                  try {
                    if (!navigator.clipboard) {
                      Object.defineProperty(navigator, "clipboard", {
                        value: { writeText: function() { return Promise.resolve(); }, readText: function() { return Promise.resolve(""); } },
                        writable: true,
                        configurable: true,
                      });
                    } else {
                      navigator.clipboard.writeText = function() { return Promise.resolve(); };
                      navigator.clipboard.readText = function() { return Promise.resolve(""); };
                    }
                  } catch(e) {
                    // clipboard may be read-only — ignore
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <TenantProvider>{children}</TenantProvider>
        </Providers>
      </body>
    </html>
  );
}
