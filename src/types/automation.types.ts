export type AutomationKind = "payment_recovery" | "inactivity" | "new_course"
export type AutomationChannel = "email" | "push"
export interface AutomationStep { delay_minutes: number; title: string; message: string }
export interface AutomationRule {
  kind: AutomationKind
  enabled: boolean
  channels: AutomationChannel[]
  steps: AutomationStep[]
  enabled_at: string
  epoch: string
  created_by: number
}
export interface AutomationConfig { version: number; rules: AutomationRule[] }
export interface AutomationJobMeta { kind: AutomationKind; step: number; due_at: string; reason?: string }
