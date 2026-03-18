// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="surface-card flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-slate-100/80 dark:bg-slate-800/80 mb-4 ring-1 ring-white/40 dark:ring-slate-700/60">
        <span className="material-symbols-outlined text-4xl text-slate-400">{icon}</span>
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-4"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
