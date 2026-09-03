import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Create app_settings table if not exists
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Insert default theme if not exists
  const existing = await prisma.appSetting.findUnique({ where: { key: "theme" } });
  if (!existing) {
    await prisma.appSetting.create({
      data: {
        key: "theme",
        value: {
          light: {
            primary: "#2A5A4A",
            primaryHover: "#234d3f",
            primaryActive: "#1c4034",
            secondary: "#C97A5E",
            secondaryHover: "#b56a4e",
            bg: "#FCFBFA",
            surface0: "#FCFBFA",
            surface1: "#FFFFFF",
            surface2: "#F8F7F5",
            surface3: "#F2F0ED",
            text: "#1a1a1a",
            textSecondary: "#4B5563",
            textMuted: "#6B7280",
            textDisabled: "#9CA3AF",
            border: "#E5E3DF",
            borderStrong: "#D1D5DB",
            successBg: "#DCFCE7",
            successText: "#16A34A",
            successBorder: "#BBF7D0",
            errorBg: "#FEE2E2",
            errorText: "#DC2626",
            errorBorder: "#FECACA",
            warningBg: "#FEF9C3",
            warningText: "#CA8A04",
            warningBorder: "#FEF08A",
            infoBg: "#DBEAFE",
            infoText: "#2563EB",
            infoBorder: "#BFDBFE",
          },
          dark: {
            primary: "#3d8b6e",
            primaryHover: "#2A5A4A",
            primaryActive: "#234d3f",
            secondary: "#d4896a",
            secondaryHover: "#C97A5E",
            bg: "#0f1114",
            surface0: "#0f1114",
            surface1: "#181b20",
            surface2: "#1e2127",
            surface3: "#252830",
            text: "#e4e4e7",
            textSecondary: "#a1a1aa",
            textMuted: "#71717a",
            textDisabled: "#52525b",
            border: "#2e3138",
            borderStrong: "#383b42",
            successBg: "rgba(34,197,94,0.12)",
            successText: "#4ade80",
            successBorder: "rgba(34,197,94,0.25)",
            errorBg: "rgba(239,68,68,0.12)",
            errorText: "#f87171",
            errorBorder: "rgba(239,68,68,0.25)",
            warningBg: "rgba(234,179,8,0.12)",
            warningText: "#facc15",
            warningBorder: "rgba(234,179,8,0.25)",
            infoBg: "rgba(59,130,246,0.12)",
            infoText: "#60a5fa",
            infoBorder: "rgba(59,130,246,0.25)",
          },
        },
      },
    });
    console.log("Created default theme setting");
  } else {
    console.log("Theme setting already exists");
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
