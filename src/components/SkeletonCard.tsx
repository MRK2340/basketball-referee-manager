import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const SkeletonBox = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

export const SkeletonGameCard = () => (
  <Card className="glass-effect border-slate-200 shadow-xs">
    <CardContent className="p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 space-y-3">
          <SkeletonBox className="h-5 w-3/4" />
          <SkeletonBox className="h-4 w-1/2" />
          <div className="flex gap-3">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-4 w-28" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SkeletonBox className="h-8 w-16" />
          <SkeletonBox className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const SkeletonStatCard = () => (
  <Card className="glass-effect border-slate-200 shadow-xs">
    <CardContent className="p-5">
      <div className="flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-6 w-16" />
        </div>
        <SkeletonBox className="h-11 w-11 rounded-2xl" />
      </div>
    </CardContent>
  </Card>
);

export const SkeletonTableRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-100">
    <SkeletonBox className="h-8 w-8 rounded-full" />
    <SkeletonBox className="h-4 flex-1 max-w-xs" />
    <SkeletonBox className="h-4 w-20" />
    <SkeletonBox className="h-4 w-16" />
    <SkeletonBox className="h-8 w-24 rounded-md ml-auto" />
  </div>
);

export const SkeletonMessage = () => (
  <div className="p-4 border-b border-slate-100 space-y-2">
    <div className="flex items-center gap-3">
      <SkeletonBox className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-3 w-24" />
      </div>
    </div>
    <SkeletonBox className="h-4 w-3/4 ml-13" />
  </div>
);

const SkeletonCard = ({ variant = 'game', count = 3 }: { variant?: string; count?: number }) => {
  const Component = {
    game: SkeletonGameCard,
    stat: SkeletonStatCard,
    table: SkeletonTableRow,
    message: SkeletonMessage,
  }[variant] || SkeletonGameCard;

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => <Component key={i} />)}
    </div>
  );
};

export default SkeletonCard;
