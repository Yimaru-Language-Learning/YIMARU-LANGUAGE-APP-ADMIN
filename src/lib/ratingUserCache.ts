import { getUserById } from "../api/users.api"
import { userDisplayName } from "./ratingsDisplay"

export type ReviewerProfile = {
  id: number
  name: string
  email: string
}

const cache = new Map<number, ReviewerProfile | "error">()

export async function fetchReviewerProfile(userId: number): Promise<ReviewerProfile | null> {
  const cached = cache.get(userId)
  if (cached === "error") return null
  if (cached) return cached

  try {
    const res = await getUserById(userId)
    const user = res.data.data
    const profile: ReviewerProfile = {
      id: user.id,
      name: userDisplayName(user.first_name, user.last_name, user.id),
      email: user.email || "",
    }
    cache.set(userId, profile)
    return profile
  } catch {
    cache.set(userId, "error")
    return null
  }
}

export async function fetchReviewerProfiles(
  userIds: number[],
  concurrency = 5,
): Promise<Map<number, ReviewerProfile>> {
  const unique = Array.from(new Set(userIds.filter((id) => Number.isFinite(id))))
  const result = new Map<number, ReviewerProfile>()

  for (let i = 0; i < unique.length; i += concurrency) {
    const batch = unique.slice(i, i + concurrency)
    const profiles = await Promise.all(batch.map((id) => fetchReviewerProfile(id)))
    batch.forEach((id, index) => {
      const profile = profiles[index]
      if (profile) result.set(id, profile)
    })
  }

  return result
}

export function clearReviewerProfileCache(): void {
  cache.clear()
}
