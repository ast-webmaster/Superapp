/** Tabs of the list, the same ones the web index has. The server scopes each to the user's role. */
export type AuditTab = 'planned' | 'on_progress' | 'follow_up' | 'finding' | 'approval';

/** Everything the user can narrow the list by. `null` and `'all'` mean no narrowing. */
export type AuditListFilters = {
  tab: AuditTab | 'all';
  /** One status exactly as the server spells it, or `'all'`. */
  status: string;
  /** Both ends of the month filter; a month needs a year, so `month` is null when `year` is. */
  year: number | null;
  month: number | null;
};

export type PageMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type AuditProgress = {
  total: number;
  settled: number;
  percent: number;
};

/** One row of `GET /audit`. Field names follow the wire format. */
export type AuditListItem = {
  uuid: string;
  audit_no: string;
  /** YYYY-MM-DD */
  audit_date: string;
  title: string;
  branch_name: string | null;
  department: string | null;
  audit_type: string[];
  period_activity_start: string | null;
  period_activity_end: string | null;
  /** Not narrowed: show a status the app does not know as it is. */
  status: string;
  team_leader: string;
  team_leader_name: string | null;
  responsibility: string | null;
  responsibility_name: string | null;
  progress: AuditProgress | null;
  /** The card waits for this user to act. */
  awaiting_me: boolean;
};

/** What the signed-in user may do on one card. The server decides; the app only shows these. */
export type AuditAction = 'start' | 'submit' | 'follow_up' | 'approve' | 'reject';

export type AuditAbilities = {
  edit: boolean;
  change_team_leader: boolean;
  manage_program: boolean;
  manage_finding: boolean;
  upload_attachment: boolean;
  download_finding: boolean;
  assign: boolean;
};

export type AuditDetail = Omit<AuditListItem, 'progress' | 'branch_name'> & {
  branch: number | null;
  branch_name: string | null;
  period_start: string | null;
  period_end: string | null;
  remarks: string | null;
  is_locked: boolean;
  is_head_office: boolean;
  /** ISO 8601 */
  updated_at: string | null;
  allowed_actions: AuditAction[];
  can: AuditAbilities;
  program_stats: ProgramStats;
  finding_stats: { total: number; answered: number; without_pic: number };
};

export type ProgramStats = {
  total: number;
  new: number;
  pending: number;
  done: number;
  settled: number;
  percent: number;
};

export type AuditChecklist = {
  id: number;
  description: string;
  is_completed: boolean;
  due_date: string | null;
  is_overdue: boolean;
  overdue_days: number;
  finished_at: string | null;
  created_by: string;
  created_by_name: string | null;
};

export type ChecklistMeta = {
  total: number;
  completed: number;
  percent: number;
  can_manage: boolean;
};

export type AuditAttachment = {
  id: number;
  description: string;
  file: string;
  uploaded_by: string;
  uploaded_by_name: string | null;
  created_at: string;
  can_delete: boolean;
};

export type AuditProgram = {
  id: number;
  div_dept: string | null;
  process_description: string;
  audit_objective: string | null;
  risk: string | null;
  schedule_start: string | null;
  schedule_end: string | null;
  status: string;
  result: string | null;
  created_by: string;
  created_by_name: string | null;
};

export type ProgramMeta = ProgramStats & { can_manage: boolean };

export type AuditFinding = {
  id: number;
  audit_finding: string;
  category: string;
  bobot: number;
  status: string;
  pic: string | null;
  pic_name: string | null;
  root_cause: string | null;
  impact: string | null;
  recommendation: string | null;
  auditee_response: string | null;
  due_date: string | null;
  is_answered: boolean;
  response_updated_by: string | null;
  response_updated_by_name: string | null;
  response_updated_at: string | null;
  /** The user may fill in the response and upload evidence for this finding now. */
  can_respond: boolean;
  attachments: AuditAttachment[];
};

export type FindingMeta = {
  total: number;
  answered: number;
  without_pic: number;
  can_manage: boolean;
};

/** One line of the approval log. `tier` is `AUDITOR`, `RESPONSIBILITY` or `MANAGER`. */
export type AuditApproval = {
  id: number;
  user: string;
  user_name: string | null;
  tier: string;
  status: string;
  remarks: string | null;
  action_at: string | null;
};

export type AuditActionInput = {
  action: AuditAction;
  remarks?: string;
};

export type FindingResponseInput = {
  findingId: number;
  auditeeResponse: string;
  /** YYYY-MM-DD, or null to clear. */
  dueDate: string | null;
};

export type AuditPage = { items: AuditListItem[]; meta: PageMeta };
