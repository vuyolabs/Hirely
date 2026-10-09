import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";
import { UsersTable, type UserItem } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const session = await verifyAdmin();

  const users: UserItem[] = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
      candidateProfile: {
        select: { first_name: true, last_name: true },
      },
      recruiterProfile: {
        select: { first_name: true, last_name: true, company_name: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View platform members, roles, activation status, and perform account governance.
        </p>
      </div>

      <UsersTable initialUsers={users} currentAdminId={session.userId} />
    </div>
  );
}
