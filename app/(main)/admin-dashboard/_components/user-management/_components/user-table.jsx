"use client";

import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Edit,
  Filter,
  MoreHorizontal,
  Search,
  ToggleLeft,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Import toast components

import { toast } from "sonner";
import { toggleUserStatus } from "../../../../../../queries/admin";

export default function UserTable({ users }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filteredCache, setFilteredCache] = useState({});
  const [userData, setUserData] = useState(users);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Generate cache key for memoization
  const getCacheKey = useCallback((searchTerm, filterRole) => {
    return `${searchTerm}_${filterRole}`;
  }, []);

  // Filter users with caching
  const filteredUsers = useMemo(() => {
    const cacheKey = getCacheKey(debouncedSearchTerm, filterRole);

    if (filteredCache[cacheKey]) {
      return filteredCache[cacheKey];
    }

    const filtered = userData.filter((user) => {
      const department =
        user.student?.department ||
        user.instructor?.department ||
        user.admin?.department ||
        "";
      const matchesSearch =
        user.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        department.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesRole = filterRole === "all" || user.role === filterRole;
      return matchesSearch && matchesRole;
    });

    // Cache the result
    setFilteredCache((prev) => ({
      ...prev,
      [cacheKey]: filtered,
    }));

    return filtered;
  }, [userData, debouncedSearchTerm, filterRole, filteredCache, getCacheKey]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Clear cache when filter changes
  useEffect(() => {
    setFilteredCache({});
  }, [filterRole]);

  const handleApproveUser = (userId) => {
    setUserData((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, isActive: true, updatedAt: new Date().toISOString() }
          : user
      )
    );
    setFilteredCache({}); // Clear cache after data change
    console.log("Approving user:", userId);
  };

  const handleRejectUser = (userId) => {
    setUserData((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, isActive: false, updatedAt: new Date().toISOString() }
          : user
      )
    );
    setFilteredCache({}); // Clear cache after data change
    console.log("Rejecting user:", userId);
  };

  const handleToggleUserStatus = async (userId) => {
    const targetUser = userData.find((user) => user.id === userId);
    const userName = targetUser?.name || "User";

    console.log("Toggling user status:", userId);

    try {
      setIsProcessing(true);
      toast.success("Action Processing...");

      const result = await toggleUserStatus(userId);

      if (result.success) {
        const updatedUser = { ...targetUser, isActive: !targetUser.isActive };
        const updatedAllUsers = userData.filter(
          (user) => user.id !== updatedUser.id
        );

        console.log("handleToggleUserStatus ~ updatedUser:", updatedUser);
        setUserData([...updatedAllUsers, updatedUser]);
        setFilteredCache({});

        toast.success("Action Complete...");
      } else {
        console.error("Failed to toggle user status:", result.error);
      }
    } catch (err) {
      console.log(err);
      toast.error("Action failed...");
    } finally {
      setIsProcessing(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const getUserStatusBadge = (user) => {
    if (!user.isActive) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Inactive
        </Badge>
      );
    }
    if (user.role === "instructor" && user.createdAt === user.updatedAt) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pending
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        Active
      </Badge>
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(parseInt(size));
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage all platform users and their permissions (
              {filteredUsers.length} total)
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-[300px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterRole("all")}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("student")}>
                  Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("instructor")}>
                  Instructor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("admin")}>
                  Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">User</TableHead>
                <TableHead className="min-w-[100px]">Role</TableHead>
                <TableHead className="min-w-[120px] hidden sm:table-cell">
                  Department
                </TableHead>
                <TableHead className="min-w-[150px]">Status</TableHead>
                <TableHead className="min-w-[100px] hidden md:table-cell">
                  Join Date
                </TableHead>
                <TableHead className="text-right min-w-[120px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={!user.isActive ? "opacity-60" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarImage src={user.image || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">
                            {user.name}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm">
                        {user.student?.department ||
                          user.instructor?.department ||
                          user.admin?.department ||
                          "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          {getUserStatusBadge(user)}
                        </div>
                        {(user.instructor?.designation ||
                          user.admin?.designation) && (
                          <div className="text-xs text-muted-foreground">
                            {user.instructor?.designation ||
                              user.admin?.designation}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          ID:{" "}
                          {user.student?.idNumber ||
                            user.instructor?.idNumber ||
                            user.admin?.idNumber ||
                            "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {user.role === "instructor" &&
                          user.createdAt === user.updatedAt &&
                          user.isActive && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveUser(user.id)}
                                className="text-green-600 hover:text-green-700 p-2"
                                title="Approve User"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectUser(user.id)}
                                className="text-red-600 hover:text-red-700 p-2"
                                title="Reject User"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              disabled={isProcessing}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* <DropdownMenuSeparator /> */}
                            <DropdownMenuLabel className="text-xs">
                              Admin Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleToggleUserStatus(user.id)}
                              disabled={isProcessing}
                            >
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              Toggle Active / Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!user.isActive || isProcessing}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pt-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredUsers.length)} of{" "}
                {filteredUsers.length} entries
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">Rows per page:</p>
                <select
                  value={pageSize.toString()}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="w-16 h-8 px-2 text-sm border border-input bg-background rounded-md"
                  disabled={isProcessing}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || isProcessing}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isProcessing}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1;
                      return showPage;
                    })
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-8 w-8 p-0"
                          disabled={isProcessing}
                        >
                          {page}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isProcessing}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || isProcessing}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
