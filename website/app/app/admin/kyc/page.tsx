"use client";

import { useState, useEffect } from "react";
import { fetchKycUsers, handleKycAction } from "@/redux/slices/brand.slice";
import { checkAdminStatus } from "@/redux/slices/explore.slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Link from "next/link";

export default function AdminKYCPage() {
  const { user: authUser } = useAppSelector((s) => s.auth);
  const users = useAppSelector((state) => state.brand.users);
  const loading = useAppSelector((state) => state.brand.isLoading);
  const [filter, setFilter] = useState<string>("all");
  const isAdminUser = useAppSelector((state) => state.explore.isAdmin);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAdminStatus()).unwrap();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchKycUsers()).unwrap();
  }, [dispatch]);

  const fetchUsers = () => {
    dispatch(fetchKycUsers()).unwrap();
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      await dispatch(handleKycAction({ userId, action })).unwrap();
      fetchUsers();
      setShowModal(false);
      setSelectedUser(null);
    } catch {
      // silently ignore
    }
  };

  const filteredUsers = filter === "all"
    ? users
    : users.filter((u) => u.kycStatus === filter);

  const statusCounts = {
    total: users.length,
    verified: users.filter((u) => u.kycStatus === "verified").length,
    pending: users.filter((u) => u.kycStatus === "pending").length,
    rejected: users.filter((u) => u.kycStatus === "rejected").length,
    none: users.filter((u) => u.kycStatus === "none" || !u.kycStatus).length,
  };

  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-surface-1 rounded-2xl border border-border p-8 text-center">
          <h2 className="text-xl font-bold text-error mb-2">Access Denied</h2>
          <p className="text-muted">You don't have admin privileges to manage KYC submissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Management</h1>
          <p className="text-muted text-sm">Review and manage user KYC verification submissions</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total", value: statusCounts.total, color: "bg-surface-2 text-muted" },
          { label: "Verified", value: statusCounts.verified, color: "bg-success/10 text-success" },
          { label: "Pending", value: statusCounts.pending, color: "bg-warning/10 text-warning" },
          { label: "Rejected", value: statusCounts.rejected, color: "bg-error/10 text-error" },
          { label: "Not Started", value: statusCounts.none, color: "bg-surface-2 text-muted" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 text-center border ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {["all", "verified", "pending", "rejected", "none"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-surface-2 text-muted hover:bg-surface-3"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-surface-1 rounded-2xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">User</th>
              <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Wallet</th>
              <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">KYC Status</th>
              <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Passport</th>
              <th className="text-left p-4 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => { setSelectedUser(user); setShowModal(true); }}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {(user.passportFullName || user.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.passportFullName || user.name || "Unknown"}</p>
                      <p className="text-xs text-muted">{user.email || "No email"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm font-mono text-muted">
                    {user.walletAddress?.slice(0, 6)}...{user.walletAddress?.slice(-4)}
                  </p>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.kycStatus === "verified" ? "bg-success/10 text-success"
                      : user.kycStatus === "pending" ? "bg-warning/10 text-warning"
                      : user.kycStatus === "rejected" ? "bg-error/10 text-error"
                      : "bg-surface-2 text-muted"
                  }`}>
                    {user.kycStatus || "none"}
                  </span>
                </td>
                <td className="p-4">
                  {user.passportImageUrl ? (
                    <img
                      src={user.passportImageUrl}
                      alt="Passport"
                      className="w-12 h-12 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <span className="text-muted text-sm">✗ No image</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {user.kycStatus !== "verified" && (
                      <button
                        onClick={() => handleAction(user.id, "approve")}
                        className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded hover:bg-success/20 transition-colors"
                        title="Approve and verify"
                      >
                        Approve
                      </button>
                    )}
                    {user.kycStatus === "verified" && (
                      <button
                        onClick={() => handleAction(user.id, "revoke")}
                        className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded hover:bg-warning/20 transition-colors"
                        title="Revoke verification"
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(user.id, "blacklist")}
                      className="px-2 py-1 bg-error/10 text-error text-xs font-medium rounded hover:bg-error/20 transition-colors"
                      title="Blacklist user"
                    >
                      Blacklist
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-muted">No users found</div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setSelectedUser(null); }}>
          <div className="bg-surface-1 rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{selectedUser.passportFullName || selectedUser.name || "Unknown User"}</h2>
              <button onClick={() => { setShowModal(false); setSelectedUser(null); }} className="p-2 hover:bg-surface-2 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* User info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-muted uppercase">Email</p>
                <p className="text-sm">{selectedUser.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase">Wallet</p>
                <p className="text-sm font-mono">{selectedUser.walletAddress ? selectedUser.walletAddress.slice(0, 6) + "..." + selectedUser.walletAddress.slice(-4) : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase">KYC Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedUser.kycStatus === "verified" ? "bg-success/10 text-success"
                    : selectedUser.kycStatus === "pending" ? "bg-warning/10 text-warning"
                    : selectedUser.kycStatus === "rejected" ? "bg-error/10 text-error"
                    : "bg-surface-2 text-muted"
                }`}>
                  {selectedUser.kycStatus || "none"}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted uppercase">Role</p>
                <p className="text-sm">{selectedUser.role || "N/A"}</p>
              </div>
            </div>

            {/* Passport Image */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Passport Photo</h3>
              {selectedUser.passportImageUrl ? (
                <img
                  src={selectedUser.passportImageUrl}
                  alt="Passport"
                  className="w-full max-w-md rounded-xl border border-border object-cover"
                />
              ) : (
                <p className="text-muted">No passport image uploaded</p>
              )}
            </div>

            {/* Passport Details */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Passport Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: selectedUser.passportFullName },
                  { label: "Document No", value: selectedUser.passportDocumentNo },
                  { label: "Nationality", value: selectedUser.passportNationality },
                  { label: "Sex", value: selectedUser.passportSex },
                  { label: "Date of Birth", value: selectedUser.passportDateOfBirth },
                  { label: "Place of Birth", value: selectedUser.passportPlaceOfBirth },
                  { label: "Date of Issue", value: selectedUser.passportDateOfIssue },
                  { label: "Date of Expiry", value: selectedUser.passportExpiryDate },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-muted uppercase">{field.label}</p>
                    <p className="text-sm">{field.value ? String(field.value).slice(0, 20) : "N/A"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              {selectedUser.kycStatus !== "verified" && (
                <button
                  onClick={() => handleAction(selectedUser.id, "approve")}
                  className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success-hover transition-colors"
                >
                  Approve & Verify
                </button>
              )}
              {selectedUser.kycStatus === "verified" && (
                <button
                  onClick={() => handleAction(selectedUser.id, "revoke")}
                  className="px-4 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:bg-warning-hover transition-colors"
                >
                  Revoke
                </button>
              )}
              <button
                onClick={() => handleAction(selectedUser.id, "blacklist")}
                className="px-4 py-2 bg-error text-white rounded-lg text-sm font-medium hover:bg-error-hover transition-colors"
              >
                Blacklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
