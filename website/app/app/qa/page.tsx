"use client";

import { useState } from "react";

/* ──────────────────────────────────────────────
   Accordion Item
   ────────────────────────────────────────────── */
function AccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors"
      >
        <span className="font-medium text-sm pr-4 text-primary">
          {question}
        </span>
        <svg
          className={`w-5 h-5 text-muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-secondary leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step Flow
   ────────────────────────────────────────────── */
interface Step {
  title: string;
  description: string;
}

function StepFlow({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 mb-6 last:mb-0">
          <div className="relative z-10 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm font-bold">
            {i + 1}
          </div>
          <div className="pt-2">
            <h3 className="font-semibold text-sm text-primary">
              {step.title}
            </h3>
            <p className="text-xs text-muted mt-1">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Data
   ────────────────────────────────────────────── */
const MEMBER_STEPS: Step[] = [
  {
    title: "Browse & Select",
    description: "Find the item you want delivered.",
  },
  {
    title: "Pay Securely",
    description:
      "Pay with credit card (Stripe). Funds go into escrow.",
  },
  {
    title: "Traveler Accepts",
    description:
      "A verified traveler heading your way accepts the job.",
  },
  {
    title: "Airport Pickup",
    description: "Traveler picks up your item at the airport.",
  },
  {
    title: "Confirm & Release",
    description:
      "You confirm receipt. Funds release to the traveler.",
  },
  {
    title: "Rate & Review",
    description: "Rate your experience.",
  },
];

const TRAVELER_STEPS: Step[] = [
  {
    title: "Browse Requests",
    description: "See delivery requests along your travel route.",
  },
  {
    title: "Accept a Job",
    description: "Accept a request that fits your itinerary.",
  },
  {
    title: "Pick Up at Airport",
    description: "Collect the item at the departure airport.",
  },
  {
    title: "Deliver to Member",
    description: "Hand over the item at the destination.",
  },
  {
    title: "Get Paid",
    description:
      "Member confirms delivery. Payment released to your bank.",
  },
];

const TRUST_QA: { q: string; a: string }[] = [
  {
    q: "Is my credit card information safe?",
    a: "Yes. We use Stripe for all payment processing. GoFetch never sees or stores your card details. Stripe is PCI Level 1 certified \u2014 the highest level of payment security.",
  },
  {
    q: "What happens if the traveler doesn\u2019t deliver my item?",
    a: "Your funds are locked in an escrow smart contract. If the traveler fails to deliver, the funds remain in escrow and can be refunded to you. The traveler cannot access funds until you confirm delivery.",
  },
  {
    q: "What happens if I pay but never receive the item?",
    a: "Escrow protects you. Funds are only released when you confirm receipt. If there\u2019s a dispute, our support team reviews the case and can intervene to release or refund funds.",
  },
  {
    q: "Do I need to understand crypto or wallets?",
    a: "No. GoFetch uses a custodial wallet model. You never see private keys, never sign crypto transactions, and never interact with a wallet. You pay with a credit card \u2014 the blockchain layer is invisible.",
  },
  {
    q: "How does the escrow contract work?",
    a: "When you pay, funds are locked in a smart contract on the blockchain. The contract has two release conditions: (1) the traveler confirms pickup, and (2) you confirm delivery. Only when both conditions are met are funds released to the traveler.",
  },
  {
    q: "Can the traveler access my funds before delivery?",
    a: "No. The escrow contract enforces a two-party confirmation. The traveler cannot release funds \u2014 only your confirmation as the member triggers the payout.",
  },
  {
    q: "What if there\u2019s a dispute?",
    a: "Both parties can raise a dispute. GoFetch\u2019s support team reviews the evidence (photos, chat logs, delivery confirmations) and makes a fair resolution. Funds remain in escrow until the dispute is resolved.",
  },
  {
    q: "Is GoFetch legal in my country?",
    a: "GoFetch operates as a delivery marketplace platform. The escrow mechanism uses blockchain for settlement transparency. Users are responsible for compliance with local import/export regulations. See the Legal section below.",
  },
];

const FAQ_QA: { q: string; a: string }[] = [
  {
    q: "How much does GoFetch cost?",
    a: "GoFetch charges a service fee on each transaction. The fee is transparent and shown before you confirm payment. Travelers receive the full reward amount.",
  },
  {
    q: "How are travelers verified?",
    a: "Travelers must complete identity verification (KYC) including government-issued ID and travel document verification. Only verified travelers can accept delivery requests.",
  },
  {
    q: "Can I cancel after paying?",
    a: "You can cancel before a traveler accepts the request for a full refund. After a traveler accepts, cancellation follows our cancellation policy \u2014 funds in escrow may be partially or fully released depending on the stage of delivery.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept credit and debit cards processed through Stripe. Cryptocurrency payments are not currently supported for members.",
  },
];

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */
export default function QAPage() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      {/* ── Hero ── */}
      <section className="text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
          How GoFetch Works
        </h1>
        <p className="text-lg text-secondary mb-2">
          Click &amp; Collect delivery, secured by escrow
        </p>
        <p className="text-sm text-muted max-w-md mx-auto">
          A traveler heading your way picks up your item at the airport
          and delivers it to you. Funds are held in escrow until delivery
          is confirmed.
        </p>
      </section>

      {/* ── For Members ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-xl font-bold text-primary mb-1">
          For Members
        </h2>
        <p className="text-xs text-muted mb-6">
          Requesting a delivery
        </p>
        <StepFlow steps={MEMBER_STEPS} />
      </section>

      {/* ── For Delivery Travelers ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-xl font-bold text-primary mb-1">
          For Delivery Travelers
        </h2>
        <p className="text-xs text-muted mb-6">
          Fulfilling a delivery
        </p>
        <StepFlow steps={TRAVELER_STEPS} />
      </section>

      {/* ── Trust Q&A ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-xl font-bold text-primary mb-1">
          Why You Can Trust GoFetch
        </h2>
        <p className="text-xs text-muted mb-6">
          Your security and peace of mind
        </p>
        <div className="space-y-3">
          {TRUST_QA.map((item) => (
            <AccordionItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </section>

      {/* ── Legal Considerations ── */}
      <section className="rounded-2xl border border-[var(--app-warning-border)] bg-[var(--app-warning-bg)]/10 p-5">
        <h2 className="text-xl font-bold text-primary mb-1">
          Legal Considerations
        </h2>
        <p className="text-xs text-muted mb-6">
          International border transfers
        </p>

        <div className="space-y-5">
          {/* Customs & Import Duties */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-1">
              Customs &amp; Import Duties
            </h3>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
              <li>
                Items crossing international borders may be subject to
                customs duties, taxes, or import fees.
              </li>
              <li>
                These fees are the responsibility of the member (buyer),
                not the traveler or GoFetch.
              </li>
              <li>
                Travelers may be asked to declare items at customs
                &mdash; this is standard for international travel.
              </li>
            </ul>
          </div>

          {/* Prohibited Items */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-1">
              Prohibited Items
            </h3>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
              <li>
                GoFetch does not facilitate the transfer of prohibited,
                restricted, or illegal items.
              </li>
              <li>
                Users must comply with the laws of both the departure and
                destination countries.
              </li>
              <li>
                Prohibited items include but are not limited to: weapons,
                drugs, hazardous materials, counterfeit goods, items
                subject to sanctions.
              </li>
            </ul>
          </div>

          {/* Traveler Liability */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-1">
              Traveler Liability
            </h3>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
              <li>
                Travelers act as independent contractors, not GoFetch
                employees.
              </li>
              <li>
                Travelers are responsible for understanding and complying
                with customs regulations.
              </li>
              <li>
                GoFetch is not liable for items seized at customs or for
                customs-related delays.
              </li>
            </ul>
          </div>

          {/* Member Responsibility */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-1">
              Member Responsibility
            </h3>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
              <li>
                Members must ensure the item they&apos;re requesting is
                legally importable to their country.
              </li>
              <li>
                Members are responsible for any duties, taxes, or fees
                imposed by their country&apos;s customs authority.
              </li>
              <li>
                Members should verify that the item complies with local
                regulations before requesting delivery.
              </li>
            </ul>
          </div>

          {/* Dispute Resolution */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-1">
              Dispute Resolution
            </h3>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
              <li>
                Disputes are handled through GoFetch&apos;s internal
                resolution process.
              </li>
              <li>
                Both parties agree to GoFetch&apos;s Terms of Service
                when creating an account.
              </li>
              <li>
                Escrow funds remain locked until a resolution is reached.
              </li>
            </ul>
          </div>

          {/* Data & Privacy */}
          <div>
            <h3 className="font-semibold text-sm text-primary mb-1">
              Data &amp; Privacy
            </h3>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
              <li>
                GoFetch processes personal data in accordance with
                applicable data protection laws.
              </li>
              <li>
                Wallet addresses are derived from account identity &mdash;
                no personal crypto activity is exposed.
              </li>
              <li>
                Transaction records on-chain are pseudonymous (wallet
                addresses only, not personal identities).
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-xl font-bold text-primary mb-1">
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-muted mb-6">General questions</p>
        <div className="space-y-3">
          {FAQ_QA.map((item) => (
            <AccordionItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
