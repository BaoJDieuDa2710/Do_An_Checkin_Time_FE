import type React from "react"
import { cn } from "../../lib/utils"

interface TableProps {
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full divide-y divide-gray-200", className)}>{children}</table>
    </div>
  )
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return <thead className={cn("bg-gray-50", className)}>{children}</thead>
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return <tbody className={cn("bg-white divide-y divide-gray-200", className)}>{children}</tbody>
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
}

export const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return <tr className={cn("hover:bg-gray-50", className)}>{children}</tr>
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
}

export const TableCell: React.FC<TableCellProps> = ({ children, className }) => {
  return <td className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-900", className)}>{children}</td>
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className }) => {
  return (
    <th className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", className)}>
      {children}
    </th>
  )
}
