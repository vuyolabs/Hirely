import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/dal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await verifyAdmin();

  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const pageSize = 15;

  const [totalCount, auditLogs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { created_at: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return (
          <Badge variant="default" className="bg-emerald-600">
            CREATE
          </Badge>
        );
      case "UPDATE":
        return <Badge variant="secondary">UPDATE</Badge>;
      case "STATUS_CHANGE":
        return (
          <Badge variant="default" className="bg-blue-600">
            STATUS_CHANGE
          </Badge>
        );
      case "PUBLISH":
        return (
          <Badge variant="default" className="bg-purple-600">
            PUBLISH
          </Badge>
        );
      case "CLOSE":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-500">
            CLOSE
          </Badge>
        );
      case "DISABLE":
      case "DELETE":
        return <Badge variant="destructive">{action}</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Security & Activity Audit Trail
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Immutable audit record of user modifications, job creations, status
          changes, and governance events.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System Audit Logs</CardTitle>
          <CardDescription>
            Showing {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} audit
            entries recorded in PostgreSQL
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource Type</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Metadata / Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-xs text-muted-foreground"
                >
                  No audit logs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </TableCell>

                  <TableCell>{getActionBadge(log.action)}</TableCell>

                  <TableCell className="font-semibold text-xs">
                    {log.resource_type}
                  </TableCell>

                  <TableCell className="text-xs">
                    <div>
                      <p className="font-medium text-foreground">
                        {log.user.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {log.user.role}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                    {log.metadata
                      ? JSON.stringify(log.metadata)
                      : log.resource_id || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination using shadcn component */}
      {totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`/admin/audit?page=${currentPage - 1}`}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href={`/admin/audit?page=${pageNum}`}
                    isActive={currentPage === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={`/admin/audit?page=${currentPage + 1}`}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
