import { create } from "zustand"

export type SubscriptionType = "Monthly" | "Free" | "Expired" | "3-Month" | "6-Month"

export type UserActivity = {
  id: string
  text: string
  time: string
  dotColor: "brand" | "muted"
}

export type User = {
  id: string
  fullName: string
  phone: string
  region: string
  lastActive: string
  subscription: SubscriptionType

  email: string
  joinedDate: string

  learningProfile: {
    educationLevel: string
    ageGroup: string
    currentProficiency: string
    preferredTopic: string
    primaryGoal: string
    challenges: string[]
  }

  currentPlan: string
  expiresOn: string
  daysLeftLabel: string
  isActive: boolean

  recentActivity: UserActivity[]
}

const MOCK_USERS: User[] = [
  {
    id: "u_1001",
    fullName: "Richard Wilson",
    phone: "(555) 123-4567",
    region: "Addis Ababa",
    lastActive: "24 Dec 2024",
    subscription: "6-Month",
    email: "contact@capitalflow.com",
    joinedDate: "Oct 12, 2024",
    learningProfile: {
      educationLevel: "Undergraduate Student",
      ageGroup: "18-24 Years",
      currentProficiency: "Intermediate (B2)",
      preferredTopic: "Business, Travel, Culture",
      primaryGoal: "To achieve fluency for business communication in an international company",
      challenges: ["Speaking Confidence", "Vocabulary Retention"],
    },
    currentPlan: "6-Month",
    expiresOn: "Nov 13, 2025",
    daysLeftLabel: "65 days left",
    isActive: true,
    recentActivity: [
      { id: "a1", text: "Completed Unit 4: Business Emails", time: "Today, 10:27 AM", dotColor: "brand" },
      { id: "a2", text: "Started new course: Advanced English", time: "Today, 7:20 AM", dotColor: "muted" },
      { id: "a3", text: "Started new course: Advanced English", time: "Today, 7:20 AM", dotColor: "muted" },
    ],
  },
  ...Array.from({ length: 14 }).map((_, idx) => {
    const i = idx + 1
    const sub: SubscriptionType[] = ["Monthly", "Free", "Expired", "3-Month", "6-Month"]
    const subscription = sub[i % sub.length]!
    return {
      id: `u_10${10 + i}`,
      fullName: "Abebe Kebede",
      phone: "+251912345678",
      region: "Addis Ababa",
      lastActive: "24 Dec 2024",
      subscription,
      email: "abebe@example.com",
      joinedDate: "Sep 02, 2024",
      learningProfile: {
        educationLevel: "High School",
        ageGroup: "18-24 Years",
        currentProficiency: "Beginner (A2)",
        preferredTopic: "General English",
        primaryGoal: "Improve daily conversation skills",
        challenges: ["Listening", "Pronunciation"],
      },
      currentPlan: subscription,
      expiresOn: "Nov 13, 2025",
      daysLeftLabel: "65 days left",
      isActive: subscription !== "Expired",
      recentActivity: [
        { id: "a1", text: "Completed Lesson 2", time: "Today, 9:00 AM", dotColor: "brand" },
        { id: "a2", text: "Started new course: English Basics", time: "Yesterday, 7:20 AM", dotColor: "muted" },
      ],
    } satisfies User
  }),
]

type UsersState = {
  users: User[]
  search: string
  region: string
  subscription: SubscriptionType | "All"

  setSearch: (value: string) => void
  setRegion: (value: string) => void
  setSubscription: (value: UsersState["subscription"]) => void

  getUserById: (id: string) => User | undefined
  getFilteredUsers: () => User[]
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: MOCK_USERS,
  search: "",
  region: "All",
  subscription: "All",

  setSearch: (value) => set({ search: value }),
  setRegion: (value) => set({ region: value }),
  setSubscription: (value) => set({ subscription: value }),

  getUserById: (id) => get().users.find((u) => u.id === id),
  getFilteredUsers: () => {
    const { users, search, region, subscription } = get()
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchesQuery =
        q.length === 0 ||
        u.fullName.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.region.toLowerCase().includes(q)
      const matchesRegion = region === "All" || u.region === region
      const matchesSub = subscription === "All" || u.subscription === subscription
      return matchesQuery && matchesRegion && matchesSub
    })
  },
}))


