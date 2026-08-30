import React from "react";
import { LegalLayout } from "@/src/components/LegalLayout";

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      updated="30 August 2026"
      intro="This Privacy Policy explains what information TrustMule collects, how we use it, and the choices you have. We aim to collect only what we need to run a safe marketplace."
      sections={[
        {
          heading: "Information we collect",
          body: "Account details (name, email), your profile and reputation, shopping requests, travel plans, orders and messages, images you upload (product photos, receipts, evidence), your wallet address and transaction history, and basic device/usage data needed to operate the app.",
        },
        {
          heading: "Identity verification (KYC)",
          body: "When you complete verification, identity documents are handled by our verification partner to help prevent fraud and comply with financial regulations. We store the verification status, not your raw documents on-chain.",
        },
        {
          heading: "How we use your information",
          body: "To match buyers and travellers, run escrow and payments, enable chat and hand-over, calculate reputation, detect fraud and abuse, provide support, and meet legal obligations.",
        },
        {
          heading: "Sharing",
          body: "Your public profile (name, rating, badges, stats) is visible to other members you interact with. We share information with service providers (storage, verification, payments) and when required by law. We do not sell your personal data.",
        },
        {
          heading: "Blockchain data",
          body: "On the live network, escrow transactions and settlement are recorded on a public blockchain and are, by design, permanent and visible. Do not put sensitive personal data into on-chain fields.",
        },
        {
          heading: "Data retention",
          body: "We keep information for as long as your account is active and as needed for legal, dispute, and accounting purposes. Records tied to completed transactions may be retained longer where required.",
        },
        {
          heading: "Your choices & rights",
          body: "You can view and update your profile, request account deletion, and manage device permissions (camera, photos) in your device settings. Subject to law, you may request access to or deletion of your personal data.",
        },
        {
          heading: "Security",
          body: "We use reasonable technical and organisational measures to protect your data. No method of transmission or storage is 100% secure; keep your credentials and wallet safe.",
        },
        {
          heading: "Children",
          body: "TrustMule is not intended for anyone under 18, and we do not knowingly collect their data.",
        },
        {
          heading: "Contact",
          body: "For privacy questions or requests, contact support through the app. We may update this policy and will note the effective date above.",
        },
      ]}
    />
  );
}
