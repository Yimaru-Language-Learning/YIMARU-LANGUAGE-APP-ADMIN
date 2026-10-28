function diagnosticValue(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9._+-]{1,64}$/.test(value)
    ? value
    : null
}

/** Client-reported diagnostics, not proof of identity or update status. */
export function activityAppLabel(metadata: Record<string, unknown>): string {
  const version = diagnosticValue(metadata.app_version)
  const build = diagnosticValue(metadata.app_build)
  const platform = metadata.app_platform === "android"
    ? "Android"
    : metadata.app_platform === "ios" ? "iOS" : null
  const release = version
    ? `${version}${build ? ` (${build})` : ""}`
    : `Version unavailable${build ? ` (build ${build})` : ""}`
  return platform ? `${platform} · ${release}` : release
}

export function activityRequestId(metadata: Record<string, unknown>): string | null {
  return diagnosticValue(metadata.request_id)
}
