'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextValue {
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export function Select({
  value,
  onValueChange,
  defaultValue = '',
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onValueChange?.(val);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
      }}
    >
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within a Select');

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.setOpen((prev) => !prev)}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-sans font-medium text-slate-900 shadow-2xs placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-2 shrink-0" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  return (
    <span className={cn('truncate font-sans', !context.value && 'text-slate-400')}>
      {context.value || placeholder}
    </span>
  );
}

export function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(SelectContext);
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

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 font-sans shadow-md animate-in fade-in-80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) return null;

  const isSelected = context.value === value;

  return (
    <div
      onClick={() => context.onValueChange(value)}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2.5 py-1.5 text-xs font-sans font-medium outline-hidden hover:bg-slate-100 focus:bg-slate-100 data-disabled:pointer-events-none data-disabled:opacity-50 text-slate-800',
        isSelected && 'bg-slate-50 font-semibold text-slate-950',
        className
      )}
    >
      <span>{children}</span>
      {isSelected && <Check className="h-3.5 w-3.5 text-slate-900 ml-2" />}
    </div>
  );
}
