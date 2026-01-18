import { create } from "zustand"
import { type User } from "../types/user.types"
import {type UserProfileData } from "../types/user.types"

interface UsersState {
  users: User[]
  total: number
  page: number
  pageSize: number
  search: string

  // Detailed user for the detail page
  userProfile: UserProfileData | null

  // Actions
  setUsers: (users: User[]) => void
  setTotal: (total: number) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearch: (search: string) => void
  setUserProfile: (profile: UserProfileData | null) => void
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  total: 0,
  page: 1,
  pageSize: 5,
  search: "",
  userProfile: null,
  
  setUsers: (users) => set({ users }),
  setTotal: (total) => set({ total }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize }),
  setSearch: (search) => set({ search }),
  setUserProfile: (profile) => set({ userProfile: profile }),
}))
