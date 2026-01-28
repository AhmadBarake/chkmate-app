import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';
import Button from './Button';

interface EmptyStateProps {
  /** Icon to display (Lucide icon component) */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button label */
  actionLabel?: string;
  /** Primary action click handler */
  onAction?: () => void;
  /** Secondary action button label */
  secondaryActionLabel?: string;
  /** Secondary action click handler */
  onSecondaryAction?: () => void;
  /** Additional class names */
  className?: string;
  /** Compact mode (less padding) */
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'bg-slate-900/30 rounded-xl border border-slate-800 border-dashed',
        compact ? 'py-12 px-6' : 'py-20 px-8',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-slate-500">
          <div className="w-12 h-12 flex items-center justify-center">{icon}</div>
        </div>
      )}

      <h3 className={cn('font-semibold text-slate-200', compact ? 'text-lg' : 'text-xl')}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-slate-400 max-w-sm', compact ? 'mt-1 text-sm' : 'mt-2')}>
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className={cn('flex items-center gap-3', compact ? 'mt-4' : 'mt-6')}>
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="primary" size={compact ? 'sm' : 'md'}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onClick={onSecondaryAction}
              variant="ghost"
              size={compact ? 'sm' : 'md'}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common use cases
 */

interface PresetEmptyStateProps {
  onAction?: () => void;
  className?: string;
}

export function EmptyProjects({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
          />
        </svg>
      }
      title="No projects yet"
      description="Create your first project to start generating infrastructure templates."
      actionLabel="Create Project"
      onAction={onAction}
      className={className}
    />
  );
}

export function EmptyTemplates({ onAction, className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      }
      title="No templates yet"
      description="Generate your first infrastructure template with AI."
      actionLabel="New Template"
      onAction={onAction}
      className={className}
    />
  );
}

export function EmptySearch({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      }
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for."
      className={className}
      compact
    />
  );
}
