'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within a Sheet');
  }
  return context;
}

interface SheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, defaultOpen = false, onOpenChange, children }: SheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  return (
    <SheetContext.Provider value={{ open: currentOpen, setOpen: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { setOpen } = useSheet();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        setOpen(true);
      }
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          (children as React.ReactElement<any>).props.onClick?.(e);
          handleClick(e);
        },
      });
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
SheetTrigger.displayName = 'SheetTrigger';

interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const SheetClose = React.forwardRef<HTMLButtonElement, SheetCloseProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { setOpen } = useSheet();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!e.defaultPrevented) {
        setOpen(false);
      }
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          (children as React.ReactElement<any>).props.onClick?.(e);
          handleClick(e);
        },
      });
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
SheetClose.displayName = 'SheetClose';

const sheetVariants = cva(
  'fixed z-50 bg-white shadow-2xl transition-all ease-in-out duration-300 flex flex-col',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b border-zinc-200 animate-in slide-in-from-top',
        bottom: 'inset-x-0 bottom-0 border-t border-zinc-200 animate-in slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-full max-w-md border-r border-zinc-200 animate-in slide-in-from-left',
        right: 'inset-y-0 right-0 h-full w-full max-w-lg border-l border-zinc-200 animate-in slide-in-from-right',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sheetVariants> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => {
    const { open, setOpen } = useSheet();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    // Close on Escape key
    React.useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, setOpen]);

    // Prevent body scroll when open
    React.useEffect(() => {
      if (open) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }, [open]);

    if (!mounted || !open) return null;

    const sheetElement = (
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
        {/* Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding Panel */}
        <div ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
          {children}

          {/* Close Icon Button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-sm p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    );

    return createPortal(sheetElement, document.body);
  }
);
SheetContent.displayName = 'SheetContent';

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6 border-b border-zinc-100 text-left', className)}
      {...props}
    />
  );
}
SheetHeader.displayName = 'SheetHeader';

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}
SheetFooter.displayName = 'SheetFooter';

export const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-base font-semibold text-zinc-950 tracking-tight', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

export const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-zinc-500', className)} {...props} />
));
SheetDescription.displayName = 'SheetDescription';
