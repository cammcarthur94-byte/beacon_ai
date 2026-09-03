'use client';

import * as React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Bot, Sparkles } from 'lucide-react';

export function getEngineMeta(engineName: string) {
  const e = (engineName || '').toLowerCase().trim();

  if (e.includes('chatgpt') || e.includes('openai') || e.includes('gpt')) {
    return {
      id: 'chatgpt',
      domain: 'openai.com',
      label: 'ChatGPT',
      colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-600',
      containerClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      dotColor: '#10a37f',
    };
  }
  if (e.includes('ai_overview') || e.includes('overview') || e === 'google_ai_overview') {
    return {
      id: 'google_ai_overview',
      domain: 'google.com',
      label: 'Google AI Overview',
      colorClass: 'border-blue-200 bg-blue-50 text-blue-900',
      badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
      iconColor: 'text-blue-600',
      containerClass: 'bg-blue-50 text-blue-800 border-blue-200/80',
      dotColor: '#4285F4',
    };
  }
  if (e.includes('ai_mode') || e.includes('aimode') || e === 'google_ai_mode') {
    return {
      id: 'google_ai_mode',
      domain: 'google.com',
      label: 'Google AI Mode',
      colorClass: 'border-violet-200 bg-violet-50 text-violet-900',
      badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
      iconColor: 'text-violet-600',
      containerClass: 'bg-violet-50 text-violet-800 border-violet-200/80',
      dotColor: '#7C3AED',
    };
  }
  if (e.includes('gemini') || e.includes('google')) {
    return {
      id: 'gemini',
      domain: 'gemini.google.com',
      label: 'Gemini',
      colorClass: 'border-blue-200 bg-blue-50 text-blue-800',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
      containerClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
      dotColor: '#1a73e8',
    };
  }
  if (e.includes('claude') || e.includes('anthropic')) {
    return {
      id: 'claude',
      domain: 'claude.ai',
      label: 'Claude',
      colorClass: 'border-amber-200 bg-amber-50 text-amber-800',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-600',
      containerClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      dotColor: '#d97706',
    };
  }
  if (e.includes('perplexity') || e.includes('sonar')) {
    return {
      id: 'perplexity',
      domain: 'perplexity.ai',
      label: 'Perplexity',
      colorClass: 'border-cyan-200 bg-cyan-50 text-cyan-800',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      iconColor: 'text-cyan-700',
      containerClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      dotColor: '#06b6d4',
    };
  }
  if (e.includes('copilot') || e.includes('bing') || e.includes('microsoft')) {
    return {
      id: 'copilot',
      domain: 'copilot.microsoft.com',
      label: 'Microsoft Copilot',
      colorClass: 'border-blue-200 bg-blue-50 text-blue-800',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-600',
      containerClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
      dotColor: '#0078D4',
    };
  }

  return {
    id: 'unknown',
    domain: 'google.com',
    label: engineName || 'AI Engine',
    colorClass: 'border-zinc-200 bg-zinc-50 text-zinc-700',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    iconColor: 'text-zinc-700',
    containerClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dotColor: '#71717a',
  };
}

export interface EngineIconProps {
  engine: string;
  size?: number;
  className?: string;
}

export function EngineIcon({
  engine,
  size = 20,
  className = '',
}: EngineIconProps) {
  const e = (engine || '').toLowerCase().trim();

  if (e.includes('chatgpt') || e.includes('openai') || e.includes('gpt')) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <title>ChatGPT</title>
        <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
      </svg>
    );
  }

  if (e.includes('perplexity') || e.includes('sonar')) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <title>Perplexity</title>
        <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
      </svg>
    );
  }

  if (e.includes('claude') || e.includes('anthropic')) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <title>Claude</title>
        <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
      </svg>
    );
  }

  if (e.includes('ai_overview') || e.includes('overview') || e === 'google_ai_overview') {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <title>Google AI Overview</title>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="m11 8 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (e.includes('ai_mode') || e.includes('aimode') || e === 'google_ai_mode') {
    return (
      <Sparkles
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
      />
    );
  }

  if (e.includes('gemini') || e.includes('google')) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <title>Google Gemini</title>
        <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
      </svg>
    );
  }

  if (e.includes('copilot') || e.includes('bing') || e.includes('microsoft')) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <title>Microsoft Copilot</title>
        <path d="M11.494 2.164a3.896 3.896 0 00-3.328 1.956L1.83 14.884a3.893 3.893 0 00.412 4.38 3.897 3.897 0 004.423 1.033l1.83-.812-.862-2.118-1.831.812a1.621 1.621 0 01-1.844-.43 1.621 1.621 0 01-.172-1.825l6.335-10.764a1.62 1.62 0 011.386-.814 1.62 1.62 0 011.386.814l2.128 3.616 2.015-1.164-2.128-3.616a3.895 3.895 0 00-3.328-1.956l-.559.324.559-.324zm6.173 8.358l-2.015 1.164 3.013 5.12c.394.67.318 1.517-.172 1.825a1.62 1.62 0 01-1.844.43l-4.526-2.008a1.621 1.621 0 01-.984-1.488V12.44H8.86v3.125a3.896 3.896 0 002.361 3.571l4.526 2.008a3.895 3.895 0 004.423-1.033 3.894 3.894 0 00.412-4.38l-2.915-4.954z" />
      </svg>
    );
  }

  return <Bot width={size} height={size} className={className} aria-hidden="true" />;
}

interface EngineFaviconProps {
  engine: string;
  size?: number;
  className?: string;
}

export function EngineFavicon({ engine, size = 14, className = '' }: EngineFaviconProps) {
  const [hasError, setHasError] = useState(false);
  const meta = getEngineMeta(engine);

  if (meta.id !== 'unknown') {
    return (
      <div
        className={`rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-white shadow-2xs border border-zinc-200/60 p-0.5 ${className}`}
        style={{ width: size + 2, height: size + 2 }}
        title={meta.label}
      >
        <EngineIcon engine={engine} size={size} className={meta.iconColor} />
      </div>
    );
  }

  if (hasError) {
    return (
      <span
        className={`inline-block rounded-full shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: meta.dotColor,
        }}
      />
    );
  }

  return (
    <div
      className={`rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-white shadow-2xs border border-zinc-200/60 ${className}`}
      style={{ width: size + 2, height: size + 2 }}
    >
      <Image
        src={`https://www.google.com/s2/favicons?domain=${meta.domain}&sz=32`}
        alt={`${meta.label} icon`}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}

interface EngineBadgeProps {
  engine: string;
  showFavicon?: boolean;
  showLabel?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function EngineBadge({
  engine,
  showFavicon = true,
  showLabel = true,
  className = '',
  size = 'xs',
}: EngineBadgeProps) {
  const meta = getEngineMeta(engine);
  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : 16;
  const paddingClass = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium border shadow-2xs transition-colors ${meta.colorClass} ${paddingClass} ${className}`}
    >
      {showFavicon && <EngineFavicon engine={engine} size={iconSize} />}
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
