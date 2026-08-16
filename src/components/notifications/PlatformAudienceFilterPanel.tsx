import { useEffect, useMemo, useState, type ReactNode } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown } from "lucide-react"
import { AdminFiltersPanel } from "../filters/AdminFiltersPanel"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import { APP_TIMEZONE_LABEL } from "../../lib/datetime"
import {
  EMPTY_PLATFORM_AUDIENCE_FILTERS,
  countPlatformAudienceActiveFilters,
  type PlatformAudienceFilters,
} from "../../lib/platformAudienceFilters"
import { USER_FILTER_COUNTRIES, USER_FILTER_ETHIOPIA_REGIONS } from "../../data/userFilterLocations"
import {
  PROFILE_FILTER_AGE_GROUPS,
  PROFILE_FILTER_EDUCATION_LEVELS,
  PROFILE_FILTER_FAVOURITE_TOPICS,
  PROFILE_FILTER_KNOWLEDGE_LEVELS,
  PROFILE_FILTER_LANGUAGE_GOALS,
  PROFILE_FILTER_LEARNING_GOALS,
  PROFILE_FILTER_OCCUPATIONS,
} from "../../lib/userProfileFieldDisplay"
import { getSubscriptionPlans } from "../../api/subscription-plans.api"
import type { SubscriptionPlan } from "../../types/subscription.types"

type CodeLabelOption = { code: string; label: string }

function FilterDropdown({
  id,
  label,
  value,
  allLabel,
  options,
  onSelect,
  disabled = false,
}: {
  id: string
  label: string
  value: string
  allLabel: string
  options: readonly (string | CodeLabelOption)[]
  onSelect: (next: string) => void
  disabled?: boolean
}) {
  const displayValue = useMemo(() => {
    if (!value) return allLabel
    const match = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.code === value,
    )
    if (typeof match === "string") return match
    if (match) return match.label
    return value
  }, [allLabel, options, value])

  return (
    <div className={cn("flex flex-col gap-1", disabled && "opacity-60")}>
      <label htmlFor={id} className="text-xs font-medium text-grayScale-500">
        {label}
      </label>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-2 rounded-[6px] border border-grayScale-200 bg-white px-3 text-left text-sm text-grayScale-600",
              "outline-none focus-visible:ring-1 focus-visible:ring-brand-500",
              disabled && "cursor-not-allowed bg-grayScale-50 text-grayScale-400",
            )}
          >
            <span className="min-w-0 truncate">{displayValue}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-grayScale-400" />
          </button>
        </DropdownMenu.Trigger>
        {!disabled ? (
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side="bottom"
              align="start"
              sideOffset={4}
              collisionPadding={12}
              className="z-[200] max-h-60 min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-md border border-grayScale-200 bg-white p-1 shadow-lg"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenu.Item
                className={cn(
                  "cursor-pointer rounded px-2 py-2 text-sm text-grayScale-700 outline-none data-[highlighted]:bg-grayScale-100",
                  !value && "bg-grayScale-50 font-medium",
                )}
                onSelect={() => onSelect("")}
              >
                {allLabel}
              </DropdownMenu.Item>
              {options.map((opt) => {
                const code = typeof opt === "string" ? opt : opt.code
                const text = typeof opt === "string" ? opt : opt.label
                return (
                  <DropdownMenu.Item
                    key={code}
                    className={cn(
                      "cursor-pointer rounded px-2 py-2 text-sm text-grayScale-700 outline-none data-[highlighted]:bg-grayScale-100",
                      value === code && "bg-brand-50 font-medium text-brand-700",
                    )}
                    onSelect={() => onSelect(code)}
                  >
                    {text}
                  </DropdownMenu.Item>
                )
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        ) : null}
      </DropdownMenu.Root>
    </div>
  )
}

function FilterSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-3 rounded-lg border border-grayScale-100 bg-grayScale-50/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-grayScale-500">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

function DisabledFilterHint({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex flex-col gap-1 opacity-60">
      <span className="text-xs font-medium text-grayScale-500">{label}</span>
      <div
        className="flex h-9 items-center rounded-[6px] border border-dashed border-grayScale-200 bg-grayScale-50 px-3 text-xs text-grayScale-400"
        title={reason}
      >
        Coming soon
      </div>
    </div>
  )
}

const SUBSCRIPTION_STATUS_OPTIONS = [
  { code: "ACTIVE", label: "Active" },
  {
    code: "Unsubscribed",
    label: "Unsubscribed (pending, expired, or never subscribed)",
  },
]

const PLAN_CATEGORY_OPTIONS = [
  { code: "LEARN_ENGLISH", label: "Learn English" },
  { code: "IELTS", label: "IELTS" },
  { code: "DUOLINGO", label: "Duolingo" },
]

const BOOL_OPTIONS = [
  { code: "true", label: "Yes" },
  { code: "false", label: "No" },
]

const DEVICE_PLATFORM_OPTIONS = [
  { code: "ios", label: "iOS" },
  { code: "android", label: "Android" },
  { code: "web", label: "Web" },
]

export type PlatformAudienceFilterPanelProps = {
  filters: PlatformAudienceFilters
  onChange: (next: PlatformAudienceFilters) => void
}

export function PlatformAudienceFilterPanel({
  filters,
  onChange,
}: PlatformAudienceFilterPanelProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const activeCount = countPlatformAudienceActiveFilters(filters)
  const ethiopiaSelected =
    !filters.country.trim() || filters.country.trim().toLowerCase() === "ethiopia"

  useEffect(() => {
    let cancelled = false
    getSubscriptionPlans()
      .then((res) => {
        if (!cancelled) {
          setPlans(res.data ?? [])
        }
      })
      .catch(() => {
        if (!cancelled) setPlans([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const planOptions = useMemo(
    () => plans.map((plan) => ({ code: String(plan.id), label: plan.name })),
    [plans],
  )

  const patch = (partial: Partial<PlatformAudienceFilters>) => {
    onChange({ ...filters, ...partial })
  }

  return (
    <AdminFiltersPanel
      defaultOpen={activeCount > 0}
      activeFilterCount={activeCount}
      onClearFilters={() => onChange({ ...EMPTY_PLATFORM_AUDIENCE_FILTERS })}
      clearLabel="Clear targeting"
      summary={
        activeCount > 0 ? (
          <p className="text-[11px] text-grayScale-500">
            {activeCount} targeting filter{activeCount === 1 ? "" : "s"} applied — list shows matching users only.
          </p>
        ) : (
          <p className="text-[11px] text-grayScale-400">
            Narrow the audience before selecting recipients. Leave filters empty to browse all platform users.
          </p>
        )
      }
    >
      <div className="space-y-4">
        <FilterSection title="User">
          <FilterDropdown
            id="audience-country"
            label="Country"
            value={filters.country}
            allLabel="Any country"
            options={USER_FILTER_COUNTRIES}
            onSelect={(country) => patch({ country, region: "" })}
          />
          <FilterDropdown
            id="audience-region"
            label="Region"
            value={filters.region}
            allLabel="Any region"
            options={USER_FILTER_ETHIOPIA_REGIONS}
            onSelect={(region) => patch({ region })}
            disabled={!ethiopiaSelected}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-created-after" className="text-xs font-medium text-grayScale-500">
              Joined after ({APP_TIMEZONE_LABEL})
            </label>
            <Input
              id="audience-created-after"
              type="datetime-local"
              value={filters.createdAfterLocal}
              onChange={(e) => patch({ createdAfterLocal: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-created-before" className="text-xs font-medium text-grayScale-500">
              Joined before ({APP_TIMEZONE_LABEL})
            </label>
            <Input
              id="audience-created-before"
              type="datetime-local"
              value={filters.createdBeforeLocal}
              onChange={(e) => patch({ createdBeforeLocal: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </FilterSection>

        <FilterSection title="Profile">
          <FilterDropdown
            id="audience-education"
            label="Education level"
            value={filters.educationLevel}
            allLabel="Any level"
            options={PROFILE_FILTER_EDUCATION_LEVELS}
            onSelect={(educationLevel) => patch({ educationLevel })}
          />
          <FilterDropdown
            id="audience-occupation"
            label="Occupation"
            value={filters.occupation}
            allLabel="Any occupation"
            options={PROFILE_FILTER_OCCUPATIONS}
            onSelect={(occupation) => patch({ occupation })}
          />
          <FilterDropdown
            id="audience-age-group"
            label="Age group"
            value={filters.ageGroup}
            allLabel="Any age group"
            options={PROFILE_FILTER_AGE_GROUPS}
            onSelect={(ageGroup) => patch({ ageGroup })}
          />
          <FilterDropdown
            id="audience-topic"
            label="Favorite topic"
            value={filters.favouriteTopic}
            allLabel="Any topic"
            options={PROFILE_FILTER_FAVOURITE_TOPICS}
            onSelect={(favouriteTopic) => patch({ favouriteTopic })}
          />
          <FilterDropdown
            id="audience-language-goal"
            label="Language goal"
            value={filters.languageGoal}
            allLabel="Any language goal"
            options={PROFILE_FILTER_LANGUAGE_GOALS}
            onSelect={(languageGoal) => patch({ languageGoal })}
          />
          <FilterDropdown
            id="audience-learning-goal"
            label="Learning goal"
            value={filters.learningGoal}
            allLabel="Any learning goal"
            options={PROFILE_FILTER_LEARNING_GOALS}
            onSelect={(learningGoal) => patch({ learningGoal })}
          />
          <FilterDropdown
            id="audience-knowledge-level"
            label="Proficiency level"
            value={filters.knowledgeLevel}
            allLabel="Any proficiency"
            options={PROFILE_FILTER_KNOWLEDGE_LEVELS}
            onSelect={(knowledgeLevel) => patch({ knowledgeLevel })}
          />
        </FilterSection>

        <FilterSection title="Subscription">
          <FilterDropdown
            id="audience-subscription-status"
            label="Subscription status"
            value={filters.subscriptionStatus}
            allLabel="Any status"
            options={SUBSCRIPTION_STATUS_OPTIONS}
            onSelect={(subscriptionStatus) => patch({ subscriptionStatus })}
          />
          <FilterDropdown
            id="audience-plan"
            label="Plan tier"
            value={filters.planId}
            allLabel="Any plan"
            options={planOptions}
            onSelect={(planId) => patch({ planId })}
          />
          <FilterDropdown
            id="audience-plan-category"
            label="Plan category"
            value={filters.planCategory}
            allLabel="Any category"
            options={PLAN_CATEGORY_OPTIONS}
            onSelect={(planCategory) => patch({ planCategory })}
          />
          <FilterDropdown
            id="audience-auto-renew"
            label="Auto-renew"
            value={filters.autoRenew}
            allLabel="Any"
            options={BOOL_OPTIONS}
            onSelect={(autoRenew) => patch({ autoRenew })}
          />
          <FilterDropdown
            id="audience-has-ever-paid"
            label="Past payer vs never paid"
            value={filters.hasEverPaid}
            allLabel="Any"
            options={[
              { code: "true", label: "Past payer" },
              { code: "false", label: "Never paid" },
            ]}
            onSelect={(hasEverPaid) => patch({ hasEverPaid })}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-expires-within" className="text-xs font-medium text-grayScale-500">
              Expires within (days)
            </label>
            <Input
              id="audience-expires-within"
              type="number"
              min={0}
              placeholder="e.g. 7"
              value={filters.expiresWithinDays}
              onChange={(e) => patch({ expiresWithinDays: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <DisabledFilterHint label="In trial / trial ending soon" reason="Trial state is not tracked per user yet." />
        </FilterSection>

        <FilterSection title="Engagement / activity">
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-inactive-min" className="text-xs font-medium text-grayScale-500">
              Inactive at least (days since login)
            </label>
            <Input
              id="audience-inactive-min"
              type="number"
              min={0}
              placeholder="e.g. 30"
              value={filters.daysSinceLastLoginMin}
              onChange={(e) => patch({ daysSinceLastLoginMin: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-active-within" className="text-xs font-medium text-grayScale-500">
              Active within (days since login)
            </label>
            <Input
              id="audience-active-within"
              type="number"
              min={0}
              placeholder="e.g. 7"
              value={filters.daysSinceLastLoginMax}
              onChange={(e) => patch({ daysSinceLastLoginMax: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <FilterDropdown
            id="audience-profile-completed"
            label="Onboarding / profile"
            value={filters.profileCompleted}
            allLabel="Any"
            options={[
              { code: "true", label: "Profile completed" },
              { code: "false", label: "Profile incomplete" },
            ]}
            onSelect={(profileCompleted) => patch({ profileCompleted })}
          />
          <FilterDropdown
            id="audience-assessment"
            label="Initial assessment"
            value={filters.initialAssessmentCompleted}
            allLabel="Any"
            options={[
              { code: "true", label: "Completed" },
              { code: "false", label: "Not completed" },
            ]}
            onSelect={(initialAssessmentCompleted) => patch({ initialAssessmentCompleted })}
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-min-lessons" className="text-xs font-medium text-grayScale-500">
              Min lessons completed
            </label>
            <Input
              id="audience-min-lessons"
              type="number"
              min={0}
              value={filters.minLessonsCompleted}
              onChange={(e) => patch({ minLessonsCompleted: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-min-modules" className="text-xs font-medium text-grayScale-500">
              Min modules completed
            </label>
            <Input
              id="audience-min-modules"
              type="number"
              min={0}
              value={filters.minModulesCompleted}
              onChange={(e) => patch({ minModulesCompleted: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="audience-min-profile-pct" className="text-xs font-medium text-grayScale-500">
              Min profile completion %
            </label>
            <Input
              id="audience-min-profile-pct"
              type="number"
              min={0}
              max={100}
              value={filters.minProfileCompletionPct}
              onChange={(e) => patch({ minProfileCompletionPct: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <DisabledFilterHint label="Streak status" reason="Daily streak data is not stored yet." />
          <DisabledFilterHint label="Overall LMS progress %" reason="Use min lessons/modules for now; LMS rollup filter is planned." />
        </FilterSection>

        <FilterSection title="Technical / deliverability">
          <FilterDropdown
            id="audience-device-platform"
            label="Platform"
            value={filters.devicePlatform}
            allLabel="Any platform"
            options={DEVICE_PLATFORM_OPTIONS}
            onSelect={(devicePlatform) => patch({ devicePlatform })}
          />
          <FilterDropdown
            id="audience-has-device"
            label="Registered push device"
            value={filters.hasActiveDevice}
            allLabel="Any"
            options={[
              { code: "true", label: "Has active device token" },
              { code: "false", label: "No active device token" },
            ]}
            onSelect={(hasActiveDevice) => patch({ hasActiveDevice })}
          />
          <DisabledFilterHint label="Push permission" reason="OS push permission state is not stored yet." />
          <DisabledFilterHint label="Time zone" reason="User time zone is not stored yet." />
          <DisabledFilterHint label="App version" reason="App version is not stored on user records yet." />
        </FilterSection>
      </div>
    </AdminFiltersPanel>
  )
}
