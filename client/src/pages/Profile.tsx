import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { User, Mail, Phone, Building2, Save, Check } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    businessName: "",
  });
  const [saved, setSaved] = useState(false);

  // Populate form once user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: (user as any).phone || "",
        businessName: (user as any).businessName || "",
      });
    }
  }, [user?.id]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (refresh) refresh();
      toast.success("Profile saved successfully!");
    },
    onError: (err) => toast.error(err.message || "Failed to save profile"),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProfile.mutate({
      name: formData.name || undefined,
      phone: formData.phone || undefined,
      businessName: formData.businessName || undefined,
    });
  };

  const labelStyle = { color: "oklch(72% 0.04 220)", fontSize: "0.875rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" };
  const inputStyle = {
    background: "oklch(20% 0.04 220)",
    border: "1px solid oklch(30% 0.05 220)",
    color: "white",
    borderRadius: "0.75rem",
    padding: "0.625rem 0.875rem",
    width: "100%",
    outline: "none",
    fontSize: "0.875rem",
  };
  const cardStyle = {
    background: "oklch(16% 0.04 220)",
    border: "1px solid oklch(24% 0.04 220)",
    borderRadius: "1.25rem",
    padding: "1.75rem",
  };

  return (
    <DashboardShell title="Profile Settings" activeTab="profile">
      <div style={{ maxWidth: "640px" }} className="space-y-5">

        {/* Profile Header */}
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, oklch(18% 0.08 162 / 0.6), oklch(18% 0.06 220))" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(72% 0.18 162)", color: "oklch(12% 0.03 220)" }}>
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "white", fontFamily: "'Space Grotesk', sans-serif" }}>
                {user?.name || "User"}
              </h2>
              <p style={{ color: "oklch(65% 0.03 220)", fontSize: "0.875rem" }}>{user?.email}</p>
              {(user as any)?.plan && (user as any).plan !== "free" && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                  style={{ background: "oklch(72% 0.18 162 / 0.2)", color: "oklch(72% 0.18 162)", border: "1px solid oklch(72% 0.18 162 / 0.4)" }}>
                  {(user as any).plan} plan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div style={cardStyle}>
          <h3 className="text-base font-bold mb-5" style={{ color: "oklch(85% 0.04 220)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Personal Information
          </h3>
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label style={labelStyle}>
                <User className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(72% 0.18 162 / 0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(30% 0.05 220)")}
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label style={labelStyle}>
                <Mail className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                style={{ ...inputStyle, background: "oklch(15% 0.03 220)", color: "oklch(50% 0.03 220)", cursor: "not-allowed" }}
              />
              <p style={{ color: "oklch(45% 0.03 220)", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>
                <Phone className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+95 9 xxx xxx xxx"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(72% 0.18 162 / 0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(30% 0.05 220)")}
              />
            </div>

            {/* Business Name */}
            <div>
              <label style={labelStyle}>
                <Building2 className="w-4 h-4" style={{ color: "oklch(72% 0.18 162)" }} />
                Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Your business name"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "oklch(72% 0.18 162 / 0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(30% 0.05 220)")}
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                style={{
                  background: saved ? "oklch(55% 0.18 162)" : "oklch(72% 0.18 162)",
                  color: "oklch(12% 0.03 220)",
                  opacity: updateProfile.isPending ? 0.7 : 1,
                  cursor: updateProfile.isPending ? "not-allowed" : "pointer",
                }}>
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {updateProfile.isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div style={cardStyle}>
          <h3 className="text-base font-bold mb-5" style={{ color: "oklch(85% 0.04 220)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Account Information
          </h3>
          <div className="space-y-0">
            {[
              { label: "Account Status", value: (user as any)?.status || "Active", valueColor: "oklch(72% 0.18 162)" },
              { label: "Current Plan", value: (user as any)?.plan || "Free", valueColor: "white" },
              { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently", valueColor: "white" },
            ].map((row, i, arr) => (
              <div key={row.label}
                className="flex justify-between items-center py-3"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid oklch(24% 0.04 220)" : "none" }}>
                <span style={{ color: "oklch(60% 0.03 220)", fontSize: "0.875rem" }}>{row.label}</span>
                <span className="font-semibold text-sm capitalize" style={{ color: row.valueColor }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Information */}
        {((user as any)?.subscriptionStart || (user as any)?.subscriptionEnd) && (
          <div style={cardStyle}>
            <h3 className="text-base font-bold mb-5" style={{ color: "oklch(85% 0.04 220)", fontFamily: "'Space Grotesk', sans-serif" }}>
              Subscription
            </h3>
            <div className="space-y-0">
              {[
                { label: "Subscription Start", value: (user as any)?.subscriptionStart ? new Date((user as any).subscriptionStart).toLocaleDateString() : "—" },
                { label: "Subscription End", value: (user as any)?.subscriptionEnd ? new Date((user as any).subscriptionEnd).toLocaleDateString() : "—" },
              ].map((row, i, arr) => (
                <div key={row.label}
                  className="flex justify-between items-center py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid oklch(24% 0.04 220)" : "none" }}>
                  <span style={{ color: "oklch(60% 0.03 220)", fontSize: "0.875rem" }}>{row.label}</span>
                  <span className="font-semibold text-sm" style={{ color: "white" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
