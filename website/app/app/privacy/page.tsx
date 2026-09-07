"use client";

/* ──────────────────────────────────────────────
   Privacy Policy — GoFetch
   Last updated: September 4, 2026
   ────────────────────────────────────────────── */

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Information" },
  { id: "information-sharing", title: "Information Sharing" },
  { id: "blockchain-wallet", title: "Blockchain & Wallet Data" },
  { id: "data-security", title: "Data Security" },
  { id: "data-retention", title: "Data Retention" },
  { id: "your-rights", title: "Your Rights" },
  { id: "cookies-tracking", title: "Cookies & Tracking" },
  { id: "childrens-privacy", title: "Children's Privacy" },
  { id: "international-transfers", title: "International Data Transfers" },
  { id: "third-party-links", title: "Third-Party Links" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact" },
];

/* ──────────────────────────────────────────────
   Helper — section heading with anchor
   ────────────────────────────────────────────── */
function SectionHeading({
  id,
  number,
  title,
}: {
  id: string;
  number: number;
  title: string;
}) {
  return (
    <h2
      id={id}
      className="text-xl font-bold text-primary scroll-mt-24"
    >
      {number}. {title}
    </h2>
  );
}

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */
export default function PrivacyPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* ── Header ── */}
      <section className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted">
          Last updated: September 4, 2026
        </p>
      </section>

      {/* ── Table of Contents ── */}
      <nav className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-lg font-bold text-primary mb-3">Contents</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-secondary">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="underline decoration-border hover:text-primary transition-colors"
              >
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ── 1. Introduction ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="introduction" number={1} title="Introduction" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>
            GoFetch (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This Privacy
            Policy explains how we collect, use, and protect your information
            when you use the GoFetch platform, including our website, mobile
            applications, and related services (collectively, the
            &quot;Platform&quot;).
          </p>
          <p>
            By using GoFetch, you agree to the collection and use of
            information in accordance with this policy. If you do not agree
            with the terms of this policy, please do not use our Platform.
          </p>
        </div>
      </section>

      {/* ── 2. Information We Collect ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-6">
        <SectionHeading
          id="information-we-collect"
          number={2}
          title="Information We Collect"
        />

        {/* Account Information */}
        <div>
          <h3 className="font-semibold text-sm text-primary mb-2">
            Account Information
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>Name, email address, phone number</li>
            <li>Profile photo (optional)</li>
            <li>Wallet address (auto-generated, not personally linked)</li>
          </ul>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="font-semibold text-sm text-primary mb-2">
            Payment Information
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>
              Credit/debit card details (processed by Stripe &mdash; we never
              store them)
            </li>
            <li>Transaction history</li>
            <li>Billing address</li>
          </ul>
        </div>

        {/* Identity Verification */}
        <div>
          <h3 className="font-semibold text-sm text-primary mb-2">
            Identity Verification (KYC)
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>Government-issued ID (passport, driver&apos;s license)</li>
            <li>Selfie photo for verification</li>
            <li>Travel document information (for travelers)</li>
          </ul>
        </div>

        {/* Platform Usage */}
        <div>
          <h3 className="font-semibold text-sm text-primary mb-2">
            Platform Usage
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>Delivery requests and travel plans</li>
            <li>Chat messages between users</li>
            <li>Reviews and ratings</li>
            <li>Device information (browser, OS, IP address)</li>
          </ul>
        </div>

        {/* Blockchain Data */}
        <div>
          <h3 className="font-semibold text-sm text-primary mb-2">
            Blockchain Data
          </h3>
          <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
            <li>
              Wallet addresses (pseudonymous &mdash; not linked to personal
              identity)
            </li>
            <li>Transaction hashes on-chain</li>
            <li>Escrow contract interactions</li>
          </ul>
        </div>
      </section>

      {/* ── 3. How We Use Your Information ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="how-we-use" number={3} title="How We Use Your Information" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <div>
            <h3 className="font-semibold text-primary mb-1">Provide the service</h3>
            <p>
              Process deliveries, manage escrow, and facilitate communication
              between members and travelers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Verify identity</h3>
            <p>
              Conduct KYC verification for travelers and perform fraud
              prevention across the platform.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Process payments</h3>
            <p>
              All payment processing is handled by Stripe. We do not store
              or have access to your card details.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Improve the platform</h3>
            <p>
              Analyze usage patterns, fix bugs, and develop new features to
              improve your experience.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Communicate</h3>
            <p>
              Send transaction updates, support responses, and marketing
              communications (opt-out available at any time).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-primary mb-1">Legal compliance</h3>
            <p>
              Respond to legal requests and enforce our Terms of Service.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Information Sharing ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="information-sharing"
          number={4}
          title="Information Sharing"
        />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>We share your information only with:</p>

          <div>
            <h3 className="font-semibold text-primary mb-1">
              Other users in your transaction
            </h3>
            <p>
              Your name and delivery details are shared with your
              counterpart (traveler or member) to facilitate delivery.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-primary mb-1">Stripe</h3>
            <p>
              Payment processing &mdash; subject to Stripe&apos;s own privacy
              policy.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-primary mb-1">Service providers</h3>
            <p>
              Hosting, analytics, and email delivery providers &mdash; all
              bound by confidentiality agreements.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-primary mb-1">Law enforcement</h3>
            <p>
              When required by law or to protect the rights and safety of
              our users.
            </p>
          </div>

          <div className="border-t border-border pt-3 mt-4">
            <p className="font-semibold text-primary mb-2">We do NOT:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Sell your personal information to third parties</li>
              <li>
                Share your data with other users&apos; unrelated transactions
              </li>
              <li>
                Share your wallet address with third parties (it&apos;s
                pseudonymous on-chain)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. Blockchain & Wallet Data ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="blockchain-wallet"
          number={5}
          title="Blockchain & Wallet Data"
        />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              Your wallet address is auto-generated from your account &mdash;
              it is not linked to your personal identity on-chain.
            </li>
            <li>
              Transaction data on the blockchain is pseudonymous (wallet
              addresses only).
            </li>
            <li>
              We cannot delete blockchain data &mdash; it is permanent by
              design.
            </li>
            <li>
              We do not control the blockchain network &mdash; third-party
              nodes may store transaction data.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 6. Data Security ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="data-security" number={6} title="Data Security" />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              All data is encrypted in transit (TLS 1.3) and at rest
              (AES-256).
            </li>
            <li>
              Payment data is handled by Stripe (PCI Level 1 certified)
              &mdash; we never see or store card details.
            </li>
            <li>
              Access to personal data is restricted to authorized personnel
              only.
            </li>
            <li>We conduct regular security audits.</li>
          </ul>
        </div>
      </section>

      {/* ── 7. Data Retention ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="data-retention"
          number={7}
          title="Data Retention"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <span className="font-semibold text-primary">Account data:</span>{" "}
              Retained while your account is active, deleted within 30 days
              of account deletion.
            </li>
            <li>
              <span className="font-semibold text-primary">Transaction records:</span>{" "}
              Retained for 7 years (legal and tax requirements).
            </li>
            <li>
              <span className="font-semibold text-primary">Chat messages:</span>{" "}
              Retained while your account is active, deleted upon account
              deletion.
            </li>
            <li>
              <span className="font-semibold text-primary">Blockchain data:</span>{" "}
              Permanent (cannot be deleted).
            </li>
            <li>
              <span className="font-semibold text-primary">KYC documents:</span>{" "}
              Deleted within 90 days of verification (or upon account
              deletion).
            </li>
          </ul>
        </div>
      </section>

      {/* ── 8. Your Rights ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="your-rights" number={8} title="Your Rights" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>
            Depending on your jurisdiction, you may have the right to:
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>
              <span className="font-semibold text-primary">Access:</span>{" "}
              Request a copy of your personal data.
            </li>
            <li>
              <span className="font-semibold text-primary">Correction:</span>{" "}
              Request correction of inaccurate data.
            </li>
            <li>
              <span className="font-semibold text-primary">Deletion:</span>{" "}
              Request deletion of your personal data (subject to legal
              retention requirements).
            </li>
            <li>
              <span className="font-semibold text-primary">Portability:</span>{" "}
              Request your data in a machine-readable format.
            </li>
            <li>
              <span className="font-semibold text-primary">Objection:</span>{" "}
              Object to processing of your personal data.
            </li>
            <li>
              <span className="font-semibold text-primary">Restriction:</span>{" "}
              Request restriction of processing.
            </li>
          </ul>
          <p>
            To exercise these rights, contact us at{" "}
            <a
              href="mailto:privacy@gofetchapp.com"
              className="underline text-primary hover:text-primary/80 transition-colors"
            >
              privacy@gofetchapp.com
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── 9. Cookies & Tracking ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="cookies-tracking"
          number={9}
          title="Cookies & Tracking"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              We use essential cookies for authentication and session
              management.
            </li>
            <li>
              We use analytics cookies (Google Analytics) to understand
              usage patterns.
            </li>
            <li>
              We do not use advertising cookies or cross-site tracking.
            </li>
            <li>
              You can manage cookie preferences in your browser settings.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 10. Children's Privacy ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="childrens-privacy"
          number={10}
          title="Children's Privacy"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>GoFetch is not intended for users under 18.</li>
            <li>We do not knowingly collect data from children.</li>
            <li>
              If we discover data from a user under 18, we will delete it
              immediately.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 11. International Data Transfers ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="international-transfers"
          number={11}
          title="International Data Transfers"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              GoFetch operates globally &mdash; your data may be processed
              in Indonesia, the United States, or other countries.
            </li>
            <li>
              We ensure adequate data protection measures are in place for
              international transfers.
            </li>
            <li>
              By using GoFetch, you consent to the transfer of your data to
              these jurisdictions.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 12. Third-Party Links ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="third-party-links"
          number={12}
          title="Third-Party Links"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              GoFetch may contain links to third-party websites.
            </li>
            <li>
              We are not responsible for their privacy practices.
            </li>
            <li>
              We encourage you to review their privacy policies.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 13. Changes to This Policy ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="changes" number={13} title="Changes to This Policy" />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              We may update this Privacy Policy at any time.
            </li>
            <li>
              Material changes will be notified via email or in-app
              notification.
            </li>
            <li>
              Continued use after changes constitutes acceptance of the
              updated policy.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 14. Contact ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="contact" number={14} title="Contact" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>For privacy-related inquiries:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              Email:{" "}
              <a
                href="mailto:privacy@gofetchapp.com"
                className="underline text-primary hover:text-primary/80 transition-colors"
              >
                privacy@gofetchapp.com
              </a>
            </li>
            <li>
              Data Protection Officer:{" "}
              <a
                href="mailto:dpo@gofetchapp.com"
                className="underline text-primary hover:text-primary/80 transition-colors"
              >
                dpo@gofetchapp.com
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
