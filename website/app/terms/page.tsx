"use client";

/* ──────────────────────────────────────────────
   Terms of Service — GoFetch
   Last updated: September 4, 2026
   ────────────────────────────────────────────── */

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "eligibility", title: "Eligibility" },
  { id: "account", title: "Account & Wallet" },
  { id: "platform", title: "Platform Description" },
  { id: "deliveries", title: "Delivery Requests & Travel Plans" },
  { id: "payments", title: "Payments & Fees" },
  { id: "escrow", title: "Escrow & Settlement" },
  { id: "kyc", title: "Identity Verification (KYC)" },
  { id: "prohibited", title: "Prohibited Items & Conduct" },
  { id: "disputes", title: "Disputes & Resolution" },
  { id: "reviews", title: "Reviews & Ratings" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "privacy", title: "Privacy" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing Law" },
  { id: "changes", title: "Changes to Terms" },
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
export default function TermsPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8 pb-24 md:pb-8">
      {/* ── Header ── */}
      <section className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
          Terms of Service
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

      {/* ── 1. Acceptance of Terms ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="acceptance" number={1} title="Acceptance of Terms" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>
            By accessing or using GoFetch (the &quot;Platform&quot;), you agree
            to be bound by these Terms of Service (&quot;Terms&quot;). If you do
            not agree, do not use the Platform.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you and
            GoFetch. We may update these Terms from time to time; continued use
            after changes constitutes acceptance.
          </p>
        </div>
      </section>

      {/* ── 2. Eligibility ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="eligibility" number={2} title="Eligibility" />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>You must be at least 18 years old to use GoFetch.</li>
            <li>You must have the legal capacity to enter binding agreements.</li>
            <li>
              You must not be located in a country subject to comprehensive
              sanctions.
            </li>
            <li>
              You must comply with all applicable local, national, and
              international laws.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 3. Account & Wallet ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="account" number={3} title="Account & Wallet" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              Your GoFetch account is linked to your wallet address for
              identity and payout purposes.
            </li>
            <li>
              Members pay with credit or debit card via Stripe. The blockchain
              layer is used internally for escrow settlement and is invisible
              to users.
            </li>
            <li>
              Travelers receive payouts to their connected wallet (USDC on
              supported networks) after delivery confirmation.
            </li>
            <li>
              You are responsible for all activity that occurs under your
              account.
            </li>
            <li>
              You must notify us immediately of any unauthorized use of your
              account.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 4. Platform Description ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="platform" number={4} title="Platform Description" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>
            GoFetch is a peer-to-peer delivery marketplace that connects:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <span className="font-semibold text-primary">Members</span> who
              need items delivered from abroad
            </li>
            <li>
              <span className="font-semibold text-primary">Travelers</span> who
              are traveling internationally and can carry items
            </li>
          </ul>
          <p>
            GoFetch acts as an escrow agent and payment processor. We are not a
            party to the delivery agreement between Members and Travelers.
          </p>
        </div>
      </section>

      {/* ── 5. Delivery Requests & Travel Plans ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="deliveries"
          number={5}
          title="Delivery Requests & Travel Plans"
        />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              Members create Delivery Requests specifying the item, origin,
              destination, and reward.
            </li>
            <li>
              Travelers create Travel Plans with their itinerary, destination
              countries, and availability.
            </li>
            <li>
              When a Traveler accepts a Delivery Request, a binding delivery
              agreement is formed between the two parties.
            </li>
            <li>
              Both parties must fulfill their obligations: Traveler delivers the
              item; Member pays the agreed reward.
            </li>
            <li>
              GoFetch is not liable for delays, customs issues, or items
              prohibited by law.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 6. Payments & Fees ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="payments" number={6} title="Payments & Fees" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              Members pay using credit/debit card via Stripe. No cryptocurrency
              knowledge is required.
            </li>
            <li>
              GoFetch charges a platform fee on each completed delivery (see
              Pricing page for current rates).
            </li>
            <li>
              Funds are held in escrow until the Member confirms receipt of the
              item.
            </li>
            <li>
              Travelers receive payment (minus platform fee) upon successful
              delivery confirmation.
            </li>
            <li>
              Refunds are handled according to our Refund Policy (see Section
              11).
            </li>
          </ul>
        </div>
      </section>

      {/* ── 7. Escrow & Settlement ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="escrow" number={7} title="Escrow & Settlement" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              GoFetch holds the Member&apos;s payment in escrow from the time
              the Traveler accepts the request.
            </li>
            <li>
              Once the Member confirms receipt, the Traveler&apos;s share is
              credited to their GoFetch balance.
            </li>
            <li>
              Platform fee is deducted at settlement (currently 10% of item
              price + reward).
            </li>
            <li>
              Travelers can claim their balance to their connected wallet
              (USDC on supported networks).
            </li>
            <li>
              Disputes may result in funds being held until resolution.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 8. Identity Verification (KYC) ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="kyc" number={8} title="Identity Verification (KYC)" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              Travelers may be required to complete identity verification (KYC)
              before accepting delivery requests.
            </li>
            <li>
              KYC may include government-issued ID, selfie verification, and
              travel document review.
            </li>
            <li>
              KYC documents are processed by our verification partners and are
              deleted within 90 days.
            </li>
            <li>
              GoFetch reserves the right to reject or revoke traveler status at
              its discretion.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 9. Prohibited Items & Conduct ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="prohibited"
          number={9}
          title="Prohibited Items & Conduct"
        />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>The following are strictly prohibited:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Drugs, narcotics, and controlled substances</li>
            <li>Weapons, ammunition, and explosives</li>
            <li>Counterfeit goods and stolen property</li>
            <li>Human organs, body parts, and remains</li>
            <li>Live animals (except service animals with proper documentation)</li>
            <li>Hazardous materials and chemicals</li>
            <li>Items prohibited by the laws of origin or destination country</li>
          </ul>
          <p className="mt-4">
            Prohibited conduct includes fraud, misrepresentation, harassment,
            and attempting to circumvent the escrow system.
          </p>
        </div>
      </section>

      {/* ── 10. Disputes & Resolution ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="disputes"
          number={10}
          title="Disputes & Resolution"
        />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              If a delivery cannot be completed, either party can open a dispute
              through the Platform.
            </li>
            <li>
              GoFetch will mediate disputes and make a final determination.
            </li>
            <li>
              Refunds may be issued in full or in part depending on the
              circumstances.
            </li>
            <li>
              Both parties agree to cooperate with GoFetch&apos;s dispute
              resolution process.
            </li>
            <li>
              Decisions made by GoFetch are final and binding.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 11. Reviews & Ratings ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="reviews" number={11} title="Reviews & Ratings" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              After a completed delivery, both parties may leave reviews and
              ratings.
            </li>
            <li>
              Reviews must be honest, relevant, and not defamatory.
            </li>
            <li>
              GoFetch reserves the right to remove reviews that violate our
              policies.
            </li>
            <li>
              Reviews are public and may affect your reputation on the Platform.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 12. Limitation of Liability ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="liability"
          number={12}
          title="Limitation of Liability"
        />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              GoFetch is not liable for any indirect, incidental, special, or
              consequential damages.
            </li>
            <li>
              Our total liability shall not exceed the platform fees paid by you
              in the 12 months preceding the claim.
            </li>
            <li>
              We are not responsible for customs seizures, delays, or
              international shipping issues.
            </li>
            <li>
              We are not liable for losses arising from your wallet security
              failures.
            </li>
            <li>
              The Platform is provided &quot;as is&quot; without warranties of
              any kind.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 13. Indemnification ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="indemnification"
          number={13}
          title="Indemnification"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <p>
            You agree to indemnify and hold GoFetch harmless from any claims,
            losses, or damages (including legal fees) arising from your use of
            the Platform, your violation of these Terms, or your violation of
            any rights of a third party.
          </p>
        </div>
      </section>

      {/* ── 14. Privacy ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="privacy" number={14} title="Privacy" />
        <div className="text-sm text-secondary leading-relaxed">
          <p>
            Your use of the Platform is also governed by our{" "}
            <a
              href="/privacy"
              className="underline text-primary hover:text-primary/80 transition-colors"
            >
              Privacy Policy
            </a>
            , which is incorporated into these Terms by reference.
          </p>
        </div>
      </section>

      {/* ── 15. Intellectual Property ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="intellectual-property"
          number={15}
          title="Intellectual Property"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <p>
            All content, trademarks, and intellectual property on the Platform
            are owned by GoFetch or its licensors. You may not copy, modify,
            distribute, or reverse-engineer any part of the Platform without
            our written consent.
          </p>
        </div>
      </section>

      {/* ── 16. Termination ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="termination" number={16} title="Termination" />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              You may terminate your account at any time by contacting support.
            </li>
            <li>
              GoFetch may suspend or terminate your account for violation of
              these Terms.
            </li>
            <li>
              Upon termination, your right to use the Platform ceases
              immediately.
            </li>
            <li>
              Outstanding obligations (including pending deliveries) survive
              termination.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 17. Governing Law ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading
          id="governing-law"
          number={17}
          title="Governing Law"
        />
        <div className="text-sm text-secondary leading-relaxed">
          <p>
            These Terms are governed by the laws of Indonesia. Any disputes
            shall be resolved in the courts of Jakarta, Indonesia, unless
            otherwise required by applicable law.
          </p>
        </div>
      </section>

      {/* ── 18. Changes to Terms ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="changes" number={18} title="Changes to Terms" />
        <div className="text-sm text-secondary leading-relaxed">
          <ul className="space-y-2 list-disc list-inside">
            <li>
              We may modify these Terms at any time by posting updated Terms on
              the Platform.
            </li>
            <li>
              Material changes will be notified via email or in-app
              notification.
            </li>
            <li>
              Continued use after changes constitutes acceptance of the
              updated Terms.
            </li>
          </ul>
        </div>
      </section>

      {/* ── 19. Contact ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5 space-y-4">
        <SectionHeading id="contact" number={19} title="Contact" />
        <div className="text-sm text-secondary leading-relaxed space-y-3">
          <p>For questions about these Terms:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              Email:{" "}
              <a
                href="mailto:legal@gofetchapp.com"
                className="underline text-primary hover:text-primary/80 transition-colors"
              >
                legal@gofetchapp.com
              </a>
            </li>
            <li>
              Support:{" "}
              <a
                href="mailto:support@gofetchapp.com"
                className="underline text-primary hover:text-primary/80 transition-colors"
              >
                support@gofetchapp.com
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
