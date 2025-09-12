import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  mobileLayout?: React.ReactNode;
}

export const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableProps
>(({ className, children }, ref) => (
  <div ref={ref} className={cn("w-full overflow-auto", className)}>
    {/* Desktop Table */}
    <div className="hidden md:block">
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  </div>
));
ResponsiveTable.displayName = "ResponsiveTable";

export const ResponsiveTableRow = React.forwardRef<
  HTMLTableRowElement,
  ResponsiveTableRowProps
>(({ className, children, mobileLayout }, ref) => (
  <>
    {/* Desktop Row */}
    <tr
      ref={ref}
      className={cn(
        "hidden md:table-row border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
    >
      {children}
    </tr>
    
    {/* Mobile Card */}
    {mobileLayout && (
      <div className="block md:hidden p-4 border-b bg-card rounded-lg mb-2 shadow-soft">
        {mobileLayout}
      </div>
    )}
  </>
));
ResponsiveTableRow.displayName = "ResponsiveTableRow";

export const ResponsiveTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children }, ref) => (
  <thead ref={ref} className={cn("hidden md:table-header-group [&_tr]:border-b", className)}>
    {children}
  </thead>
));
ResponsiveTableHeader.displayName = "ResponsiveTableHeader";

export const ResponsiveTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children }, ref) => (
  <>
    {/* Desktop tbody */}
    <tbody ref={ref} className={cn("hidden md:table-row-group [&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
    
    {/* Mobile container */}
    <div className="block md:hidden space-y-2">
      {children}
    </div>
  </>
));
ResponsiveTableBody.displayName = "ResponsiveTableBody";