import React, { ForwardedRef, forwardRef, PropsWithChildren, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";

interface DialogContentProps
  extends DialogPrimitive.DialogContentProps,
    React.RefAttributes<HTMLDivElement> {
  className?: string;
}

export const DialogContent = forwardRef(
  (
    { className = "", children, ...props }: PropsWithChildren<DialogContentProps>,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          ref={overlayRef}
          className="fixed inset-0 z-30 animate-overlay-show bg-black bg-opacity-50"
        />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => {
            e.preventDefault();
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={twMerge(
            "fixed top-1/2 left-1/2 z-40 max-h-[85vh] w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 transform animate-content-show-dialog rounded-[10px] bg-white p-4 shadow focus:outline-none",
            className
          )}
          {...props}
          ref={forwardedRef}
        >
          <DialogPrimitive.Close
            className="absolute ltr:right-6 rtl:left-6 top-5 cursor-pointer"
            aria-label="Close"
            asChild
          >
            x
          </DialogPrimitive.Close>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }
);

DialogContent.displayName = "DialogContent";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
