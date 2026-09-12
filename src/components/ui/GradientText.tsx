import React from 'react';

export default function GradientText({ children, className = '' }: { children: React.ReactNode, className?: string, gradient?: string }) {
  return <span className={`text-[var(--accent)] font-medium ${className}`}>{children}</span>;
}
