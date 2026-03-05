export interface Issue {
  id: number;
  user_id: number;
  user_role: string;
  subject: string;
  description: string;
  issue_type: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface IssueListData {
  issues: Issue[];
  total_count: number;
}

export interface GetIssuesResponse {
  message: string;
  data: IssueListData;
  success: boolean;
  status_code: number;
  metadata: null;
}

export interface GetIssueResponse {
  message: string;
  data: Issue;
  success: boolean;
  status_code: number;
  metadata: null;
}

export interface CreateIssueRequest {
  subject: string;
  description: string;
  issue_type: string;
  metadata?: Record<string, unknown>;
}

export interface CreateIssueResponse {
  message: string;
  data: Issue;
  success: boolean;
  status_code: number;
  metadata: unknown;
}

export interface UpdateIssueStatusResponse {
  message: string;
  success: boolean;
  status_code: number;
  metadata: null;
}

export interface DeleteIssueResponse {
  message: string;
  success: boolean;
  status_code: number;
  metadata: null;
}

export interface IssueFilters {
  limit?: number;
  offset?: number;
}
