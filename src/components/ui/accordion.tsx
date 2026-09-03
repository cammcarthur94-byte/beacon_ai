'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

export function Accordion({
  type = 'single',
  defaultValue,
  children,
  className,
}: {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value];
      } else {
        return prev.includes(value)
          ? prev.filter((item) => item !== value)
          : [...prev, value];
      }
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200 bg-white overflow-hidden transition-all shadow-xs',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { itemValue: value });
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  itemValue,
  children,
  className,
}: {
  itemValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context || !itemValue) return null;

  const isOpen = context.openItems.includes(itemValue);

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemValue)}
      className={cn(
        'flex w-full items-center justify-between p-4 text-sm font-medium text-left transition-colors hover:bg-zinc-50 cursor-pointer text-zinc-900',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ml-3',
          isOpen && 'rotate-180 text-zinc-900'
        )}
      />
    </button>
  );
}

export function AccordionContent({
  itemValue,
  children,
  className,
}: {
  itemValue?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(AccordionContext);
  if (!context || !itemValue) return null;

  const isOpen = context.openItems.includes(itemValue);
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'p-4 pt-0 text-sm border-t border-zinc-100 bg-zinc-50/50 text-zinc-700',
        className
      )}
    >
      {children}
    </div>
  );
}
