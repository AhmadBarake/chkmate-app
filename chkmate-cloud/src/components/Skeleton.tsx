import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton with pulse animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-slate-700/50',
        className
      )}
    />
  );
}

/**
 * Text skeleton - single line placeholder
 */
interface SkeletonTextProps {
  className?: string;
  width?: 'full' | '3/4' | '1/2' | '1/4' | '1/3' | '2/3';
}

export function SkeletonText({ className, width = 'full' }: SkeletonTextProps) {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4',
    '1/3': 'w-1/3',
    '2/3': 'w-2/3',
  };

  return (
    <Skeleton className={cn('h-4', widthClasses[width], className)} />
  );
}

/**
 * Heading skeleton - larger text placeholder
 */
export function SkeletonHeading({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-7 w-48', className)} />;
}

/**
 * Avatar/icon skeleton - circular placeholder
 */
interface SkeletonAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SkeletonAvatar({ className, size = 'md' }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
}

/**
 * Button skeleton
 */
interface SkeletonButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SkeletonButton({ className, size = 'md' }: SkeletonButtonProps) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-28',
    lg: 'h-12 w-36',
  };

  return (
    <Skeleton className={cn('rounded-lg', sizeClasses[size], className)} />
  );
}

/**
 * Card skeleton - full card placeholder
 */
interface SkeletonCardProps {
  className?: string;
  hasIcon?: boolean;
  lines?: number;
}

export function SkeletonCard({ className, hasIcon = true, lines = 2 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-slate-900/30 border border-slate-800 p-6 rounded-xl',
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        {hasIcon && <Skeleton className="w-8 h-8 rounded" />}
        <Skeleton className="w-20 h-4 rounded" />
      </div>
      <Skeleton className="h-6 w-3/4 rounded mb-2" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4 rounded mt-2', i === lines - 1 ? 'w-1/2' : 'w-full')}
        />
      ))}
    </div>
  );
}

/**
 * Stats card skeleton
 */
export function SkeletonStatsCard({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-slate-900/30 border border-slate-800 p-6 rounded-xl',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-16 h-4 rounded" />
      </div>
      <Skeleton className="h-8 w-16 rounded mb-1" />
      <Skeleton className="h-4 w-24 rounded" />
    </div>
  );
}

/**
 * Table row skeleton
 */
interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

export function SkeletonTableRow({ columns = 4, className }: SkeletonTableRowProps) {
  return (
    <div className={cn('flex items-center gap-4 py-4 border-b border-slate-800', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 rounded',
            i === 0 ? 'w-32' : i === columns - 1 ? 'w-20' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Code block skeleton
 */
export function SkeletonCode({ className, lines = 8 }: { className?: string; lines?: number }) {
  return (
    <div className={cn('bg-slate-900 rounded-lg p-4 font-mono', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 rounded mb-2',
            // Vary widths for realistic code appearance
            i % 4 === 0 ? 'w-3/4' : i % 3 === 0 ? 'w-1/2' : i % 2 === 0 ? 'w-5/6' : 'w-2/3'
          )}
        />
      ))}
    </div>
  );
}

/**
 * Diagram skeleton (for architecture visualization)
 */
export function SkeletonDiagram({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-slate-900/50 rounded-lg p-8 relative min-h-[300px]', className)}>
      {/* Nodes */}
      <div className="absolute top-8 left-1/4">
        <Skeleton className="w-24 h-16 rounded-lg" />
      </div>
      <div className="absolute top-8 right-1/4">
        <Skeleton className="w-24 h-16 rounded-lg" />
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Skeleton className="w-24 h-16 rounded-lg" />
      </div>
      {/* Connection lines */}
      <div className="absolute top-16 left-1/3 w-1/3 h-0.5 bg-slate-700/30" />
      <div className="absolute top-24 left-1/2 w-0.5 h-24 bg-slate-700/30" />
    </div>
  );
}

export default Skeleton;
