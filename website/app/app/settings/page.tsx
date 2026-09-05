"use client";

import { useState, useEffect, useRef } from "react";
import { useTenant } from "@/components/providers/TenantProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAccount, useDisconnect } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/auth.slice";
import ThemeEditor from "@/components/admin/ThemeEditor";
import { useLogout } from "@/lib/useLogout";

/* ─── Database Configuration Card ─── */
function DatabaseConfigCard() {
  const [projectId, setProjectId] = useState("");
  const [branchName, setBranchName] = useState("");
  const [databaseName, setDatabaseName] = useState("neondb");
  const [provisioning, setProvisioning] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
    connection?: { direct: string; pooled: string; database: string };
    branch?: { id: string; name: string };
  } | null>(null);
  const [copied, setCopied] = useState<"direct" | "pooled" | null>(null);

  const handleProvision = async () => {
    if (!projectId.trim()) return;
    setProvisioning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/neon/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId.trim(),
          branchName: branchName.trim() || undefined,
          databaseName: databaseName.trim() || "neondb",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Provisioning failed");
      setResult({
        type: "success",
        text: `Branch "${data.branch.name}" created successfully!`,
        connection: data.connection,
        branch: data.branch,
      });
    } catch (err) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : "Provisioning failed",
      });
    } finally {
      setProvisioning(false);
    }
  };

  const copyToClipboard = async (text: string, type: "direct" | "pooled") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">Database Configuration</h2>
        <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full font-medium">
          Admin
        </span>
      </div>
      <p className="text-sm text-muted mb-6">
        Configure your Neon PostgreSQL database. Auto-provision creates an isolated branch + database for this tenant.
      </p>

      <div className="space-y-4">
        {/* Neon Project ID */}
        <div>
          <label className="block text-sm font-medium mb-1">Neon Project ID</label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="e.g. bold-sea-av88uuiz"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted mt-1">
            Found in Neon Console → Project Settings → General
          </p>
        </div>

        {/* Branch Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Branch Name (optional)</label>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. tenant-gofetch"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted mt-1">
            Leave blank for auto-generated name
          </p>
        </div>

        {/* Database Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Database Name</label>
          <input
            type="text"
            value={databaseName}
            onChange={(e) => setDatabaseName(e.target.value)}
            placeholder="neondb"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Auto-Provision Button */}
        <Button
          variant="primary"
          onClick={handleProvision}
          disabled={!projectId.trim() || provisioning}
          className="w-full"
        >
          {provisioning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Provisioning...
            </span>
          ) : (
            "Auto-Provision Neon Database"
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-4 ${result.type === "success" ? "bg-success/10 border border-success/20" : "bg-error/10 border border-error/20"}`}>
            <p className={`text-sm font-medium ${result.type === "success" ? "text-success" : "text-error"}`}>
              {result.text}
            </p>

            {result.connection && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted font-medium">Connection Strings:</p>

                {/* Pooled URL */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-16 shrink-0">Pooled:</span>
                  <code className="flex-1 text-xs bg-surface-2 px-2 py-1 rounded break-all font-mono">
                    {result.connection.pooled}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.connection!.pooled, "pooled")}
                    className="text-xs text-primary-color hover:underline shrink-0"
                  >
                    {copied === "pooled" ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Direct URL */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-16 shrink-0">Direct:</span>
                  <code className="flex-1 text-xs bg-surface-2 px-2 py-1 rounded break-all font-mono">
                    {result.connection.direct}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.connection!.direct, "direct")}
                    className="text-xs text-primary-color hover:underline shrink-0"
                  >
                    {copied === "direct" ? "Copied!" : "Copy"}
                  </button>
                </div>

                {result.branch && (
                  <p className="text-xs text-muted mt-2">
                    Branch ID: <span className="font-mono">{result.branch.id}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function getInitials(fullName: string): string {
  if (!fullName.trim()) return "?";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function SettingsPage() {
  const { config: tenant } = useTenant();
  const { mode, setMode } = useTheme();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const dispatch = useAppDispatch();
  const { user: authUser, token } = useAppSelector((s) => s.auth);
  const handleLogout = useLogout();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [brandColors, setBrandColors] = useState({ primary: "#2A5A4A", secondary: "#C97A5E" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Brand Assets state
  const [brandName, setBrandName] = useState("GoFetch");
  const [brandSubtitle, setBrandSubtitle] = useState("Global Delivery");
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandFavicon, setBrandFavicon] = useState<string | null>(null);
  const [brandLoadingGraphic, setBrandLoadingGraphic] = useState<string | null>(null);
  const [brandLoginTagline, setBrandLoginTagline] = useState("P2P Global Shopping & Delivery");
  const [brandLoginSubtitle, setBrandLoginSubtitle] = useState("Connect your wallet to start buying or delivering items worldwide.");
  const [brandPoweredBy, setBrandPoweredBy] = useState("Powered by USDC on Base Sepolia");
  const [brandSaving, setBrandSaving] = useState(false);
  const brandLogoRef = useRef<HTMLInputElement>(null);
  const brandFaviconRef = useRef<HTMLInputElement>(null);
  const brandLoadingRef = useRef<HTMLInputElement>(null);

  // Read live CSS variable values for Brand Customization
  const readBrandColors = () => {
    const root = document.documentElement;
    const primary = getComputedStyle(root).getPropertyValue("--app-primary").trim() || "#2A5A4A";
    const secondary = getComputedStyle(root).getPropertyValue("--app-secondary").trim() || "#C97A5E";
    setBrandColors({ primary, secondary });
  };

  // Check admin status + load profile
  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadData = async () => {
      try {
        // Check admin
        const adminRes = await fetch("/api/admin/check", { signal: controller.signal });
        if (!ignore && adminRes.ok) {
          const adminData = await adminRes.json();
          setIsAdmin(adminData.isAdmin);
        }

        // Load profile
        const res = await fetch("/api/auth/me", { signal: controller.signal });
        if (!ignore && res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setEmail(data.email || "");
          setAvatarUrl(data.avatarUrl || null);
          if (data.theme) setMode(data.theme);
        } else if (!ignore && authUser) {
          setName(authUser.name || "");
          setEmail(authUser.email || "");
        }

        // Load brand settings
        const brandRes = await fetch("/api/admin/brand", { signal: controller.signal });
        if (!ignore && brandRes.ok) {
          const brandData = await brandRes.json();
          setBrandName(brandData.name || "GoFetch");
          setBrandSubtitle(brandData.subtitle || "Global Delivery");
          setBrandLogo(brandData.logo || null);
          setBrandFavicon(brandData.favicon || null);
          setBrandLoadingGraphic(brandData.loadingGraphic || null);
          setBrandLoginTagline(brandData.loginTagline || "P2P Global Shopping & Delivery");
          setBrandLoginSubtitle(brandData.loginSubtitle || "Connect your wallet to start buying or delivering items worldwide.");
          setBrandPoweredBy(brandData.poweredBy || "Powered by USDC on Base Sepolia");
        }
      } catch {
        if (!ignore && authUser) {
          setName(authUser.name || "");
          setEmail(authUser.email || "");
        }
      }
    };

    loadData();
    readBrandColors();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be under 5MB" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, theme: mode, avatarUrl }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();

      if (authUser && token) {
        dispatch(
          setCredentials({
            user: {
              ...authUser,
              name: updated.name,
              email: updated.email,
              avatarUrl: updated.avatarUrl,
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

  const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo must be under 2MB" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBrandLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Favicon must be under 2MB" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBrandFavicon(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLoadingGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Loading graphic must be under 2MB" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBrandLoadingGraphic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = async () => {
    setBrandSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName,
          subtitle: brandSubtitle,
          logo: brandLogo,
          favicon: brandFavicon,
          loadingGraphic: brandLoadingGraphic,
          loginTagline: brandLoginTagline,
          loginSubtitle: brandLoginSubtitle,
          poweredBy: brandPoweredBy,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save brand settings");
      }
      setMessage({ type: "success", text: "Brand settings saved successfully" });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save brand settings",
      });
    } finally {
      setBrandSaving(false);
    }
  };

  // Re-read brand colors when mode changes (theme switch)
  useEffect(() => {
    // Small delay to let CSS variables update after theme switch
    const timer = setTimeout(readBrandColors, 50);
    return () => clearTimeout(timer);
  }, [mode]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-color">Settings</h1>
        <p className="text-muted">
          Manage your {tenant?.displayName || "GoFetch"} account
        </p>
      </div>

      {/* Brand Assets — Admin only */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold">Brand Assets</h2>
            <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full font-medium">
              Admin
            </span>
          </div>
          <p className="text-sm text-muted mb-6">
            Customize the brand logo, name, favicon, login page, and loading screen. Changes apply after saving.
          </p>

          <div className="space-y-6">
            {/* Brand Logo */}
            <div>
              <label className="block text-sm font-medium mb-2">Brand Logo</label>
              <p className="text-xs text-muted mb-3">Used in sidebar and header. PNG, GIF, JPG, or SVG. Max 2MB.</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {brandLogo ? (
                    <img src={brandLogo} alt="Brand logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">G</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={brandLogoRef}
                    type="file"
                    accept="image/png,image/gif,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={handleBrandLogoUpload}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => brandLogoRef.current?.click()}
                      className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      Upload Logo
                    </button>
                    {brandLogo && (
                      <button
                        onClick={() => setBrandLogo(null)}
                        className="px-3 py-2 text-sm text-error border border-error/20 rounded-lg hover:bg-error/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Display Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Brand Display Name</label>
              <p className="text-xs text-muted mb-3">Shown in sidebar, header, and as the login page heading. Default: "GoFetch"</p>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="GoFetch"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Sub-brand Line */}
            <div>
              <label className="block text-sm font-medium mb-2">Sub-brand Line</label>
              <p className="text-xs text-muted mb-3">Shown below brand name in sidebar. Default: "Global Delivery"</p>
              <input
                type="text"
                value={brandSubtitle}
                onChange={(e) => setBrandSubtitle(e.target.value)}
                placeholder="Global Delivery"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Login Page Subtitle */}
            <div>
              <label className="block text-sm font-medium mb-2">Login Page Subtitle</label>
              <p className="text-xs text-muted mb-3">Tagline below the heading on login. Default: "P2P Global Shopping & Delivery"</p>
              <input
                type="text"
                value={brandLoginTagline}
                onChange={(e) => setBrandLoginTagline(e.target.value)}
                placeholder="P2P Global Shopping & Delivery"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Login Page CTA Copy */}
            <div>
              <label className="block text-sm font-medium mb-2">Login Page CTA Copy</label>
              <p className="text-xs text-muted mb-3">Description above the connect button. Default: "Connect your wallet to start buying or delivering items worldwide."</p>
              <textarea
                value={brandLoginSubtitle}
                onChange={(e) => setBrandLoginSubtitle(e.target.value)}
                placeholder="Connect your wallet to start buying or delivering items worldwide."
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Powered By */}
            <div>
              <label className="block text-sm font-medium mb-2">Powered By</label>
              <p className="text-xs text-muted mb-3">Footer text on login page. Default: "Powered by USDC on Base Sepolia"</p>
              <input
                type="text"
                value={brandPoweredBy}
                onChange={(e) => setBrandPoweredBy(e.target.value)}
                placeholder="Powered by USDC on Base Sepolia"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Favicon */}
            <div>
              <label className="block text-sm font-medium mb-2">Favicon (.ico)</label>
              <p className="text-xs text-muted mb-3">Browser tab icon. ICO, PNG, or SVG. Max 2MB.</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {brandFavicon ? (
                    <img src={brandFavicon} alt="Favicon" className="w-full h-full object-cover" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={brandFaviconRef}
                    type="file"
                    accept="image/x-icon,image/png,image/svg+xml"
                    className="hidden"
                    onChange={handleFaviconUpload}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => brandFaviconRef.current?.click()}
                      className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      Upload Favicon
                    </button>
                    {brandFavicon && (
                      <button
                        onClick={() => setBrandFavicon(null)}
                        className="px-3 py-2 text-sm text-error border border-error/20 rounded-lg hover:bg-error/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Graphic */}
            <div>
              <label className="block text-sm font-medium mb-2">Loading Graphic</label>
              <p className="text-xs text-muted mb-3">Shown during page load. Any image format. Max 2MB.</p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-surface-2 border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {brandLoadingGraphic ? (
                    <img src={brandLoadingGraphic} alt="Loading graphic" className="w-full h-full object-cover" />
                  ) : (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={brandLoadingRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLoadingGraphicUpload}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => brandLoadingRef.current?.click()}
                      className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      Upload Graphic
                    </button>
                    {brandLoadingGraphic && (
                      <button
                        onClick={() => setBrandLoadingGraphic(null)}
                        className="px-3 py-2 text-sm text-error border border-error/20 rounded-lg hover:bg-error/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleSaveBrand}
                disabled={brandSaving || !brandName.trim()}
                className="w-full"
              >
                {brandSaving ? "Saving..." : "Save Brand Settings"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Brand Customization — shows live theme colors */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Brand Customization</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted">Current brand colors from your theme</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full shadow-sm"
                style={{ backgroundColor: brandColors.primary }}
              />
              <div>
                <p className="text-sm font-medium">Primary</p>
                <p className="text-xs text-muted font-mono">{brandColors.primary}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full shadow-sm"
                style={{ backgroundColor: brandColors.secondary }}
              />
              <div>
                <p className="text-sm font-medium">Secondary</p>
                <p className="text-xs text-muted font-mono">{brandColors.secondary}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Admin Theme Editor — only visible to admins */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold">Theme Customization</h2>
            <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full font-medium">
              Admin
            </span>
          </div>
          <p className="text-sm text-muted mb-6">
            Edit all CSS variables for light and dark mode. Changes apply live as you edit.
          </p>
          <ThemeEditor />
        </Card>
      )}

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
            <span className="text-xs px-2 py-1 bg-success text-success rounded-full">
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
        <h2 className="text-xl font-semibold mb-4">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Connected Account</p>
              <p className="text-sm text-muted font-mono">
                {address
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : "Not connected"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              disconnect();
              handleLogout();
            }}>
              Disconnect
            </Button>
          </div>
        </div>
      </Card>

      {/* Database Configuration — Admin only */}
      {isAdmin && <DatabaseConfigCard />}

      <Card>
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="space-y-4">
          <p className="text-sm text-muted">Choose your preferred theme mode</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "light" as const, label: "Light", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                </svg>
              ) },
              { value: "dark" as const, label: "Dark", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) },
              { value: "system" as const, label: "System", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/>
                </svg>
              ) },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setMode(opt.value);
                  fetch("/api/user/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ theme: opt.value }),
                  }).catch(() => {});
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  mode === opt.value
                    ? "border-[var(--app-primary)] bg-[var(--app-primary)]/10 text-[var(--app-primary)]"
                    : "border-[var(--app-border)] hover:border-[var(--app-border-strong)] text-[var(--app-text-muted)]"
                }`}
              >
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          {/* Avatar — clickable to upload */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold select-none overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(name)
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <div>
              <p className="text-sm text-muted">Click to upload avatar</p>
              <p className="text-xs text-muted">JPG, PNG. Max 5MB</p>
            </div>
          </div>

          {/* Display Name — left-aligned */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Signed in with */}
          <div>
            <label className="block text-sm font-medium mb-1">Signed in with</label>
            <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-surface-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-sm font-mono text-muted truncate">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet connected"}
              </span>
            </div>
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
                  ? "text-success"
                  : "text-error"
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
                  <div className="w-11 h-6 bg-surface-3 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}
