"use client"

import { useState } from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookEntry } from "@/lib/database.types"
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { SafeImage } from "@/components/ui/safe-image"
import { Card, CardContent } from "@/components/ui/card"
import { BookDetailsDialog } from "@/components/book-details-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteBookEntry } from "@/lib/book-actions"
import { toast } from "sonner"

interface BookTableProps {
    data: BookEntry[]
}

export function BookTable({ data }: BookTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = useState("")

    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedBook, setSelectedBook] = useState<BookEntry | null>(null)

    const handleEdit = (book: BookEntry) => {
        setSelectedBook(book)
        setDetailsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this book?")) return
        try {
            const result = await deleteBookEntry(id)
            if (result.success) {
                toast.success("Book deleted")
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error("Failed to delete book")
        }
    }

    const columns: ColumnDef<BookEntry>[] = [
        {
            accessorKey: "cover_url",
            header: "",
            cell: ({ row }) => {
                const cover = row.getValue("cover_url") as string
                return cover ? (
                    <div className="relative w-10 h-14 group">
                        <SafeImage
                            src={cover}
                            alt={row.getValue("title")}
                            fill
                            className="object-cover rounded-sm"
                            sizes="40px"
                            fallbackElement={
                                <div className="w-10 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-sm flex items-center justify-center absolute inset-0">
                                    <Eye className="h-4 w-4 text-zinc-400" />
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <div className="w-10 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-sm flex items-center justify-center">
                        <Eye className="h-4 w-4 text-zinc-400" />
                    </div>
                )
            },
            enableSorting: false,
        },
        {
            accessorKey: "title",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                return (
                    <div className="font-medium max-w-xs truncate" title={row.getValue("title")}>
                        {row.getValue("title")}
                    </div>
                )
            },
        },
        {
            accessorKey: "author",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Author
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("author") || "—"}</div>,
        },
        {
            accessorKey: "format",
            header: "Format",
            cell: ({ row }) => {
                const format = row.getValue("format") as string
                return format ? (
                    <Badge variant="outline" className="font-normal">
                        {format}
                    </Badge>
                ) : null
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                const variants = {
                    "Finished": "default",
                    "Reading": "secondary",
                    "On Hold": "outline",
                    "Dropped": "destructive",
                    "Plan to Read": "outline",
                } as const

                return status ? (
                    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
                        {status}
                    </Badge>
                ) : null
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) as string
                if (!value) return true
                return rowValue === value
            },
        },
        {
            accessorKey: "my_rating",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4"
                    >
                        Rating
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const rating = row.getValue("my_rating") as number
                return rating ? (
                    <div className="font-medium">
                        ★ {rating % 1 === 0 ? rating : rating.toFixed(1)}
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )
            },
        },
        {
            accessorKey: "pages",
            header: "Pages",
            cell: ({ row }) => {
                const pages = row.getValue("pages") as number
                return pages ? <span>{pages}</span> : <span className="text-muted-foreground">—</span>
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const book = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(book)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(book.id)} className="text-red-600 focus:text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize: 20,
            },
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    {/* Add search later if needed, globalFilter handles rudimentary search */}
                    <Input
                        placeholder="Search books..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
                {table.getRowModel().rows.map((row) => {
                    const book = row.original
                    const statusVariants = {
                        "Finished": "default",
                        "Reading": "secondary",
                        "On Hold": "outline",
                        "Dropped": "destructive",
                        "Plan to Read": "outline",
                    } as const
                    return (
                        <Card
                            key={book.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleEdit(book)}
                        >
                            <CardContent className="p-3">
                                <div className="flex gap-3">
                                    {/* Cover */}
                                    <div className="w-12 h-16 relative bg-muted rounded flex-shrink-0 overflow-hidden">
                                        {book.cover_url ? (
                                            <SafeImage
                                                src={book.cover_url}
                                                alt={book.title}
                                                fill
                                                className="object-cover"
                                                fallbackElement={
                                                    <div className="flex items-center justify-center h-full">
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                }
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col">
                                        <h3 className="font-medium text-sm leading-tight line-clamp-2">{book.title}</h3>
                                        {book.author && (
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{book.author}</p>
                                        )}
                                        <div className="mt-1">
                                            {book.status && (
                                                <Badge
                                                    variant={statusVariants[book.status as keyof typeof statusVariants] || "outline"}
                                                    className="text-[10px] px-1.5 py-0"
                                                >
                                                    {book.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-auto pt-1">
                                            {book.my_rating ? (
                                                <span className="text-xs font-medium">★ {book.my_rating}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
                {table.getRowModel().rows.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                        No books found.
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="rounded-md border hidden sm:block">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
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
                                    No books found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                    )}{" "}
                    of {table.getFilteredRowModel().rows.length} entries
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        <span className="text-sm">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <BookDetailsDialog
                open={detailsOpen}
                onOpenChange={(open) => {
                    setDetailsOpen(open)
                    if (!open) setSelectedBook(null)
                }}
                entry={selectedBook}
                onSuccess={() => { }}
            />
        </div>
    )
}
