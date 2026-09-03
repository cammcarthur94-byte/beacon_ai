'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { extractDomain, categorizeSource } from '@/lib/citations/categorizer';
import type { CitationSourceType } from '@/types/database.types';
import {
  Globe,
  Newspaper,
  MessageSquare,
  FileText,
  BookOpen,
  Share2,
} from 'lucide-react';

interface DomainFaviconProps {
  domain?: string;
  url?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE_MAP = {
  xs: {
    container: 'h-4 w-4',
    img: 12,
    icon: 'h-3 w-3',
  },
  sm: {
    container: 'h-4.5 w-4.5',
    img: 14,
    icon: 'h-3.5 w-3.5',
  },
  md: {
    container: 'h-6 w-6',
    img: 18,
    icon: 'h-4 w-4',
  },
};

/**
 * Renders the respected source icon based on CitationSourceType:
 * news -> Newspaper
 * forum -> MessageSquare
 * blog -> FileText
 * documentation -> BookOpen
 * social -> Share2
 * other -> Globe
 */
export function CitationSourceIcon({
  sourceType,
  className,
}: {
  sourceType: CitationSourceType;
  className?: string;
}) {
  const iconClass = cn('shrink-0', className);

  switch (sourceType) {
    case 'news':
      return <Newspaper className={iconClass} />;
    case 'forum':
      return <MessageSquare className={iconClass} />;
    case 'blog':
      return <FileText className={iconClass} />;
    case 'documentation':
      return <BookOpen className={iconClass} />;
    case 'social':
      return <Share2 className={iconClass} />;
    default:
      return <Globe className={iconClass} />;
  }
}

/**
 * Unified Domain Favicon component:
 * Fetches high-resolution favicon for the domain and falls back to the respected source category icon.
 */
export function DomainFavicon({
  domain,
  url,
  size = 'sm',
  className,
}: DomainFaviconProps) {
  const [hasError, setHasError] = useState(false);

  const cleanDomain = React.useMemo(() => {
    if (domain) return extractDomain(domain);
    if (url) return extractDomain(url);
    return '';
  }, [domain, url]);

  const sourceType = React.useMemo(() => {
    return cleanDomain ? categorizeSource(cleanDomain, url) : 'other';
  }, [cleanDomain, url]);

  const dimensions = SIZE_MAP[size] || SIZE_MAP.sm;

  if (!cleanDomain || hasError) {
    return (
      <div
        className={cn(
          'rounded shrink-0 flex items-center justify-center bg-zinc-100 border border-zinc-200/80 text-zinc-500',
          dimensions.container,
          className
        )}
      >
        <CitationSourceIcon sourceType={sourceType} className={dimensions.icon} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded shrink-0 overflow-hidden flex items-center justify-center bg-zinc-50 border border-zinc-200/80 shadow-2xs',
        dimensions.container,
        className
      )}
    >
      <Image
        src={`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`}
        alt={`${cleanDomain} icon`}
        width={dimensions.img}
        height={dimensions.img}
        className="object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}
