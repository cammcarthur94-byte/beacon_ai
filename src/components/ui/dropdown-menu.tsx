'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be inside DropdownMenu');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.setOpen((prev) => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        (children as React.ReactElement<any>).props.onClick?.(e);
        handleClick(e);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn('inline-flex items-center justify-center', className)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = 'start',
  className,
  children,
}: {
  align?: 'start' | 'end' | 'center';
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(DropdownMenuContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        context?.setOpen(false);
      }
    };
    if (context?.open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [context?.open]);

  if (!context?.open) return null;

  const alignClass =
    align === 'end'
      ? 'right-0'
      : align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'left-0';

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-slate-950 font-sans shadow-md animate-in fade-in-80',
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  children,
  className,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
    context?.setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2.5 py-1.5 text-xs font-sans font-medium text-slate-800 outline-hidden hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950 transition-colors',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-2.5 py-1 text-[11px] font-sans font-semibold text-slate-500 uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-slate-100', className)} />;
}
