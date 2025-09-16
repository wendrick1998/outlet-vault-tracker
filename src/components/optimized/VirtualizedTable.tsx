import React, { useMemo, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Inline virtual scroll hook
function useVirtualScroll(itemCount: number, itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight)
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleStart,
    visibleEnd,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  itemHeight?: number;
  containerHeight?: number;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function VirtualizedTable<T>({
  data,
  columns,
  itemHeight = 60,
  containerHeight = 400,
  onRowClick,
  keyExtractor,
}: VirtualizedTableProps<T>) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  
  const {
    visibleStart,
    visibleEnd,
    totalHeight,
    offsetY,
    setScrollTop,
  } = useVirtualScroll(data.length, itemHeight, containerHeight);

  const visibleItems = useMemo(() => {
    return data.slice(visibleStart, visibleEnd + 1);
  }, [data, visibleStart, visibleEnd]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, [setScrollTop]);

  return (
    <div 
      ref={setContainerRef}
      className="overflow-auto border rounded-md"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)} style={{ width: column.width }}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr style={{ height: offsetY }} />
          {visibleItems.map((item, index) => (
            <TableRow
              key={keyExtractor(item)}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(item)}
              style={{ height: itemHeight }}
            >
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.render 
                    ? column.render(item[column.key], item)
                    : String(item[column.key])
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
          <tr style={{ height: totalHeight - offsetY - (visibleItems.length * itemHeight) }} />
        </TableBody>
      </Table>
    </div>
  );
}