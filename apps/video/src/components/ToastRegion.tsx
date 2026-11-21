import { useStore } from '../store/AppStore';

/** Polite live region for local-action feedback in Skeuo Video. */
export function ToastRegion() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <p>{toast.message}</p>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
