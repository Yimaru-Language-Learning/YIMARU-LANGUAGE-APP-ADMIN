import { notifyApiError } from "../lib/apiErrors"
import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Globe,
  Lock,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
  CreditCard,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { SpinnerIcon } from "../components/ui/spinner-icon";
import { changeTeamMemberPassword } from "../api/team.api";
import { logoutToLogin } from "../lib/auth";
import { getMyProfile } from "../api/users.api";
import type { TeamMeProfile } from "../types/team.types";
import { toast } from "sonner";
import { AppVersionsTab } from "./settings/AppVersionsTab";
import { SubscriptionPlansTab } from "./settings/SubscriptionPlansTab";
import { ThemeModePreview } from "./settings/components/ThemeModePreview";
import { useTheme } from "../contexts/ThemeContext";
import { RolesListPage } from "./role-management/RolesListPage";
import { useSearchParams } from "react-router-dom";

type SettingsTab =
  | "subscription"
  | "app-versions"
  | "security"
  | "appearance";

const SETTINGS_TABS: SettingsTab[] = [
  "subscription",
  "app-versions",
  "security",
  "appearance",
]

function isSettingsTab(value: string | null): value is SettingsTab {
  return value != null && (SETTINGS_TABS as string[]).includes(value)
}

const tabs: { id: SettingsTab; label: string; icon: typeof Shield }[] = [
  { id: "subscription", label: "Subscription packages", icon: CreditCard },
  { id: "app-versions", label: "App versions", icon: Smartphone },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

function SecurityTab({ memberId }: { memberId: number }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      await changeTeamMemberPassword(memberId, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      logoutToLogin({ passwordChanged: true });
      return;
    } catch (e: unknown) {
      notifyApiError(e, "Failed to update password.");
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
                className="rounded-[6px] pr-10"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={saving}
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
                  className="rounded-[6px] pr-10"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={saving}
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
                  className="rounded-[6px] pr-10"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={saving}
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

      <RolesListPage embedded />
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
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

  const options = [
    {
      id: "light" as const,
      label: "Light",
      description: "Always bright UI",
      icon: Sun,
      preview: "light" as const,
    },
    {
      id: "dark" as const,
      label: "Dark",
      description: "Always dark UI",
      icon: Moon,
      preview: "dark" as const,
    },
    {
      id: "system" as const,
      label: "System",
      description: `Follows device (${systemTheme})`,
      icon: Globe,
      preview: "system" as const,
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="overflow-hidden rounded-[6px] border border-grayScale-200">
        <div className="h-1 w-full bg-brand-400" />
        <CardHeader className="border-b border-grayScale-200 pb-3">
          <CardTitle className="text-sm font-bold text-grayScale-600">Theme</CardTitle>
          <p className="text-xs text-grayScale-400">
            Active appearance:{" "}
            <span className="font-semibold capitalize text-grayScale-600">{resolvedTheme}</span>
            {theme === "system" ? " (from your device setting)" : null}
            {theme === "light" ? " (fixed — not tied to device)" : null}
          </p>
        </CardHeader>
        <CardContent className="pb-6 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {options.map(({ id, label, description, icon: Icon, preview }) => {
              const selected = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    "flex flex-col items-stretch gap-3 rounded-[6px] border-2 p-3 text-left transition-all",
                    selected
                      ? "border-brand-500 bg-brand-500/10 shadow-sm ring-1 ring-brand-500/30"
                      : "border-grayScale-200 bg-grayScale-50 hover:border-grayScale-300 hover:bg-grayScale-100",
                  )}
                >
                  <ThemeModePreview
                    variant={preview}
                    systemResolved={systemTheme}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px]",
                        selected
                          ? "bg-brand-500 text-white"
                          : "bg-grayScale-100 text-grayScale-500",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          selected ? "text-grayScale-600" : "text-grayScale-500",
                        )}
                      >
                        {label}
                      </p>
                      <p className="text-[11px] text-grayScale-400">{description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 rounded-[6px] border border-dashed border-grayScale-200 bg-grayScale-100 px-3 py-2 text-[11px] leading-relaxed text-grayScale-500">
            <strong className="font-semibold text-grayScale-600">Light vs System:</strong> Light
            always stays bright. System copies your Windows/macOS theme — if your device is in
            light mode, System will match Light; switch your device to dark to see System use the
            dark admin theme.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<SettingsTab>(() =>
    isSettingsTab(tabFromUrl) ? tabFromUrl : "subscription",
  );
  const [profile, setProfile] = useState<TeamMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSettingsTab(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  const selectTab = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams(tab === "subscription" ? {} : { tab }, { replace: true });
  };

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

      <div className="space-y-6">
        <nav className="flex gap-1 overflow-x-auto border-b border-grayScale-100 pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-grayScale-500 hover:border-grayScale-200 hover:text-grayScale-700",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="min-h-[400px] min-w-0 w-full">
          {activeTab === "subscription" && <SubscriptionPlansTab />}
          {activeTab === "app-versions" && <AppVersionsTab />}
          {activeTab === "security" && <SecurityTab memberId={profile.id} />}
          {activeTab === "appearance" && <AppearanceTab />}
        </main>
      </div>
    </div>
  );
}
