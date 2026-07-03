import "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    /** When true, failed responses will not trigger a global error toast. */
    skipErrorToast?: boolean
  }
}
