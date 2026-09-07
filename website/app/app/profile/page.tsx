"use client";
// v2.1 - KYC Status button

import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setUser as setReduxUser } from "@/redux/slices/auth.slice";
import { fetchProfile, updateProfile, uploadPassport, submitKyc, checkKycStatus, fetchOrderCounts } from "@/redux/slices/profile.slice";
import { selectProfile, selectProfileIsLoading, selectProfileKycStatus, selectProfileOrdersCount, selectProfileRequestsCount } from "@/redux/selectors";
import Link from "next/link";
import { runPassportOcr, terminatePassportOcr } from "@/lib/passport-ocr";

export default function ProfilePage() {
  const { user: authUser } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  const profile = useAppSelector(selectProfile) as any;
  const kycStatus = useAppSelector(selectProfileKycStatus);
  const orderCount = useAppSelector(selectProfileOrdersCount);
  const tripCount = useAppSelector(selectProfileRequestsCount);

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const [passportUploading, setPassportUploading] = useState(false);
  const [passportScanning, setPassportScanning] = useState(false);
  const [passportScanProgress, setPassportScanProgress] = useState(0);
  const [passportData, setPassportData] = useState<{
    fullName: string;
    passportDocumentNo: string;
    documentType: string;
    documentNumber: string;
    nationality: string;
    dateOfBirth: string;
    sex: string;
    expiryDate: string;
    dateOfIssue: string;
    placeOfBirth: string;
  } | null>(null);
  const [savingPassportData, setSavingPassportData] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [checkingKyc, setCheckingKyc] = useState(false);

  const initializedRef = useRef(false);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchOrderCounts());
  }, [dispatch]);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      const hasPassportFields =
        profile.passportDocumentNo ||
        profile.passportFullName ||
        profile.passportNationality ||
        profile.passportPlaceOfBirth ||
        profile.passportImageUrl ||
        profile.passportDateOfBirth ||
        profile.passportSex ||
        profile.passportExpiryDate ||
        profile.passportDateOfIssue;
      if (hasPassportFields) {
        setPassportData({
          passportDocumentNo: profile.passportDocumentNo || "",
          fullName: profile.passportFullName || "",
          documentType: "P",
          documentNumber: profile.passportDocumentNo || "",
          nationality: profile.passportNationality || "",
          dateOfBirth: profile.passportDateOfBirth
            ? new Date(profile.passportDateOfBirth).toISOString().slice(0, 10)
            : "",
          sex: profile.passportSex || "",
          expiryDate: profile.passportExpiryDate
            ? new Date(profile.passportExpiryDate).toISOString().slice(0, 10)
            : "",
          dateOfIssue: profile.passportDateOfIssue
            ? new Date(profile.passportDateOfIssue).toISOString().slice(0, 10)
            : "",
          placeOfBirth: profile.passportPlaceOfBirth || "",
        });
      }
    }
  }, [profile]);

  // Release the Tesseract.js worker + WASM memory when the page unmounts.
  useEffect(() => {
    return () => {
      void terminatePassportOcr();
    };
  }, []);

  const initials = authUser?.name
    ? authUser?.name.startsWith("0x")
      ? "GF"
      : authUser?.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const result = await dispatch(updateProfile({ avatarUrl: base64 })).unwrap();
        if (authUser) dispatch(setReduxUser({ ...authUser, avatarUrl: base64 }));
      } catch {
        // silently ignore
      }
    };
    reader.readAsDataURL(file);
  };

  const startEditName = () => {
    setEditName(authUser?.name || "");
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== authUser?.name) {
      try {
        await dispatch(updateProfile({ name: trimmed })).unwrap();
        if (authUser) dispatch(setReduxUser({ ...authUser, name: trimmed }));
      } catch {
        // silently ignore
      }
    }
    setEditingName(false);
  };

  /** Upload passport image: save it AND run OCR scan to populate the structured fields. */
  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    setPassportUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      // 1) Save the image
      try {
        await dispatch(updateProfile({ passportImageUrl: dataUrl })).unwrap();
        if (authUser) dispatch(setReduxUser({ ...authUser, passportImageUrl: dataUrl }));
      } catch (err) {
        console.error("Failed to upload passport image:", err);
      } finally {
        setPassportUploading(false);
      }

      // 2) Run client-side OCR (Tesseract.js) to extract the structured fields.
      //    The server route no longer runs OCR itself — see /api/scan/passport
      //    and lib/passport-ocr.ts for the rationale.
      setPassportScanning(true);
      setPassportScanProgress(0);
      let ocrText = "";
      try {
        ocrText = await runPassportOcr(dataUrl, {
          onProgress: (pct) => setPassportScanProgress(pct),
        });
      } catch (err) {
        console.error("Client-side passport OCR failed:", err);
      }
      try {
        const result = await dispatch(uploadPassport({ file })).unwrap();
        const f = result;
        setPassportData({
          passportDocumentNo: (f.passportDocumentNo || "") || f.passportDocumentNo || "",
          fullName: f.passportFullName || f.passportFullName || "",
          documentType: "P",
          documentNumber: f.passportDocumentNo || "",
          nationality: f.passportNationality || "",
          dateOfBirth: f.passportDateOfBirth || "",
          sex: f.passportSex || "",
          expiryDate: f.passportExpiryDate || "",
          dateOfIssue: f.passportDateOfIssue || "",
          placeOfBirth: f.passportPlaceOfBirth || "",
        });
      } catch (err) {
        console.error("Passport scan error:", err);
      } finally {
        setPassportScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  /** Save the user-edited passport data fields to the profile. */
  const handleSavePassportData = async () => {
    if (!passportData) return;
    setSavingPassportData(true);
    try {
      await dispatch(updateProfile({
        passportFullName: passportData.fullName || authUser?.passportFullName || undefined,
        passportDocumentNo: passportData.passportDocumentNo || passportData.documentNumber || authUser?.passportDocumentNo || undefined,
        passportNationality: passportData.nationality || authUser?.passportNationality || undefined,
        passportDateOfBirth: passportData.dateOfBirth || authUser?.passportDateOfBirth || undefined,
        passportSex: passportData.sex || authUser?.passportSex || undefined,
        passportExpiryDate: passportData.expiryDate || authUser?.passportExpiryDate || undefined,
        passportDateOfIssue: passportData.dateOfIssue || authUser?.passportDateOfIssue || undefined,
        passportPlaceOfBirth: passportData.placeOfBirth || authUser?.passportPlaceOfBirth || undefined,
      })).unwrap();
      if (authUser) dispatch(setReduxUser({ ...authUser, ...profile }));
    } catch (err) {
      console.error("Failed to save passport data:", err);
    } finally {
      setSavingPassportData(false);
    }
  };

  /** Submit KYC for automatic server-side verification. The server validates
   *  that all required fields are present and auto-approves if the data matches
   *  the uploaded passport image. */
  const handleSubmitKyc = async () => {
    setSubmittingKyc(true);
    try {
      const result = await dispatch(submitKyc()).unwrap();
      setKycSubmitted(true);
      // Refresh auth state via Redux to reflect verified kycStatus
      await dispatch(fetchProfile());
    } catch (err) {
      console.error("KYC submission failed:", err);
      try {
        const result = await dispatch(submitKyc()).unwrap();
        setKycSubmitted(true);
        // Refresh auth state via Redux
      } catch {
        alert(err instanceof Error ? err.message : "Failed to submit KYC");
      }
    } finally {
      setSubmittingKyc(false);
    }
  };

  /** Check KYC status from the server and update the profile endpoint. */
  const handleCheckKyc = async () => {
    setCheckingKyc(true);
    try {
      const result = await dispatch(checkKycStatus()).unwrap();
      if (result.kycStatus === "verified") {
        // Sync to Redux if verified
        if (authUser) {
          dispatch(setReduxUser({ ...authUser, kycStatus: "verified" }));
        }
        // Also update the profile endpoint with the verified status
        if (authUser) {
          await dispatch(updateProfile({ kycStatus: "verified" })).unwrap();
        }
      }
    } catch {
      // silently ignore
    } finally {
      setCheckingKyc(false);
    }
  };

  const handleSaveEmail = async () => {
    const trimmed = emailDraft.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (trimmed === authUser?.email) return;
    setSavingEmail(true);
    try {
      await dispatch(updateProfile({ email: trimmed })).unwrap();
      if (authUser) dispatch(setReduxUser({ ...authUser, email: trimmed }));
      setEmailDraft("");
    } catch (err) {
      console.error("Failed to save email:", err);
    } finally {
      setSavingEmail(false);
    }
  };


  return (
    <div className="p-0 space-y-0">
      {/* Profile Card */}
      <div className="bg-surface-1 rounded-2xl border border-border p-6 flex flex-col items-center">
        {/* Avatar — clickable to upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative group w-24 h-24 rounded-full bg-success overflow-hidden mb-4 shrink-0"
        >
          {authUser?.avatarUrl ? (
            <img src={authUser?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-primary-color flex items-center justify-center w-full h-full">
              {initials}
            </span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-white"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
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

        {/* Name — editable inline */}
        {editingName ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") setEditingName(false);
            }}
            autoFocus
            className="text-xl font-bold text-center bg-transparent border-b-2 border-primary outline-none mb-1"
          />
        ) : (
          <div
            className="flex items-center gap-1.5 mb-1 cursor-pointer group"
            onClick={startEditName}
          >
            <h1 className="text-xl font-bold">{authUser?.name || "Anonymous"}</h1>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>
        )}

        {/* Email */}
        <p className="text-sm text-muted mb-3">{authUser?.email || "No email"}</p>

        {/* KYC badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-success rounded-full mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span className="text-sm font-medium text-primary-color">
            {kycStatus === "verified" ? "KYC Verified" : authUser?.kycStatus === "verified" ? "KYC Verified" : checkingKyc ? "Checking..." : "Unverified"}
          </span>
          <button
            type="button"
            onClick={handleCheckKyc}
            disabled={checkingKyc}
            className="ml-2 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded hover:bg-primary/30 disabled:opacity-50 transition-colors"
            title="Check your current KYC verification status"
          >
            {checkingKyc ? "..." : "KYC Status"}
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-success mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-sm font-bold">—</span>
            </div>
            <span className="text-xs text-muted">Rating</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-success mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
              </svg>
              <span className="text-sm font-bold">{orderCount}</span>
            </div>
            <span className="text-xs text-muted">Orders</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-success mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
              </svg>
              <span className="text-sm font-bold">{tripCount}</span>
            </div>
            <span className="text-xs text-muted">Trips</span>
          </div>
        </div>
      </div>

      {/* Profile Section — editable form for avatar / display name / email / wallet */}
      <div className="bg-surface-1 rounded-2xl border border-border p-5 mt-4">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          {/* Avatar — clickable to upload */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold select-none overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
            >
              {authUser?.avatarUrl ? (
                <img src={authUser?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                </svg>
              </div>
            </button>
            <div>
              <p className="text-sm text-muted">Click to upload avatar</p>
              <p className="text-xs text-muted">JPG, PNG. Max 5MB</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={editingName ? editName : (authUser?.name || "")}
              onFocus={startEditName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              defaultValue={authUser?.email && !authUser?.email.endsWith("@wallet.local") ? authUser?.email : ""}
              onChange={(e) => setEmailDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveEmail(); }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Signed in with (read-only wallet address) */}
          <div>
            <label className="block text-sm font-medium mb-1">Signed in with</label>
            <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-surface-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-sm font-mono text-muted truncate">
                {authUser?.walletAddress
                  ? `${authUser.walletAddress.slice(0, 6)}...${authUser.walletAddress.slice(-4)}`
                  : "No wallet connected"}
              </span>
            </div>
          </div>

          {/* Save Changes button — saves whatever dirty fields exist (name + email) */}
          <button
            type="button"
            onClick={async () => {
              if (savingProfile) return;
              setSavingProfile(true);
              try {
                if (editingName && editName.trim() && editName.trim() !== authUser?.name) {
                  await saveName();
                }
                if (emailDraft.trim() && emailDraft.trim() !== authUser?.email) {
                  await handleSaveEmail();
                }
              } finally {
                setSavingProfile(false);
              }
            }}
            disabled={savingProfile || (!editingName && !emailDraft.trim())}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* KYC Setup Progress — required steps to complete identity verification */}
      <div className="bg-surface-1 rounded-2xl border border-border p-5">
        {(() => {
          // Step-completion booleans — reflect actual local progress
          // (the backend kycStatus field only changes after a separate KYC review).
          const hasRealName = !!authUser?.name && !authUser?.name.startsWith("0x") && !authUser?.name.startsWith("User 0x");
          const hasAvatar = !!authUser?.avatarUrl;
          const hasRealEmail = !!authUser?.email && !authUser?.email.endsWith("@wallet.local");
          // Step is complete when BOTH the image is uploaded AND the scanned data
          // has been saved to the profile (so the KYC reviewer has the extracted fields).
          const hasPassport = !!authUser?.passportImageUrl && !!authUser?.passportFullName;
          const allDone = hasRealName && hasAvatar && hasRealEmail && hasPassport;

          // Badge reflects backend KYC status if set, otherwise local progress
          const currentStatus = kycStatus || authUser?.kycStatus || "none";
          const badgeLabel = currentStatus === "verified"
            ? "Verified"
            : currentStatus === "pending"
            ? "Under Review"
            : allDone
            ? "Ready to Submit"
            : "Not Started";
          const badgeClass = currentStatus === "verified"
            ? "bg-success text-white"
            : currentStatus === "pending"
            ? "bg-warning text-white"
            : allDone
            ? "bg-primary text-white"
            : "bg-surface-2 text-muted";

          const steps: Array<any> = [
            {
              done: hasRealName,
              icon: "user",
              label: "Display name",
              hint: "Set a name other than your wallet address.",
              cta: { label: "Edit", target: "name" },
            },
            {
              done: hasAvatar,
              icon: "image",
              label: "Profile photo",
              hint: "Upload an avatar so others can recognize you.",
              cta: { label: "Upload", target: "avatar" },
            },
            {
              done: hasRealEmail,
              icon: "mail",
              label: "Email address",
              hint: "Add a real email for delivery notifications.",
              cta: { label: "Edit", target: "email" },
            },
            {
              done: hasPassport,
              icon: "passport",
              label: "Passport or government ID",
              hint: "Required for KYC verification before accepting deliveries.",
              cta: { label: "Upload", target: "passport" },
            },
          ];

          const completed = steps.filter((s) => s.done).length; const allDoneLocal = hasRealName && hasAvatar && hasRealEmail && hasPassport;
          const progressPct = (completed / steps.length) * 100;

          return (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">KYC Setup</h2>
                  <p className="text-xs text-muted mt-0.5">Complete these steps to verify your identity.</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                  {badgeLabel}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted">{completed} of {steps.length} complete</span>
                  <span className="font-semibold text-primary">{Math.round(progressPct)}%</span>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Steps — each incomplete step has its field inline; no separate Edit/Upload buttons */}
              <div className="space-y-2.5">
                {/* 1. Display name */}
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasRealName ? "bg-success/5 border-success/30" : "bg-surface-2/50 border-border"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasRealName ? "bg-success text-white" : "bg-surface-3 text-muted"}`}>
                    {hasRealName ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">1</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${hasRealName ? "text-success" : "text-primary"}`}>
                      Display name
                    </p>
                    <p className="text-xs text-muted">Set a name other than your wallet address.</p>
                    {!hasRealName && (
                      <input
                        type="text"
                        defaultValue={authUser?.name || ""}
                        onFocus={startEditName}
                        onKeyDown={(e) => { if (e.key === "Enter") startEditName(); }}
                        placeholder="Your display name"
                        className="mt-2 w-full px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  </div>
                </div>

                {/* 2. Profile photo */}
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasAvatar ? "bg-success/5 border-success/30" : "bg-surface-2/50 border-border"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasAvatar ? "bg-success text-white" : "bg-surface-3 text-muted"}`}>
                    {hasAvatar ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">2</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${hasAvatar ? "text-success" : "text-primary"}`}>
                      Profile photo
                    </p>
                    <p className="text-xs text-muted">Upload an avatar so others can recognize you.</p>
                    {!hasAvatar && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 w-full px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm text-primary hover:bg-surface-hover transition-colors text-left"
                      >
                        + Upload photo
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Email address — inline editor with Save Changes */}
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasRealEmail ? "bg-success/5 border-success/30" : "bg-surface-2/50 border-border"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasRealEmail ? "bg-success text-white" : "bg-surface-3 text-muted"}`}>
                    {hasRealEmail ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">3</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${hasRealEmail ? "text-success" : "text-primary"}`}>
                      Email address
                    </p>
                    <p className="text-xs text-muted">Add a real email for delivery notifications.</p>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="email"
                        defaultValue={authUser?.email && !authUser?.email.endsWith("@wallet.local") ? authUser?.email : ""}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveEmail(); }}
                        placeholder="you@example.com"
                        className="flex-1 px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEmail}
                        disabled={savingEmail}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors shrink-0"
                      >
                        {savingEmail ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Passport or government ID */}
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${hasPassport ? "bg-success/5 border-success/30" : "bg-surface-2/50 border-border"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasPassport ? "bg-success text-white" : "bg-surface-3 text-muted"}`}>
                    {hasPassport ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">4</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${hasPassport ? "text-success" : "text-primary"}`}>
                      Passport or government ID
                    </p>
                    <p className="text-xs text-muted">Required for KYC verification before accepting deliveries.</p>

                    {!hasPassport && !passportData && (
                      <button
                        type="button"
                        onClick={() => passportInputRef.current?.click()}
                        disabled={passportUploading}
                        className="mt-2 w-full px-3 py-1.5 bg-surface-1 border border-border rounded-lg text-sm text-primary hover:bg-surface-hover transition-colors text-left disabled:opacity-50"
                      >
                        {passportUploading ? "Uploading..." : "+ Upload passport / government ID"}
                      </button>
                    )}

                    {/* Scanning state — shows live Tesseract progress (0–100). */}
                    {passportScanning && (
                      <div className="mt-2 w-full px-3 py-2 bg-primary/5 border border-primary/30 rounded-lg text-xs text-primary">
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>
                            {passportScanProgress > 0 && passportScanProgress < 100
                              ? `Scanning passport data… ${Math.round(passportScanProgress)}%`
                              : "Scanning passport data…"}
                          </span>
                        </div>
                        {passportScanProgress > 0 && (
                          <div className="mt-1.5 h-1 w-full bg-primary/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-200"
                              style={{ width: `${Math.min(100, Math.max(0, passportScanProgress))}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extracted editable fields — shown after scan completes */}
                    {passportData && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs text-muted">Review the extracted data and save if correct.</p>
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Full Name</label>
                          <input
                            type="text"
                            value={passportData.fullName}
                            onChange={(e) => setPassportData({ ...passportData, fullName: e.target.value })}
                            placeholder="Full name"
                            className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Document No.</label>
                            <input
                              type="text"
                              value={passportData.passportDocumentNo || passportData.documentNumber || passportData.documentType}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPassportData({ ...passportData, documentNumber: val, passportDocumentNo: val });
                              }}
                              placeholder="PA1234567"
                              className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Nationality</label>
                            <input
                              type="text"
                              value={passportData.nationality}
                              onChange={(e) => setPassportData({ ...passportData, nationality: e.target.value })}
                              placeholder="AUS"
                              className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Date of Birth</label>
                            <input
                              type="date"
                              value={passportData.dateOfBirth}
                              onChange={(e) => setPassportData({ ...passportData, dateOfBirth: e.target.value })}
                              className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Sex</label>
                            <select
                              value={passportData.sex}
                              onChange={(e) => setPassportData({ ...passportData, sex: e.target.value })}
                              className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">—</option>
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Date of Issue</label>
                            <input
                              type="date"
                              value={passportData.dateOfIssue}
                              onChange={(e) => setPassportData({ ...passportData, dateOfIssue: e.target.value })}
                              className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-muted mb-0.5">Expiry Date</label>
                            <input
                              type="date"
                              value={passportData.expiryDate}
                              onChange={(e) => setPassportData({ ...passportData, expiryDate: e.target.value })}
                              className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted mb-0.5">Place of Birth</label>
                          <input
                            type="text"
                            value={passportData.placeOfBirth}
                            onChange={(e) => setPassportData({ ...passportData, placeOfBirth: e.target.value })}
                            placeholder="YAROSLAVL"
                            className="w-full px-2 py-1.5 bg-surface-1 border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSavePassportData}
                            disabled={savingPassportData}
                            className="flex-1 px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
                          >
                            {savingPassportData ? "Saving..." : "Save passport data"}
                          </button>
                          <button
                            type="button"
                            onClick={() => passportInputRef.current?.click()}
                            disabled={passportUploading}
                            className="px-3 py-1.5 bg-surface-1 border border-border rounded text-xs text-muted hover:bg-surface-hover transition-colors"
                          >
                            Re-upload
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Show uploaded passport image when available */}
                    {authUser?.passportImageUrl && (
                      <div className="mt-2">
                        <p className="text-[10px] text-muted mb-1">Uploaded document:</p>
                        <button
                          type="button"
                          onClick={() => setPassportModalOpen(true)}
                          className="cursor-pointer block rounded-lg border border-border overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                        >
                          <img
                            src={authUser?.passportImageUrl}
                            alt="Passport"
                            className="w-24 h-16 object-cover"
                          />
                        </button>
                      </div>
                    )}

                    {/* Passport image modal popup */}
                    {passportModalOpen && (
                      <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                        onClick={() => setPassportModalOpen(false)}
                      >
                        <div
                          className="relative max-w-4xl w-full mx-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setPassportModalOpen(false)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18"/>
                              <path d="m6 6 12 12"/>
                            </svg>
                          </button>
                          <img
                            src={authUser?.passportImageUrl}
                            alt="Passport"
                            className="w-full rounded-xl border border-border shadow-2xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Hidden file input for passport upload — used by the Passport step above */}
        <input
          ref={passportInputRef}
          type="file"
          accept="image/*"
          onChange={handlePassportUpload}
          className="hidden"
        />

        {/* "Submit for KYC Review" button — shown once user is not yet verified.
            *  The badge above indicates "Ready to Submit" when all 4 steps are complete. */}
        {(kycStatus || authUser?.kycStatus) !== "verified" && (
          <div className="mt-4 pt-4 border-t border-border">
            {kycSubmitted ? (
              <div className="text-center py-2 px-3 bg-success/10 border border-success/30 rounded-lg text-sm text-success font-medium">
                ✓ KYC submitted for review. We&apos;ll notify you when approved.
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSubmitKyc}
                disabled={submittingKyc}
                className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submittingKyc ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Submit for KYC Review
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* How you're protected */}
      <div className="bg-surface-1 rounded-2xl border border-border p-5">
        <h2 className="text-lg font-bold mb-4">How you&apos;re protected</h2>
        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Smart-contract escrow</p>
              <p className="text-xs text-muted leading-relaxed">Payment is locked until you confirm the handoff.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Traveller collateral</p>
              <p className="text-xs text-muted leading-relaxed">Travellers stake 15% — slashed if they flake.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Cryptographic handoff</p>
              <p className="text-xs text-muted leading-relaxed">A one-time QR scan releases funds — no disputes.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-10 h-10 bg-success rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-color">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">On-chain reputation</p>
              <p className="text-xs text-muted leading-relaxed">Reviews build permanent trust.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings link */}
      <div className="bg-surface-1 rounded-2xl border border-border p-5">
        <Link
          href="/app/settings"
          className="flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm">Settings</p>
              <p className="text-xs text-muted">Account, theme, and preferences</p>
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary-color transition-colors">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
