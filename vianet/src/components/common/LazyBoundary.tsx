import { Suspense, type ComponentType, type ReactNode, type SuspenseProps } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { PageSkeleton } from './PageSkeleton';

interface LazyBoundaryProps {
  children: React.ReactNode;
  fallback?: SuspenseProps['fallback'];
  isolate?: boolean;
  onError?: (error: Error, errorInfo: any) => void;
}

export function LazyBoundary({
  children,
  fallback,
  isolate = false,
  onError,
}: LazyBoundaryProps) {
  return (
    <ErrorBoundary isolate={isolate} onError={onError}>
      <Suspense fallback={fallback ?? <PageSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export function withLazyBoundary<P extends object>(
  Component: ComponentType<P>,
  options?: { fallback?: React.ReactNode; isolate?: boolean }
) {
  const Wrapped = (props: P) => (
    <LazyBoundary fallback={options?.fallback} isolate={options?.isolate}>
      <Component {...props} />
    </LazyBoundary>
  );
  Wrapped.displayName = `withLazyBoundary(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}