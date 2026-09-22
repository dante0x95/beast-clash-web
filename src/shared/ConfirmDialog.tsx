import { type ReactNode, useEffect, useId, useRef } from "react";

import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  readonly children: ReactNode;
  readonly confirmLabel: string;
  readonly error: string | null;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
}

/**
 * Native modal <dialog>: focus trap, Esc and an inert background come from the browser.
 * Mount it only while it should be open; it opens itself on mount.
 */
export function ConfirmDialog({
  children,
  confirmLabel,
  error,
  isPending,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      aria-labelledby={titleId}
      className="confirm-dialog"
      onCancel={(event) => {
        // Esc must not abandon a request in flight
        if (isPending) event.preventDefault();
      }}
      onClose={onCancel}
      ref={ref}
    >
      <h2 className="confirm-dialog__title" id={titleId}>
        {title}
      </h2>
      <div className="confirm-dialog__body">{children}</div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="confirm-dialog__actions">
        <button
          autoFocus
          className="button button--secondary"
          disabled={isPending}
          onClick={() => {
            ref.current?.close();
          }}
          type="button"
        >
          Cancel
        </button>
        <button
          className="button button--danger"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
