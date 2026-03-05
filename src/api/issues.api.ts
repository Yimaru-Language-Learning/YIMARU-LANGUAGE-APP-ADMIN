import http from "./http";
import type {
  GetIssuesResponse,
  GetIssueResponse,
  UpdateIssueStatusResponse,
  DeleteIssueResponse,
  IssueFilters,
} from "../types/issue.types";

import type { CreateIssueRequest, CreateIssueResponse } from "../types/issue.types";

export const getIssues = (filters?: IssueFilters) =>
  http.get<GetIssuesResponse>("/issues", {
    params: filters,
  });

export const getIssuesByUserId = (userId: number) =>
  http.get<GetIssuesResponse>(`/issues/user/${userId}`);

export const getIssueById = (id: number) =>
  http.get<GetIssueResponse>(`/issues/${id}`);

export const createIssue = (payload: CreateIssueRequest) =>
  http.post<CreateIssueResponse>("/issues", payload);

export const updateIssueStatus = (id: number, status: string) =>
  http.patch<UpdateIssueStatusResponse>(`/issues/${id}/status`, { status });

export const deleteIssue = (id: number) =>
  http.delete<DeleteIssueResponse>(`/issues/${id}`);
