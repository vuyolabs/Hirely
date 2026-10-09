import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminApplicationsViewProps = {
  data: {
    metrics: {
      totalApplications: number;
      appliedCount: number;
      screeningCount: number;
      shortlistedCount: number;
      interviewCount: number;
      hiredCount: number;
      rejectedCount: number;
    };
    applications: {
      id: string;
      status: string;
      created_at: Date | string;
      job: {
        title: string;
        recruiter: {
          company_name: string | null;
        };
      };
      candidate: {
        first_name: string;
        last_name: string;
        user: {
          email: string;
        };
      };
    }[];
    pagination?: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  };
};

export function AdminApplicationsView({ data }: AdminApplicationsViewProps) {
  const { metrics, applications } = data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPLIED":
        return <Badge variant="secondary">Applied</Badge>;
      case "SCREENING":
        return (
          <Badge
            variant="outline"
            className="border-amber-500 text-amber-600 dark:text-amber-400"
          >
            Screening
          </Badge>
        );
      case "SHORTLISTED":
        return <Badge variant="default" className="bg-blue-600">Shortlisted</Badge>;
      case "INTERVIEW":
        return <Badge variant="default" className="bg-purple-600">Interview</Badge>;
      case "HIRED":
        return <Badge variant="default" className="bg-emerald-600">Hired</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Applications Funnel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide view of recruitment activity and hiring pipelines.
        </p>
      </div>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Applied</p>
            <p className="mt-1.5 text-xl font-bold">{metrics.appliedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Screening</p>
            <p className="mt-1.5 text-xl font-bold text-amber-600">{metrics.screeningCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Shortlisted</p>
            <p className="mt-1.5 text-xl font-bold text-blue-600">{metrics.shortlistedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Interview</p>
            <p className="mt-1.5 text-xl font-bold text-purple-600">{metrics.interviewCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Hired</p>
            <p className="mt-1.5 text-xl font-bold text-emerald-600">{metrics.hiredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Rejected</p>
            <p className="mt-1.5 text-xl font-bold text-red-600">{metrics.rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Platform Submissions</CardTitle>
          <CardDescription>
            {data.pagination
              ? `Showing ${applications.length === 0 ? 0 : (data.pagination.currentPage - 1) * data.pagination.pageSize + 1} - ${Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.totalCount)} of ${data.pagination.totalCount} applications submitted across all recruiters`
              : "Applications submitted across all recruiters"}
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Target Job</TableHead>
              <TableHead>Employer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                  No candidate applications recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-semibold text-xs">
                    <div>
                      <p>{app.candidate.first_name} {app.candidate.last_name}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">
                        {app.candidate.user.email}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    {app.job.title}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {app.job.recruiter.company_name || "Company"}
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(app.status)}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(app.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination using shadcn component */}
      {data.pagination && data.pagination.totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`/admin/applications?page=${data.pagination.currentPage - 1}`}
                className={data.pagination.currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href={`/admin/applications?page=${pageNum}`}
                  isActive={data.pagination?.currentPage === pageNum}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href={`/admin/applications?page=${data.pagination.currentPage + 1}`}
                className={data.pagination.currentPage === data.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
