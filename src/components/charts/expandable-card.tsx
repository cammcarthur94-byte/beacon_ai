'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartExpandButton, ExpandableChartModal } from '@/components/charts/expandable-chart-modal';
import { cn } from '@/lib/utils';

interface ExpandableCardProps {
  /** Card title rendered in the header (and in the modal). */
  title: string;
  /** Optional icon (e.g. Info) rendered next to the title. */
  icon?: React.ReactNode;
  /** Optional description rendered under the title (and in the modal). */
  description?: React.ReactNode;
  /** Extra node rendered on the right side of the card header, before the expand button. */
  headerAction?: React.ReactNode;
  /** Optional node rendered next to the title in the modal header (e.g. a Badge). */
  badge?: React.ReactNode;
  /** Filename (without extension) used for the modal's PNG / CSV exports. */
  exportFilename?: string;
  /** Optional rows offered as "Export CSV" inside the modal. */
  csvData?: Record<string, any>[];
  /** Classes for the Card wrapper. */
  className?: string;
  /** Classes for the CardHeader. */
  headerClassName?: string;
  /** Classes for the CardContent wrapper. */
  contentClassName?: string;
  /** Classes applied to the modal body wrapper — e.g. to grow chart heights. */
  modalContentClassName?: string;
  children: React.ReactNode;
}

/**
 * Card with an expand (maximize) button in the top-right corner of its header.
 * Clicking it opens the card's content in a large popup modal with PNG / CSV export,
 * reusing the shared ChartExpandButton + ExpandableChartModal pattern.
 */
export function ExpandableCard({
  title,
  icon,
  description,
  headerAction,
  badge,
  exportFilename,
  csvData,
  className,
  headerClassName,
  contentClassName,
  modalContentClassName,
  children,
}: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className={cn('rounded-2xl border-slate-200 shadow-2xs', className)}>
        <CardHeader
          className={cn(
            'p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between gap-3',
            headerClassName
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-bold text-slate-900 truncate">{title}</CardTitle>
                {icon}
              </div>
              {description ? (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <ChartExpandButton onClick={() => setIsOpen(true)} title={`Expand ${title}`} />
          </div>
        </CardHeader>
        <CardContent className={contentClassName}>{children}</CardContent>
      </Card>

      <ExpandableChartModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        description={typeof description === 'string' ? description : undefined}
        badge={badge}
        exportFilename={exportFilename}
        csvData={csvData}
      >
        <div className={cn('w-full h-full flex flex-col justify-center gap-3', modalContentClassName)}>
          {children}
        </div>
      </ExpandableChartModal>
    </>
  );
}
