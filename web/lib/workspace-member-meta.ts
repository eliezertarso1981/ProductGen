import type { WorkspaceJobFunction, WorkspaceRole } from "@/lib/productgen-api";

export const WORKSPACE_JOB_FUNCTIONS: WorkspaceJobFunction[] = [
  "CEO",
  "CPO",
  "GPM",
  "PM",
  "PD",
  "UX",
  "PO",
];

export const WORKSPACE_JOB_FUNCTION_LABELS: Record<WorkspaceJobFunction, string> = {
  CEO: "CEO — Chief Executive Officer",
  CPO: "CPO — Chief Product Officer",
  GPM: "GPM — Group Product Manager",
  PM: "PM — Product Manager",
  PD: "PD — Product Designer",
  UX: "UX — User Experience",
  PO: "PO — Product Owner",
};

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner (dono)",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer (leitura)",
  guest: "Guest",
};
