'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRect: DOMRect | null;
  setTriggerRect: (rect: DOMRect | null) => void;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({
  children,
  open: controlledOpen,
  onOpenChange,
  delayDuration = 150,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (nextOpen) {
        timeoutRef.current = setTimeout(() => {
          if (!isControlled) setUncontrolledOpen(true);
          onOpenChange?.(true);
        }, delayDuration);
      } else {
        if (!isControlled) setUncontrolledOpen(false);
        onOpenChange?.(false);
      }
    },
    [isControlled, onOpenChange, delayDuration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRect, setTriggerRect }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({
  children,
  asChild,
  className,
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const context = React.useContext(TooltipContext);
  const triggerRef = useRef<HTMLElement | null>(null);

  if (!context) throw new Error('TooltipTrigger must be used within Tooltip');

  const updateRect = () => {
    if (triggerRef.current) {
      context.setTriggerRect(triggerRef.current.getBoundingClientRect());
    }
  };

  const handleMouseEnter = () => {
    updateRect();
    context.setOpen(true);
  };

  const handleMouseLeave = () => {
    context.setOpen(false);
  };

  const handleFocus = () => {
    updateRect();
    context.setOpen(true);
  };

  const handleBlur = () => {
    context.setOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        const childRef = (children as any).ref;
        if (typeof childRef === 'function') childRef(node);
        else if (childRef) childRef.current = node;
      },
      onMouseEnter: (e: React.MouseEvent) => {
        (children as any).props?.onMouseEnter?.(e);
        handleMouseEnter();
      },
      onMouseLeave: (e: React.MouseEvent) => {
        (children as any).props?.onMouseLeave?.(e);
        handleMouseLeave();
      },
      onFocus: (e: React.FocusEvent) => {
        (children as any).props?.onFocus?.(e);
        handleFocus();
      },
      onBlur: (e: React.FocusEvent) => {
        (children as any).props?.onBlur?.(e);
        handleBlur();
      },
    });
  }

  return (
    <span
      ref={(node) => {
        triggerRef.current = node;
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('inline-flex items-center cursor-default', className)}
    >
      {children}
    </span>
  );
}

export function TooltipContent({
  children,
  className,
  side = 'top',
  sideOffset = 6,
}: {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}) {
  const context = React.useContext(TooltipContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!context || !context.open || !context.triggerRect || !mounted) return null;

  const rect = context.triggerRect;
  let top = 0;
  let left = 0;
  let transform = '';

  if (side === 'top') {
    top = rect.top - sideOffset;
    left = rect.left + rect.width / 2;
    transform = 'translate(-50%, -100%)';
  } else if (side === 'bottom') {
    top = rect.bottom + sideOffset;
    left = rect.left + rect.width / 2;
    transform = 'translate(-50%, 0)';
  } else if (side === 'left') {
    top = rect.top + rect.height / 2;
    left = rect.left - sideOffset;
    transform = 'translate(-100%, -50%)';
  } else if (side === 'right') {
    top = rect.top + rect.height / 2;
    left = rect.right + sideOffset;
    transform = 'translate(0, -50%)';
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform,
        zIndex: 9999,
      }}
      className={cn(
        'pointer-events-none max-w-xs rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 duration-100 font-normal leading-normal text-center',
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

/**
 * Convenient wrapper for single-line tooltip usage:
 * <SimpleTooltip content="Helpful tooltip text">
 *   <span>Hover me</span>
 * </SimpleTooltip>
 */
export function SimpleTooltip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
