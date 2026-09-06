'use client';

import * as React from 'react';
import { Maximize2, Download, FileSpreadsheet, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ChartExpandButtonProps {
  onClick: () => void;
  className?: string;
  title?: string;
}

export function ChartExpandButton({
  onClick,
  className,
  title = 'Expand chart',
}: ChartExpandButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center justify-center p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10 active:scale-95',
        className
      )}
    >
      <Maximize2 className="h-3.5 w-3.5" />
    </button>
  );
}

export interface ExpandableChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  exportFilename?: string;
  csvData?: Record<string, any>[];
  children: React.ReactNode;
}

export function ExpandableChartModal({
  isOpen,
  onClose,
  title,
  description,
  badge,
  exportFilename,
  csvData,
  children,
}: ExpandableChartModalProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const baseFilename = (exportFilename || title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleDownloadPng = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);

    try {
      // Find the primary recharts SVG in container
      const svg = containerRef.current.querySelector('svg');
      if (!svg) {
        toast.error('Could not locate chart graphic to export.');
        setIsExporting(false);
        return;
      }

      const rect = svg.getBoundingClientRect();
      const width = rect.width || 900;
      const height = rect.height || 500;

      // Clone SVG and ensure required attributes
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('width', String(width));
      clonedSvg.setAttribute('height', String(height));

      // Insert solid white background as first element if not present
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', '#ffffff');
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const scale = 2; // 2x resolution for retina display
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          toast.error('Canvas rendering is not supported on this browser.');
          URL.revokeObjectURL(url);
          setIsExporting(false);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${baseFilename || 'chart'}.png`;
        link.href = pngUrl;
        link.click();

        URL.revokeObjectURL(url);
        setIsExporting(false);
        toast.success('Chart image downloaded (PNG).');
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
        toast.error('Failed to render chart image.');
      };

      img.src = url;
    } catch (err) {
      console.error('PNG export error:', err);
      setIsExporting(false);
      toast.error('Error generating image export.');
    }
  };

  const handleExportCsv = () => {
    if (!csvData || csvData.length === 0) {
      toast.error('No table data available for this chart.');
      return;
    }

    try {
      const headers = Object.keys(csvData[0]);
      const csvRows = [
        headers.join(','),
        ...csvData.map((row) =>
          headers
            .map((header) => {
              const val = row[header];
              const escaped = ('' + (val ?? '')).replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(',')
        ),
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${baseFilename || 'chart-data'}.csv`);
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Chart data exported (CSV).');
    } catch (err) {
      console.error('CSV export error:', err);
      toast.error('Failed to export CSV data.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-6 sm:p-8 flex flex-col max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4 pr-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <DialogTitle className="text-xl font-bold text-zinc-950 tracking-tight">
                {title}
              </DialogTitle>
              {badge}
            </div>
            {description && (
              <DialogDescription className="text-sm text-zinc-500 max-w-2xl">
                {description}
              </DialogDescription>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {csvData && csvData.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                className="gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200 shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                Export CSV
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={handleDownloadPng}
              className="gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 border-zinc-200 shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              {isExporting ? 'Exporting...' : 'Download Image'}
            </Button>
          </div>
        </DialogHeader>

        <div
          ref={containerRef}
          className="mt-4 flex-1 w-full min-h-[460px] h-[520px] flex flex-col justify-center bg-zinc-50/40 rounded-xl p-4 border border-zinc-100/80"
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
