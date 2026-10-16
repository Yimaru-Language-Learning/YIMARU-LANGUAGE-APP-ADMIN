import type { AutomationConfig } from "../types/automation.types"

const automationLabels: Record<string, string> = { payment_recovery: "Subscription recovery", inactivity: "Inactivity", new_course: "New course published" }
export const automationLabel = (kind: string) => automationLabels[kind] ?? "Unknown automation"
export function validateAutomationConfig(config: AutomationConfig): string | null {
  if (config.rules.length !== 3 || new Set(config.rules.map((r) => r.kind)).size !== 3) return "Subscription recovery, inactivity, and new-course rules are required."
  for (const rule of config.rules) {
    if (!["payment_recovery", "inactivity", "new_course"].includes(rule.kind)) return "Unknown automation."
    if (!rule.channels.length || new Set(rule.channels).size !== rule.channels.length || rule.channels.some((ch) => ch !== "push" && ch !== "email")) return "Select email, push, or both."
    const newCourse = rule.kind === "new_course"
    if (rule.steps.length !== (newCourse ? 1 : 3)) return "New courses need one announcement; other rules need three steps."
    let previous = newCourse ? -1 : 0
    for (const step of rule.steps) {
      if (!Number.isInteger(step.delay_minutes) || step.delay_minutes <= previous || step.delay_minutes > 43200) return "Delays must increase and be within 30 days."
      previous = step.delay_minutes
      if (!step.title.trim() || !step.message.trim() || Array.from(step.title).length > 120 || Array.from(step.message).length > 500) return "Each step needs a title (up to 120 characters) and message (up to 500)."
    }
  }
  return null
}
