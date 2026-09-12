import React from 'react';

type GlassCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: string;
  hover?: boolean;
  onClick?: () => void;
};

export default function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-sm hover:border-[var(--border-hover)] transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
