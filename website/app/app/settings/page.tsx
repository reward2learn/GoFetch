"use client";

import { useState, useEffect } from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/auth.slice";

export default function SettingsPage() {
  const { config: tenant } = useTenant();
  const { address } = useAccount();
  const dispatch = useAppDispatch();
  const { user: authUser, token } = useAppSelector((s) => s.auth);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load current profile
  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/me", { signal: controller.signal });
        if (!ignore && res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
        } else if (!ignore && authUser) {
          setName(authUser.name || "");
          setEmail(authUser.email || "");
        }
      } catch {
        if (!ignore && authUser) {
          setName(authUser.name || "");
          setEmail(authUser.email || "");
        }
      }
    };

    loadProfile();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []); // NO authUser dependency — only fetch on mount

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();

      // Update Redux state
      if (authUser && token) {
        dispatch(
          setCredentials({
            user: {
              ...authUser,
              name: updated.name,
              email: updated.email,
            },
            token,
          })
        );
      }

      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Settings</h1>
        <p className="text-muted">
          Manage your {tenant?.displayName || "GoFetch"} account
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Tenant Information</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Application</p>
              <p className="text-sm text-muted">
                {tenant?.displayName || "GoFetch"}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Template</p>
              <p className="text-sm text-muted">
                {tenant?.template || "delivery-marketplace"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Wallet</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connected Wallet</p>
              <p className="text-sm text-muted font-mono">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </p>
            </div>
            <Button variant="outline" size="sm">
              Disconnect
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Brand Customization</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: tenant?.primaryColor || "#2A5A4A",
                }}
              />
              <span className="text-sm">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: tenant?.secondaryColor || "#C97A5E",
                }}
              />
              <span className="text-sm">Secondary</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Display Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          {message && (
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-4">
          {["Email notifications", "Push notifications", "SMS notifications"].map(
            (item) => (
              <div key={item} className="flex items-center justify-between">
                <p>{item}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
