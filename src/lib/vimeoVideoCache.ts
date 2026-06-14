import { getVimeoVideo } from "../api/courses.api"

const durationCache = new Map<string, number | null>()
const inflight = new Map<string, Promise<number | null>>()

export function fetchVimeoDurationSeconds(vimeoId: string): Promise<number | null> {
  const id = vimeoId.trim()
  if (!id) return Promise.resolve(null)

  if (durationCache.has(id)) {
    return Promise.resolve(durationCache.get(id) ?? null)
  }

  const pending = inflight.get(id)
  if (pending) return pending

  const request = getVimeoVideo(id)
    .then((video) => {
      const seconds =
        typeof video.duration === "number" &&
        Number.isFinite(video.duration) &&
        video.duration > 0
          ? video.duration
          : null
      durationCache.set(id, seconds)
      return seconds
    })
    .catch(() => {
      durationCache.set(id, null)
      return null
    })
    .finally(() => {
      inflight.delete(id)
    })

  inflight.set(id, request)
  return request
}
