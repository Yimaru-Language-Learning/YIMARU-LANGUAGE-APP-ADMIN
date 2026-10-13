import type { AutomationConfig } from "../types/automation.types"

export const automationLabel = (kind: string) => kind === "payment_recovery" ? "Subscription recovery" : "Inactivity"
export function validateAutomationConfig(config: AutomationConfig): string | null {
  if (config.rules.length !== 2 || new Set(config.rules.map((r) => r.kind)).size !== 2) return "Two distinct reminder rules are required."
  for (const rule of config.rules) {
    if (!["payment_recovery", "inactivity"].includes(rule.kind)) return "Unknown automation."
    if (!rule.channels.length || new Set(rule.channels).size !== rule.channels.length || rule.channels.some((ch) => ch !== "push" && ch !== "email")) return "Select email, push, or both."
    if (rule.steps.length !== 3) return "Exactly three steps are required."
    let previous = 0
    for (const step of rule.steps) {
      if (!Number.isInteger(step.delay_minutes) || step.delay_minutes <= previous || step.delay_minutes > 43200) return "Delays must increase and be within 30 days."
      previous = step.delay_minutes
      if (!step.title.trim() || !step.message.trim() || Array.from(step.title).length > 120 || Array.from(step.message).length > 500) return "Each step needs a title (up to 120 characters) and message (up to 500)."
    }
  }
  return null
}
