import assert from "node:assert/strict"
import test from "node:test"
import { isValidElement, type ReactElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AutomationControls, type AutomationControlsProps } from "../src/components/notifications/AutomationControls"
import { AutomationPreviewDialog } from "../src/components/notifications/AutomationPreviewDialog"
import { ToggleSwitch } from "../src/components/ui/toggle-switch"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTrigger } from "../src/components/ui/dialog"
import type { AutomationConfig } from "../src/types/automation.types"

function configuration(): AutomationConfig {
  return { version: 3, rules: ["payment_recovery", "inactivity", "new_course"].map((kind, index) => ({ kind: kind as AutomationConfig["rules"][number]["kind"], enabled: false, channels: ["push"], enabled_at: "", epoch: "", created_by: 0, steps: (index === 2 ? [0] : index ? [4320, 10080, 20160] : [20, 4320, 10080]).map((delay_minutes) => ({ delay_minutes, title: "Reminder", message: "Message" })) })) }
}
function props(update: Partial<AutomationControlsProps> = {}): AutomationControlsProps {
  return { config: configuration(), canEdit: true, canSend: () => true, saving: false, dirty: true, onChange: () => {}, onSave: () => {}, ...update }
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(node)) return []
  return [node, ...elements(node.props.children as ReactNode)]
}

test("read-only controls disable editing and saving", () => {
  const html = renderToStaticMarkup(<AutomationControls {...props({ canEdit: false })} />)
  assert.equal((html.match(/<fieldset disabled=""/g) ?? []).length, 3)
  assert.equal((html.match(/role="switch"[^>]*disabled=""/g) ?? []).length, 3)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Save settings<\/button>/)
})
test("saving disables every rule and prevents repeat saves", () => {
  const html = renderToStaticMarkup(<AutomationControls {...props({ saving: true })} />)
  assert.equal((html.match(/<fieldset disabled=""/g) ?? []).length, 3)
  assert.equal((html.match(/role="switch"[^>]*disabled=""/g) ?? []).length, 3)
  assert.match(html, /<button[^>]*disabled=""[^>]*>Saving…<\/button>/)
})
test("unchanged settings cannot be saved", () => {
  assert.match(renderToStaticMarkup(<AutomationControls {...props({ dirty: false })} />), /<button[^>]*disabled=""[^>]*>Save settings<\/button>/)
})
test("new-course controls explain the historical-draft exclusion", () => {
  const html = renderToStaticMarkup(<AutomationControls {...props()} />)
  assert.match(html, /one-time historical baseline, including drafts, are excluded/)
})
test("channel permissions disable unpermitted channels", () => {
  const tree = elements(AutomationControls(props({ canSend: (channel) => channel === "push" })))
  const checkboxes = tree.filter((element) => element.type === "input")
  assert.equal(checkboxes.length, 6)
  assert.equal(checkboxes[0].props.disabled, false)
  assert.equal(checkboxes[1].props.disabled, true)
  assert.equal(checkboxes[2].props.disabled, false)
  assert.equal(checkboxes[3].props.disabled, true)
})
test("enable, channel, and delay callbacks emit immutable edits for only the selected rule", () => {
  const original = configuration()
  let current = original
  const controls = props({ config: original, onChange: (index, update) => { current = { ...current, rules: current.rules.map((rule, i) => i === index ? update(rule) : rule) } } })
  const tree = elements(AutomationControls(controls))
  const boxes = tree.filter((element) => element.type === "input")
  const enabled = tree.find((element) => element.type === ToggleSwitch)!
  ;(enabled.props.onCheckedChange as () => void)()
  ;(boxes[1].props.onChange as (event: unknown) => void)({ target: { checked: true } })
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
test("each step has its own modal preview using its current unsaved text; rendering sends nothing", () => {
  let saves = 0
  let edits = 0
  const config = configuration()
  config.rules[0].steps[0].title = "Unsaved title"
  const tree = elements(AutomationControls(props({ config, onSave: () => saves++, onChange: () => edits++ })))
  assert.equal(saves, 0)
  assert.equal(edits, 0)
  const previews = tree.filter((element) => element.type === AutomationPreviewDialog)
  assert.equal(previews.length, 7)
  assert.equal(previews[0].props.step, config.rules[0].steps[0])
  assert.equal(previews[0].props.label, "Subscription recovery — step 1")
  assert.equal(previews[5].props.step, config.rules[1].steps[2])
  assert.equal(previews[5].props.label, "Inactivity — step 3")
  assert.equal(previews[6].props.label, "New course published")
  const save = tree.find((element) => element.props.children === "Save settings")!
  ;(save.props.onClick as () => void)()
  assert.equal(saves, 1)
})

test("closed previews are accessible modal triggers, not inline message sections", () => {
  const html = renderToStaticMarkup(<AutomationControls {...props()} />)
  assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 7)
  assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 7)
  assert.match(html, /aria-label="Preview Subscription recovery — step 1"/)
  assert.match(html, /aria-label="Preview Inactivity — step 3"/)
  assert.match(html, /aria-label="Preview New course published"/)
  assert.doesNotMatch(html, /Message preview|Close preview/)
})

test("preview uses the shared modal trigger and close controls without save or edit callbacks", () => {
  const tree = elements(AutomationPreviewDialog({ step: configuration().rules[0].steps[0], label: "Subscription recovery — step 1" }))
  assert.equal(tree[0].type, Dialog)
  assert.equal(tree.filter((element) => element.type === DialogTrigger && element.props.asChild).length, 1)
  assert.equal(tree.filter((element) => element.type === DialogContent).length, 1)
  assert.equal(tree.filter((element) => element.type === DialogClose && element.props.asChild).length, 1)
  assert.ok(tree.some((element) => element.type === DialogDescription))
  assert.ok(tree.every((element) => !element.props.onClick && !element.props.onSubmit))
})

test("preview preserves multiline text and escapes HTML rather than executing it", () => {
  const text = '<img src=x onerror="alert(1)">\nSecond line & more'
  const step = { delay_minutes: 20, title: text, message: text }
  const tree = elements(AutomationPreviewDialog({ step, label: "Subscription recovery — step 1" }))
  const content = tree.filter((element) => element.props.children === text)
  assert.equal(content.length, 2)
  for (const element of content) {
    const html = renderToStaticMarkup(element)
    assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;\nSecond line &amp; more/)
    assert.doesNotMatch(html, /<img/)
    assert.match(String(element.props.className), /whitespace-pre-wrap/)
    assert.match(String(element.props.className), /overflow-wrap:anywhere/)
  }
})
