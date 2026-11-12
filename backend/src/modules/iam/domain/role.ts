/** Roles del sistema. Los valores coinciden con el enum `Role` de Prisma. */
export const ROLES = ['ADMIN', 'STAFF', 'READER'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' && (ROLES as readonly string[]).includes(value)
  );
}
