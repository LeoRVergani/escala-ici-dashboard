export interface Organization {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  createdByUserId: string;
  createdByDisplayName: string;
  createdAt: string;
}
