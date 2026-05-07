import React, { useEffect, useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Languages,
  Lock,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  User,
  CreditCard,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { SpinnerIcon } from "../components/ui/spinner-icon";
import { getMyProfile, updateProfile } from "../api/users.api";
import type { UserProfileData } from "../types/user.types";
import { toast } from "sonner";

type SettingsTab =
  | "subscription"
  | "profile"
  | "security"
  | "notifications"
  | "appearance";

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "subscription", label: "Subscription", icon: CreditCard },
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
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none",
        enabled ? "bg-brand-500" : "bg-grayScale-200",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-5" : "translate-x-0.5",
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
  icon: any;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[6px] px-3 py-4 transition-colors hover:bg-grayScale-100/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-grayScale-100 text-grayScale-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-grayScale-800">{title}</p>
          <p className="mt-0.5 text-xs text-grayScale-500">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// --- Subscription Tab ---

function SubscriptionTab() {
  const [subs, setSubs] = useState([
    {
      id: "auto_renew",
      name: "Auto-renewal",
      desc: "Automatically renew your subscription when it expires",
      enabled: true,
    },
    {
      id: "marketing_emails",
      name: "Marketing Emails",
      desc: "Receive updates about new features and promotions",
      enabled: true,
    },
    {
      id: "priority_support",
      name: "Priority Support",
      desc: "Access 24/7 priority customer support",
      enabled: true,
    },
  ]);

  const [pendingToggle, setPendingToggle] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = (id: string) => {
    const item = subs.find((s) => s.id === id);
    if (item?.enabled) {
      setPendingToggle(id);
      setShowWarning(true);
    } else {
      setSubs((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: true } : s)),
      );
    }
  };

  const confirmToggleOff = () => {
    if (pendingToggle) {
      setSubs((prev) =>
        prev.map((s) =>
          s.id === pendingToggle ? { ...s, enabled: false } : s,
        ),
      );
      setShowWarning(false);
      setPendingToggle(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border border-grayScale-100 rounded-[6px] overflow-hidden">
        <CardHeader className="pb-3 border-b border-grayScale-50">
          <CardTitle className="text-sm font-bold text-grayScale-900">
            Subscription Features
          </CardTitle>
          <p className="text-[11px] text-grayScale-500">
            Customize your subscription experience and management preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {subs.map((sub, idx) => (
            <React.Fragment key={sub.id}>
              <div
                className={cn(
                  "px-2",
                  idx < subs.length - 1 && "border-b border-grayScale-50",
                )}
              >
                <SettingRow
                  icon={CreditCard}
                  title={sub.name}
                  description={sub.desc}
                >
                  <Toggle
                    enabled={sub.enabled}
                    onToggle={() => handleToggle(sub.id)}
                  />
                </SettingRow>
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-grayScale-100 rounded-[12px] shadow-2xl">
          <div className="relative p-8">
            <div className="flex items-start gap-5 mb-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 border border-red-100">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-bold text-grayScale-900 tracking-tight">
                  Are you absolutely sure?
                </h3>
                <p className="text-sm text-grayScale-500 mt-1">
                  Disabling this feature might limit your experience.
                </p>
              </div>
            </div>

            <div className="bg-grayScale-50/80 border border-grayScale-100 p-5 rounded-[8px] mb-8">
              <p className="text-sm text-grayScale-600 leading-relaxed font-medium">
                By turning this off, you will no longer receive the benefits
                associated with this feature. Some changes might take up to 24
                hours to reflect.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="destructive"
                onClick={confirmToggleOff}
                className="w-full rounded-[8px] py-6 text-sm font-bold bg-red-500 hover:bg-red-600 text-white border-none shadow-sm transition-all active:scale-[0.98]"
              >
                Yes, Disable Feature
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWarning(false)}
                className="w-full rounded-[8px] py-6 text-sm font-bold border-grayScale-200 text-grayScale-600 hover:bg-grayScale-50 transition-all active:scale-[0.98]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Other Tabs (Existing, but with sidebar layout updates) ---

function ProfileTab({ profile }: { profile: UserProfileData }) {
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [nickName, setNickName] = useState(profile.nick_name || "");
  const [language, setLanguage] = useState(profile.preferred_language || "en");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        nick_name: nickName,
        preferred_language: language,
      });
      toast.success("Profile settings saved");
    } catch {
      toast.error("Failed to save profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border border-grayScale-100 rounded-[6px] overflow-hidden">
        <div className="h-1 w-full bg-brand-500" />
        <CardHeader className="pb-3 border-b border-grayScale-50">
          <CardTitle className="text-sm font-bold text-grayScale-900">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                First Name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded-[6px]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Last Name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded-[6px]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
              Nickname
            </label>
            <Input
              value={nickName}
              onChange={(e) => setNickName(e.target.value)}
              className="rounded-[6px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-grayScale-100 rounded-[6px] overflow-hidden">
        <div className="h-1 w-full bg-brand-400" />
        <CardHeader className="pb-3 border-b border-grayScale-50">
          <CardTitle className="text-sm font-bold text-grayScale-900">
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Preferred Language
              </label>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-[6px]"
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
                <option value="or">Afan Oromo</option>
                <option value="ti">Tigrinya</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[140px] rounded-[6px] font-bold"
        >
          {saving ? (
            <SpinnerIcon className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border border-grayScale-100 rounded-[6px] overflow-hidden">
        <div className="h-1 w-full bg-brand-600" />
        <CardHeader className="pb-3 border-b border-grayScale-50">
          <CardTitle className="text-sm font-bold text-grayScale-900">
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                className="rounded-[6px]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  className="rounded-[6px]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="rounded-[6px]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-grayScale-400 hover:text-grayScale-600"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={saving}
              className="min-w-[160px] rounded-[6px] font-bold"
            >
              {saving ? (
                <SpinnerIcon className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  return (
    <Card className="border border-grayScale-100 rounded-[6px] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-1 w-full bg-brand-500" />
      <CardHeader className="pb-3 border-b border-grayScale-50">
        <CardTitle className="text-sm font-bold text-grayScale-900">
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pb-6">
        <SettingRow
          icon={Bell}
          title="Email Notifications"
          description="Receive important updates via email"
        >
          <Toggle
            enabled={emailNotifs}
            onToggle={() => setEmailNotifs(!emailNotifs)}
          />
        </SettingRow>
        <Separator className="bg-grayScale-50" />
        <SettingRow
          icon={Bell}
          title="Push Notifications"
          description="Get notified in the browser"
        >
          <Toggle
            enabled={pushNotifs}
            onToggle={() => setPushNotifs(!pushNotifs)}
          />
        </SettingRow>
        <Separator className="bg-grayScale-50" />
        <SettingRow
          icon={Shield}
          title="Login Alerts"
          description="Get notified when someone logs into your account"
        >
          <Toggle
            enabled={loginAlerts}
            onToggle={() => setLoginAlerts(!loginAlerts)}
          />
        </SettingRow>
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <Card className="border border-grayScale-100 rounded-[6px] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-1 w-full bg-brand-400" />
      <CardHeader className="pb-3 border-b border-grayScale-50">
        <CardTitle className="text-sm font-bold text-grayScale-900">
          Theme
        </CardTitle>
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
                "flex flex-col items-center gap-2.5 rounded-[6px] border-2 px-4 py-5 transition-all",
                theme === id
                  ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm"
                  : "border-grayScale-100 bg-white text-grayScale-400 hover:border-grayScale-200 hover:bg-grayScale-50",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[6px]",
                  theme === id
                    ? "bg-brand-500 text-white"
                    : "bg-grayScale-100 text-grayScale-400",
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("subscription");
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

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <SpinnerIcon className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Card className="border-dashed border-grayScale-200 rounded-[6px]">
          <CardContent className="flex flex-col items-center gap-5 p-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grayScale-100">
              <User className="h-10 w-10 text-grayScale-300" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold tracking-tight text-grayScale-900">
                {error || "Settings not available"}
              </p>
              <p className="mt-1 text-sm text-grayScale-500">
                Please check your connection and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-10 ">
        <h1 className="text-2xl font-black tracking-tight text-grayScale-700">
          Settings
        </h1>
        <p className="mt-2 text-sm text-grayScale-500 ">
          Manage your account preferences, subscriptions, and system
          configurations with ease
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Content Area */}
        <main className="min-h-[400px]">
          {activeTab === "subscription" && <SubscriptionTab />}
        </main>
      </div>
    </div>
  );
}
