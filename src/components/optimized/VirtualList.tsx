import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  loadMore,
  hasMore = false,
  loading = false,
  className
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex)
    };
  }, [scrollTop, itemHeight, containerHeight, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    setScrollTop(element.scrollTop);

    // Load more when near bottom
    if (
      loadMore &&
      hasMore &&
      !loading &&
      element.scrollTop + element.clientHeight >= element.scrollHeight - 100
    ) {
      loadMore();
    }
  };

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleItems.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, visibleItems.startIndex + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleItems.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center p-4">
          <Badge variant="outline">Carregando...</Badge>
        </div>
      )}
      
      {hasMore && !loading && loadMore && (
        <div className="flex justify-center p-4">
          <Button variant="outline" onClick={loadMore}>
            Carregar Mais
          </Button>
        </div>
      )}
    </div>
  );
}