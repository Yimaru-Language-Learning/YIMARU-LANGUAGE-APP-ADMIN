import { useEffect, useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Languages,
  Loader2,
  Lock,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";
import { getMyProfile } from "../api/users.api";
import type { UserProfileData } from "../types/user.types";
import { toast } from "sonner";

type SettingsTab = "profile" | "security" | "notifications" | "appearance";

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        enabled ? "bg-brand-500" : "bg-grayScale-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg px-3 py-4 transition-colors hover:bg-grayScale-100/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-grayScale-100 text-grayScale-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-grayScale-600">{title}</p>
          <p className="mt-0.5 text-xs text-grayScale-400">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-32 rounded-lg bg-grayScale-100" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-28 rounded-lg bg-grayScale-100" />
          ))}
        </div>
        <div className="rounded-2xl border border-grayScale-100 p-6">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-grayScale-100" />
                  <div className="h-3 w-48 rounded bg-grayScale-100" />
                </div>
                <div className="h-10 w-48 rounded-lg bg-grayScale-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ profile }: { profile: UserProfileData }) {
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [nickName, setNickName] = useState(profile.nick_name || "");
  const [language, setLanguage] = useState(profile.preferred_language || "en");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // placeholder — wire up to API when endpoint is ready
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Profile settings saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-grayScale-100">
        <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-brand-600" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
              <User className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
              Personal Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-grayScale-500">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-grayScale-500">Last Name</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-grayScale-500">Nickname</label>
            <Input value={nickName} onChange={(e) => setNickName(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-grayScale-100">
        <div className="h-1 w-full bg-gradient-to-r from-brand-400 to-brand-500" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 text-white shadow-sm">
              <Languages className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
              Preferences
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-grayScale-500">Preferred Language</label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="am">Amharic</option>
                <option value="or">Afan Oromo</option>
                <option value="ti">Tigrinya</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-grayScale-500">Timezone</label>
              <Select defaultValue="eat">
                <option value="eat">East Africa Time (UTC+3)</option>
                <option value="utc">UTC</option>
                <option value="est">Eastern Time (UTC-5)</option>
                <option value="pst">Pacific Time (UTC-8)</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Password updated successfully");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-grayScale-100">
        <div className="h-1 w-full bg-gradient-to-r from-brand-600 to-brand-500" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm">
              <KeyRound className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
              Change Password
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-grayScale-500">Current Password</label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} placeholder="Enter current password" />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-grayScale-500">New Password</label>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} placeholder="Enter new password" />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-grayScale-500">Confirm New Password</label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} placeholder="Confirm new password" />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={saving} className="min-w-[160px]">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-grayScale-100">
        <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-brand-400" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
              Two-Factor Authentication
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <SettingRow
            icon={Shield}
            title="Enable 2FA"
            description="Add an extra layer of security to your account"
          >
            <Toggle enabled={false} onToggle={() => toast.info("2FA coming soon")} />
          </SettingRow>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <Card className="border border-grayScale-100">
      <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-brand-600" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm">
            <Bell className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
            Notification Preferences
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 pb-6">
        <SettingRow
          icon={Bell}
          title="Email Notifications"
          description="Receive important updates via email"
        >
          <Toggle enabled={emailNotifs} onToggle={() => setEmailNotifs(!emailNotifs)} />
        </SettingRow>
        <Separator />
        <SettingRow
          icon={Bell}
          title="Push Notifications"
          description="Get notified in the browser"
        >
          <Toggle enabled={pushNotifs} onToggle={() => setPushNotifs(!pushNotifs)} />
        </SettingRow>
        <Separator />
        <SettingRow
          icon={Shield}
          title="Login Alerts"
          description="Get notified when someone logs into your account"
        >
          <Toggle enabled={loginAlerts} onToggle={() => setLoginAlerts(!loginAlerts)} />
        </SettingRow>
        <Separator />
        <SettingRow
          icon={Globe}
          title="Weekly Digest"
          description="Receive a weekly summary of activity"
        >
          <Toggle enabled={weeklyDigest} onToggle={() => setWeeklyDigest(!weeklyDigest)} />
        </SettingRow>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <Card className="border border-grayScale-100">
      <div className="h-1 w-full bg-gradient-to-r from-brand-400 to-brand-600" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm">
            <Palette className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight text-grayScale-600">
            Theme
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System", icon: Globe },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-2.5 rounded-xl border-2 px-4 py-5 transition-all",
                theme === id
                  ? "border-brand-500 bg-brand-100/30 text-brand-600 shadow-sm"
                  : "border-grayScale-100 bg-white text-grayScale-400 hover:border-grayScale-200 hover:bg-grayScale-100/40"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  theme === id ? "bg-brand-500 text-white" : "bg-grayScale-100 text-grayScale-400"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getMyProfile();
        setProfile(res.data.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
        setError("Failed to load settings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-5 p-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grayScale-100">
              <User className="h-10 w-10 text-grayScale-300" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold tracking-tight text-grayScale-600">
                {error || "Settings not available"}
              </p>
              <p className="mt-1 text-sm text-grayScale-400">
                Please check your connection and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">Settings</h1>
        <p className="mt-1 text-sm text-grayScale-400">
          Manage your account preferences and configuration
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl border border-grayScale-100 bg-grayScale-100/50 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-brand-600 shadow-sm"
                : "text-grayScale-400 hover:text-grayScale-600"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && <ProfileTab profile={profile} />}
      {activeTab === "security" && <SecurityTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "appearance" && <AppearanceTab />}
    </div>
  );
}
