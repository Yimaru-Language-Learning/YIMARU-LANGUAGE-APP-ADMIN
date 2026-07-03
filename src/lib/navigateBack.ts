import type { NavigateFunction } from "react-router-dom";

export function canNavigateBack(): boolean {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === "number" && idx > 0;
}

export function navigateBack(navigate: NavigateFunction, fallbackTo: string): void {
  if (canNavigateBack()) {
    navigate(-1);
    return;
  }
  navigate(fallbackTo);
}
