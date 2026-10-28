import http from "./http"
import type { AutomationConfig } from "../types/automation.types"
const endpoint = "/admin/notification-automations"
export const getAutomations = async (): Promise<AutomationConfig> => (await http.get<{ data: AutomationConfig }>(endpoint)).data.data
export const saveAutomations = async (config: AutomationConfig): Promise<AutomationConfig> => (await http.put<{ data: AutomationConfig }>(endpoint, config)).data.data
