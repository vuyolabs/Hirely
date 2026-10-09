"use client";

import { formatDate } from "@/lib/format";
import { useState, useTransition } from "react";
import {
  Ban,
  CheckCircle,
  Search,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toggleUserStatus } from "@/actions/admin";
import { UserRole } from "@/generated/prisma/enums";

export type UserItem = {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date | string;
  candidateProfile: {
    first_name: string;
    last_name: string;
  } | null;
  recruiterProfile: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  } | null;
};

export type UsersTableProps = {
  initialUsers: UserItem[];
  currentAdminId: string;
};

export function UsersTable({ initialUsers, currentAdminId }: UsersTableProps) {
  const [users] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(term) ||
      u.candidateProfile?.first_name.toLowerCase().includes(term) ||
      u.candidateProfile?.last_name.toLowerCase().includes(term) ||
      u.recruiterProfile?.company_name?.toLowerCase().includes(term) ||
      u.recruiterProfile?.first_name.toLowerCase().includes(term) ||
      u.recruiterProfile?.last_name.toLowerCase().includes(term);

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = (userId: string) => {
    startTransition(async () => {
      await toggleUserStatus(userId);
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email, name, or company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9"
              />
            </div>

            <div className="w-40">
              <Select
                value={roleFilter}
                onValueChange={(val) => {
                  if (val) {
                    setRoleFilter(val);
                    setCurrentPage(1);
                  }
                }}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="CANDIDATE">Candidate</SelectItem>
                  <SelectItem value="RECRUITER">Recruiter</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredUsers.length} total users
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Associated Profile</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((u) => {
                const isSelf = u.id === currentAdminId;
                const profileName = u.candidateProfile
                  ? `${u.candidateProfile.first_name} ${u.candidateProfile.last_name}`
                  : u.recruiterProfile
                  ? `${u.recruiterProfile.first_name} ${u.recruiterProfile.last_name} (${u.recruiterProfile.company_name || "Company"})`
                  : "Platform Administrator";

                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-xs">
                      <div>
                        <p>{u.email}</p>
                        {isSelf && (
                          <span className="text-[10px] text-muted-foreground">(You)</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          u.role === "ADMIN"
                            ? "default"
                            : u.role === "RECRUITER"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {profileName}
                    </TableCell>

                    <TableCell>
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-medium">
                          <Ban className="h-3 w-3" /> Disabled
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleToggleStatus(u.id)}
                            disabled={isPending}
                            className={
                              u.is_active
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            }
                          >
                            {u.is_active ? "Disable" : "Enable"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination using shadcn component */}
      {Math.ceil(filteredUsers.length / pageSize) > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: Math.ceil(filteredUsers.length / pageSize) }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === pageNum}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(pageNum);
                  }}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < Math.ceil(filteredUsers.length / pageSize)) setCurrentPage((p) => p + 1);
                }}
                className={currentPage === Math.ceil(filteredUsers.length / pageSize) ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
