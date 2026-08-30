import React from "react";
import { LegalLayout } from "@/src/components/LegalLayout";

export default function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      updated="30 August 2026"
      intro="Welcome to TrustMule, a peer-to-peer marketplace that connects buyers who need items from abroad with travellers who can carry them. By creating an account or using the app you agree to these Terms."
      sections={[
        {
          heading: "The service",
          body: "TrustMule is a technology platform that helps buyers and travellers find each other and coordinate a purchase and hand-over. TrustMule is not the seller, importer, exporter, or carrier of any item, and is not a party to the agreement between a buyer and a traveller.",
        },
        {
          heading: "Eligibility & accounts",
          body: "You must be at least 18 years old and legally able to enter into contracts. You are responsible for the accuracy of your profile, for completing identity verification (KYC) when requested, and for keeping your login and wallet credentials secure.",
        },
        {
          heading: "Escrow & payments",
          body: "Payments for an order (item price + service fee) are held in escrow until the hand-over is confirmed. Travellers stake collateral that may be partially forfeited if they cancel without a valid reason. A platform service fee (typically 3%) is deducted on settlement. In preview/test mode balances are simulated; on the live network, transactions settle in USDC on-chain and are irreversible once confirmed.",
        },
        {
          heading: "Customs, duties & prohibited items",
          body: "You are solely responsible for complying with all customs, import/export, tax and duty rules in every relevant country. Travellers must purchase items from a retail store, keep the itemised receipt, and truthfully declare goods carried on behalf of others. You must never request or carry prohibited, restricted, counterfeit, hazardous, or illegal items, or anything you did not personally purchase and inspect.",
        },
        {
          heading: "Hand-over & confirmation",
          body: "The buyer should inspect the item before completing the cryptographic QR hand-over. Once the code is scanned (or receipt is confirmed), escrow releases automatically and the sale is final. Cross-border returns are generally not supported.",
        },
        {
          heading: "Disputes & arbitration",
          body: "If something goes wrong, either party may open a dispute and submit evidence. Escrow is frozen while the case is reviewed by TrustMule or an approved arbitration process. You agree to cooperate and provide truthful, verifiable proof.",
        },
        {
          heading: "Reputation & reviews",
          body: "After a completed order, members may rate each other from 1 to 5 stars. Reviews must be honest. Manipulating ratings, creating fake accounts, or wash-trading is prohibited and may lead to suspension.",
        },
        {
          heading: "Fees & taxes",
          body: "You are responsible for any taxes arising from your activity, including income earned as a traveller. Service fees are shown before you confirm an order.",
        },
        {
          heading: "Prohibited conduct",
          body: "No fraud, money laundering, harassment, off-platform circumvention of escrow, or use of the app for anything illegal. We may suspend or terminate accounts that violate these Terms.",
        },
        {
          heading: "Liability",
          body: "The service is provided \u201cas is\u201d. To the maximum extent permitted by law, TrustMule is not liable for the acts of buyers or travellers, lost, damaged, seized or delayed goods, or crypto network risks. Your use of the platform is at your own risk.",
        },
        {
          heading: "Changes",
          body: "We may update these Terms from time to time. Continued use after an update means you accept the revised Terms.",
        },
      ]}
    />
  );
}
