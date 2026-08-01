import { getTeamMemberById } from "../api/team.api"
import { getUserById } from "../api/users.api"
import { TEAM_ROLE_OPTIONS, formatTeamRoleLabel } from "./teamRoles"
import type { TeamMember, TeamMemberDetail } from "../types/team.types"
import type { UserProfileData } from "../types/user.types"

const TEAM_ROLE_VALUES = new Set(
  TEAM_ROLE_OPTIONS.map((o) => o.value.toUpperCase()),
)

const APP_USER_ROLES = new Set([
  "STUDENT",
  "OPEN_LEARNER",
  "ADMIN",
  "SUPER_ADMIN",
  "USER",
  "SUBSCRIBER",
  "LEARNER",
])

export type ActorProfileKind = "team" | "user"

export type ActorProfile =
  | {
      kind: "team"
      id: number
      name: string
      email: string
      roleLabel: string
      status: string
      emailVerified: boolean
      createdAt: string
    }
  | {
      kind: "user"
      id: number
      name: string
      email: string
      roleLabel: string
      status: string
      emailVerified: boolean
      country: string
      region: string
      lastLogin: string | null
      subscriptionStatus: string
      createdAt: string
    }

function normalizeRole(role: string): string {
  return role.trim().toUpperCase().replace(/[\s-]+/g, "_")
}

/** Choose API from activity log `actor_role` (team_role vs learner role). */
export function resolveActorKind(actorRole: string | null | undefined): ActorProfileKind | null {
  if (!actorRole?.trim()) return null
  const upper = normalizeRole(actorRole)
  if (APP_USER_ROLES.has(upper)) return "user"
  if (TEAM_ROLE_VALUES.has(upper)) return "team"
  return null
}

function teamMemberToProfile(
  member: Pick<
    TeamMember | TeamMemberDetail,
    "id" | "first_name" | "last_name" | "email" | "team_role" | "status" | "email_verified" | "created_at"
  >,
): ActorProfile {
  return {
    kind: "team",
    id: member.id,
    name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "unassigned",
    email: member.email || "unassigned",
    roleLabel: formatTeamRoleLabel(member.team_role),
    status: member.status || "unassigned",
    emailVerified: Boolean(member.email_verified),
    createdAt: member.created_at,
  }
}

function userToProfile(user: UserProfileData): ActorProfile {
  return {
    kind: "user",
    id: user.id,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ") || "unassigned",
    email: user.email || "unassigned",
    roleLabel: user.role
      ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "unassigned",
    status: user.status || "unassigned",
    emailVerified: Boolean(user.email_verified),
    country: user.country || "unassigned",
    region: user.region || "unassigned",
    lastLogin: user.last_login,
    subscriptionStatus: user.subscription_status?.trim() || "unassigned",
    createdAt: user.created_at,
  }
}

const profileCache = new Map<string, ActorProfile | "error">()

function cacheKey(actorId: number, kind: ActorProfileKind): string {
  return `${kind}:${actorId}`
}

async function fetchTeamProfile(actorId: number): Promise<ActorProfile> {
  const res = await getTeamMemberById(actorId)
  return teamMemberToProfile(res.data.data)
}

async function fetchUserProfile(actorId: number): Promise<ActorProfile> {
  const res = await getUserById(actorId)
  return userToProfile(res.data.data)
}

export async function fetchActorProfile(
  actorId: number,
  actorRole: string | null | undefined,
  actorKind?: "user" | "team_member" | null,
): Promise<ActorProfile> {
  const kindFromApi =
    actorKind === "team_member" ? "team" : actorKind === "user" ? "user" : null
  const kind = kindFromApi ?? resolveActorKind(actorRole)

  const load = async (target: ActorProfileKind): Promise<ActorProfile> => {
    const key = cacheKey(actorId, target)
    const cached = profileCache.get(key)
    if (cached && cached !== "error") return cached
    if (cached === "error") throw new Error("Actor not found")

    try {
      const profile =
        target === "team" ? await fetchTeamProfile(actorId) : await fetchUserProfile(actorId)
      profileCache.set(key, profile)
      return profile
    } catch (e) {
      profileCache.set(key, "error")
      throw e
    }
  }

  if (kind === "team") return load("team")
  if (kind === "user") return load("user")

  try {
    return await load("team")
  } catch {
    return load("user")
  }
}

export function formatActorDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
