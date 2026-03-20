export type UserEntity = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  roles: string[];
  permissions: string[];
};
