import type { NavigateFunction } from "react-router-dom";

/** Navigate to an explicit back destination (never browser history). */
export function navigateBack(navigate: NavigateFunction, fallbackTo: string): void {
  navigate(fallbackTo);
}
