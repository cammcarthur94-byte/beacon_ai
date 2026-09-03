'use client';

import * as React from 'react';
import Image from 'next/image';
import { Lock, ExternalLink, Globe } from 'lucide-react';
import { extractDomain } from '@/lib/citations/categorizer';

export interface AddressBarCitationProps {
  url?: string;
  domain?: string;
  size?: 'sm' | 'md';
  showExternalLink?: boolean;
  className?: string;
}

interface CitationUrlOptions {
  url?: string;
  domain?: string;
}

function resolveCitationDetails(options: CitationUrlOptions) {
  const { url, domain } = options;

  const cleanDomain = domain
    ? extractDomain(domain)
    : url
    ? extractDomain(url)
    : 'example.com';

  let displayPath = cleanDomain;
  if (url) {
    try {
      const full = url.startsWith('http') ? url : `https://${url}`;
      const parsed = new URL(full);
      const host = parsed.hostname.replace(/^www\./i, '');
      const path = parsed.pathname === '/' ? '' : parsed.pathname;
      displayPath = `${host}${path}`;
    } catch {
      displayPath = url.replace(/^https?:\/\/(www\.)?/i, '');
    }
  }

  const targetUrl = url
    ? url.startsWith('http')
      ? url
      : `https://${url}`
    : `https://${cleanDomain}`;

  return { cleanDomain, displayPath, targetUrl };
}

export function AddressBarCitation(props: AddressBarCitationProps) {
  const {
    url,
    domain,
    size = 'sm',
    showExternalLink = true,
    className = '',
  } = props;

  const [hasError, setHasError] = React.useState(false);

  const { cleanDomain, displayPath, targetUrl } = React.useMemo(
    () => resolveCitationDetails({ url, domain }),
    [url, domain]
  );

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200/90 text-zinc-800 shadow-2xs hover:bg-zinc-100 hover:border-zinc-300 transition-all text-xs group max-w-full ${
        size === 'md' ? 'h-8 px-3' : 'h-7'
      } ${className}`}
      title={`Visit ${targetUrl}`}
    >
      {/* SSL Lock Security Indicator */}
      <Lock className="h-3 w-3 text-emerald-600 shrink-0" />

      {/* Website Logo Favicon (as rendered in browser address bar) */}
      <div className="h-4 w-4 rounded-xs overflow-hidden shrink-0 flex items-center justify-center bg-white border border-zinc-200/60">
        {!hasError ? (
          <Image
            src={`https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64`}
            alt={`${cleanDomain} logo`}
            width={14}
            height={14}
            className="object-contain"
            onError={() => setHasError(true)}
            unoptimized
          />
        ) : (
          <Globe className="h-3 w-3 text-zinc-400" />
        )}
      </div>

      {/* Domain / Address text */}
      <span className="truncate max-w-[200px] sm:max-w-[280px] font-medium text-zinc-900 group-hover:text-emerald-700 transition-colors">
        {displayPath}
      </span>

      {showExternalLink && (
        <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-zinc-700 shrink-0 ml-0.5" />
      )}
    </a>
  );
}
