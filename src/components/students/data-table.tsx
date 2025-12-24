'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Student } from '@/lib/types';
import { useState } from 'react';
import { Loader2, ChevronRight, Phone, History, Armchair, Edit } from 'lucide-react';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import StudentActions from '@/components/students/student-actions'; // Import StudentActions


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  isLoading?: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  filters: ColumnFiltersState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
  setFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
}

export function DataTable<TData, TValue>({
  columns: initialColumns,
  data,
  pageCount,
  isLoading = false,
  pagination,
  sorting,
  filters,
  setPagination,
  setSorting,
  setFilters,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [loadingRow, setLoadingRow] = useState<string | null>(null);

  const columns = React.useMemo(() => initialColumns, [initialColumns]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters: filters,
      pagination,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  console.log("------------tbale", table)

  const handleRowClick = (student: Student) => {
    setLoadingRow(student.id);
    router.push(`/dashboard/students/${student.id}`);
  };

  const globalFilter = filters.find(f => f.id === 'global')?.value as string | undefined;

  // Helper function to get column value for mobile cards
  const getColumnValue = (student: Student, columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column) return null;

    // This is a simplified approach - in a real implementation you might need more complex logic
    return (student as any)[columnId];
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search by name or phone..."
          value={globalFilter ?? ''}
          onChange={(event) =>
            setFilters([{ id: 'global', value: event.target.value }])
          }
          className="max-w-sm"
        />

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Rows per page:
          </span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              setPagination(prev => ({
                ...prev,
                pageSize: Number(value),
                pageIndex: 0
              }));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-md border overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pagination.pageSize }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => handleRowClick(row.original as Student)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {loadingRow === (row.original as Student).id && cell.column.id === 'name' ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </div>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: pagination.pageSize }).map((_, index) => (
            <Card key={`mobile-skeleton-${index}`} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </Card>
          ))
        ) : data.length > 0 ? (
          data.map((studentData) => {
            const student = studentData as Student;
            console.log("Rendering UIBadge for student:", student.id, "Expiry:", student.membership_expiry_date, typeof student.membership_expiry_date);
            return (
              <Card
                key={student.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleRowClick(student)}
              >
                <CardContent className="p-0 space-y-3">
                  {/* Header with name and status */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {loadingRow === student.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      <h3 className="font-semibold text-base">{student.name}</h3>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>

                  {/* Student Details */}
                  <div className="space-y-2">
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.phone}</span>
                      </div>
                    )}

                    {student.shifts && (
                      <div className="flex items-center gap-2 text-sm">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span>{student.shifts?.name}</span>
                      </div>
                    )}

                    {student.seat_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Armchair className="h-4 w-4 text-muted-foreground" />
                        <span>Seat {student.seat_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge with Actions */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex flex-col items-start gap-1">
                      {student.membership_expiry_date && (
                        <div className="text-xs text-muted-foreground">
                          Expires on {new Date(student.membership_expiry_date).toLocaleDateString()}
                        </div>
                      )}

                      <UIBadge
                        variant={
                          student.membership_expiry_date 
                           ? new Date(student.membership_expiry_date) > new Date()
                            ? "default"
                            : "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {student.membership_expiry_date
                         ? new Date(student.membership_expiry_date) > new Date()
                          ? "Active"
                          : "Expired"
                          : "No Payment Record"}
                      </UIBadge>
                    </div>

                    {/* Edit Action - Render StudentActions directly */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <StudentActions student={student} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No students found.</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="text-sm text-muted-foreground">
          Showing {data.length} of {table.getPageCount() * pagination.pageSize} students
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            {'<<'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage() || isLoading}
          >
            {'>>'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Skeleton component for loading states
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);