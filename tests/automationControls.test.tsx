import assert from "node:assert/strict"
import test from "node:test"
import { isValidElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AutomationControls, type AutomationControlsProps } from "../src/components/notifications/AutomationControls"
import type { AutomationConfig } from "../src/types/automation.types"

function configuration(): AutomationConfig {
  return { version: 3, rules: ["payment_recovery", "inactivity"].map((kind, index) => ({ kind: kind as "payment_recovery" | "inactivity", enabled: false, channels: ["push"], enabled_at: "", epoch: "", created_by: 0, steps: (index ? [4320, 10080, 20160] : [20, 4320, 10080]).map((delay_minutes) => ({ delay_minutes, title: "Reminder", message: "Message" })) })) }
}
function props(update: Partial<AutomationControlsProps> = {}): AutomationControlsProps {
  return { config: configuration(), canEdit: true, canSend: () => true, saving: false, dirty: true, onChange: () => {}, onPreview: () => {}, onSave: () => {}, ...update }
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as ReactNode)]
}

test("read-only controls disable editing and saving", () => {
  const html = renderToStaticMarkup(<AutomationControls {...props({ canEdit: false })} />)
  assert.equal((html.match(/<fieldset disabled=""/g) ?? []).length, 2)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Save settings<\/button>/)
})
test("saving disables every rule and prevents repeat saves", () => {
  const html = renderToStaticMarkup(<AutomationControls {...props({ saving: true })} />)
  assert.equal((html.match(/<fieldset disabled=""/g) ?? []).length, 2)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Saving…<\/button>/)
})
test("unchanged settings cannot be saved", () => {
  assert.match(renderToStaticMarkup(<AutomationControls {...props({ dirty: false })} />), /<button[^>]*disabled=""[^>]*>Save settings<\/button>/)
})
test("channel permissions disable unpermitted channels", () => {
  const tree = elements(AutomationControls(props({ canSend: (channel) => channel === "push" })))
  const checkboxes = tree.filter((element) => element.type === "input")
  assert.equal(checkboxes.length, 6)
  assert.equal(checkboxes[1].props.disabled, false)
  assert.equal(checkboxes[2].props.disabled, true)
})
test("enable, channel, and delay callbacks emit immutable edits for only the selected rule", () => {
  const original = configuration()
  let current = original
  const controls = props({ config: original, onChange: (index, update) => { current = { ...current, rules: current.rules.map((rule, i) => i === index ? update(rule) : rule) } } })
  const tree = elements(AutomationControls(controls))
  const boxes = tree.filter((element) => element.type === "input")
  ;(boxes[0].props.onChange as (event: unknown) => void)({ target: { checked: true } })
  ;(boxes[2].props.onChange as (event: unknown) => void)({ target: { checked: true } })
  const delay = tree.find((element) => element.props.type === "number")!
  ;(delay.props.onChange as (event: unknown) => void)({ target: { value: "30" } })
  assert.equal(original.rules[0].enabled, false)
  assert.deepEqual(original.rules[0].channels, ["push"])
  assert.equal(original.rules[0].steps[0].delay_minutes, 20)
  assert.equal(current.rules[0].enabled, true)
  assert.deepEqual(current.rules[0].channels, ["push", "email"])
  assert.equal(current.rules[0].steps[0].delay_minutes, 30)
  assert.equal(current.rules[1], original.rules[1])
  assert.equal(current.version, original.version)
})
test("preview and save callbacks are user-triggered; rendering sends nothing", () => {
  let saves = 0
  const previews: unknown[] = []
  const tree = elements(AutomationControls(props({ onSave: () => saves++, onPreview: (step) => previews.push(step) })))
  assert.equal(saves, 0)
  assert.equal(previews.length, 0)
  const preview = tree.find((element) => element.props.children === "Preview text")!
  ;(preview.props.onClick as () => void)()
  ;(tree[tree.length - 1].props.onClick as () => void)()
  assert.equal(saves, 1)
  assert.equal(previews.length, 1)
})
