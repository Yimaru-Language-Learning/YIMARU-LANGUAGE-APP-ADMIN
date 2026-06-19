/** Placeholder component — authors do not configure content for this side. */
export const NO_INPUT_COMPONENT_KIND = "NO_INPUT"

export function isNoInputComponentKind(kind: string): boolean {
  return kind.trim().toUpperCase() === NO_INPUT_COMPONENT_KIND
}

export function effectiveComponentKinds(kinds: string[]): string[] {
  return kinds.filter((kind) => !isNoInputComponentKind(kind))
}

export function sideIsNoInputOnly(kinds: string[]): boolean {
  return kinds.length > 0 && kinds.every(isNoInputComponentKind)
}

export function mergeCatalogWithNoInput(kinds: string[]): string[] {
  if (kinds.some(isNoInputComponentKind)) return kinds
  return [...kinds, NO_INPUT_COMPONENT_KIND]
}

export function noInputSchemaRow(id = "no_input_1"): {
  id: string
  kind: string
  label: string
  required: boolean
} {
  return {
    id,
    kind: NO_INPUT_COMPONENT_KIND,
    label: "No input",
    required: false,
  }
}
