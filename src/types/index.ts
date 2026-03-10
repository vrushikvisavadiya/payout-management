export type Role = "OPS" | "FINANCE";

export interface DBUser {
  _id?: string;
  email: string;
  password: string;
  role: Role;
  name: string;
}

export interface Vendor {
  _id?: string;
  name: string;
  upi_id?: string;
  bank_account?: string;
  ifsc?: string;
  is_active: boolean;
  createdAt: Date;
}

export type PayoutStatus = "Draft" | "Submitted" | "Approved" | "Rejected";
export type PayoutMode = "UPI" | "IMPS" | "NEFT";
export type AuditAction = "CREATED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface Payout {
  _id?: string;
  vendor_id: string;
  amount: number;
  mode: PayoutMode;
  note?: string;
  status: PayoutStatus;
  decision_reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutAudit {
  _id?: string;
  payout_id: string;
  action: AuditAction;
  performed_by: string; // email
  performed_role: Role;
  timestamp: Date;
}
