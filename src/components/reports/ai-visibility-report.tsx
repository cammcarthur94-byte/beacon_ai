'use client';

import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Link2,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface VisibilityRecommendation {
  target: string;
  diagnosis: string;
  action: string;
  impact: string;
}

export interface AiVisibilityReportData {
  brandName: string;
  dateRange: string;
  overallVisibilityScore: number;
  engineBreakdown: Array<{ engine: string; visibility: number }>;
  topPerformingPrompts: Array<{
    query: string;
    enginesAppearedIn: string[];
    sentiment: 'Positive' | 'Neutral' | 'Needs attention';
  }>;
  worstPerformingPrompts: Array<{
    query: string;
    enginesMissed: string[];
    competitorRecommended: string;
  }>;
  recommendations: VisibilityRecommendation[];
  linkVisibility?: {
    totalDirectLinks: number;
    brokenLinks: number;
    pricingAccuracy: number;
    topLinkedProducts: Array<{ name: string; linkCount: number }>;
  };
}

/** A realistic example report that can be replaced with an agency's client data. */
export const MOCK_AI_VISIBILITY_REPORT: AiVisibilityReportData = {
  brandName: 'GreenLeaf Packaging',
  dateRange: 'August 1–31, 2026',
  overallVisibilityScore: 68,
  engineBreakdown: [
    { engine: 'ChatGPT', visibility: 76 },
    { engine: 'Claude', visibility: 71 },
    { engine: 'Gemini', visibility: 62 },
    { engine: 'Copilot', visibility: 66 },
    { engine: 'Perplexity', visibility: 59 },
    { engine: 'Google AI Overviews', visibility: 74 },
  ],
  topPerformingPrompts: [
    {
      query: 'Best compostable mailers for growing online shops',
      enginesAppearedIn: ['ChatGPT', 'Claude', 'Google AI Overviews'],
      sentiment: 'Positive',
    },
    {
      query: 'Reliable recycled shipping boxes for small businesses',
      enginesAppearedIn: ['ChatGPT', 'Gemini', 'Copilot', 'Perplexity'],
      sentiment: 'Positive',
    },
    {
      query: 'Custom sustainable packaging made in the USA',
      enginesAppearedIn: ['ChatGPT', 'Claude', 'Google AI Overviews'],
      sentiment: 'Positive',
    },
    {
      query: 'Packaging suppliers with low minimum order quantities',
      enginesAppearedIn: ['Claude', 'Copilot', 'Google AI Overviews'],
      sentiment: 'Neutral',
    },
    {
      query: 'Plastic-free packaging ideas for subscription brands',
      enginesAppearedIn: ['ChatGPT', 'Gemini', 'Claude'],
      sentiment: 'Positive',
    },
  ],
  worstPerformingPrompts: [
    {
      query: 'Best eco-friendly packaging on Gemini',
      enginesMissed: ['Gemini', 'Perplexity'],
      competitorRecommended: 'EcoShip Co.',
    },
    {
      query: 'Affordable packaging for local businesses',
      enginesMissed: ['Perplexity', 'Copilot'],
      competitorRecommended: 'PackRight',
    },
    {
      query: 'Where can I buy recyclable product boxes?',
      enginesMissed: ['Gemini', 'Google AI Overviews'],
      competitorRecommended: 'BoxKind',
    },
    {
      query: 'Best packaging partner for a small cosmetics brand',
      enginesMissed: ['ChatGPT', 'Perplexity'],
      competitorRecommended: 'PurePack',
    },
    {
      query: 'Sustainable packaging with fast delivery',
      enginesMissed: ['Claude', 'Copilot', 'Google AI Overviews'],
      competitorRecommended: 'SwiftWrap',
    },
  ],
  recommendations: [
    {
      target: "'Best eco-friendly packaging' on Gemini",
      diagnosis:
        "Your website doesn't directly answer this specific question, and popular industry blogs aren't mentioning your brand.",
      action:
        "Add a clear 'Frequently Asked Questions' section to your product pages and reach out to sustainability bloggers to get featured in their 'Top 10' lists.",
      impact:
        'AI engines learn by reading trusted websites. If other sites recommend you and your own site clearly answers common questions, AI is much more likely to suggest your brand to customers.',
    },
    {
      target: "'Affordable CRM for local businesses' on Perplexity",
      diagnosis:
        'Competitors are showing up instead because they have more customer reviews and detailed comparison pages.',
      action:
        'Ask your happy customers to leave reviews on platforms like Trustpilot or Google, and create a page on your site comparing your features to your biggest competitors.',
      impact:
        'AI search engines constantly scan customer reviews to figure out which products are genuinely popular and reliable.',
    },
    {
      target: "'Sustainable packaging with fast delivery' across Copilot and Claude",
      diagnosis:
        'Your delivery times are hard to find, so customers and AI search tools cannot easily tell how quickly you can help.',
      action:
        'Add a simple delivery timeline to every product page, include your shipping regions, and publish a short guide about planning packaging for a product launch.',
      impact:
        'Clear, helpful details make it easier for trusted websites and AI search tools to understand when your business is the right recommendation.',
    },
  ],
  linkVisibility: {
    totalDirectLinks: 14,
    brokenLinks: 2,
    pricingAccuracy: 85,
    topLinkedProducts: [
      { name: 'Organic Cotton T-Shirt', linkCount: 8 },
      { name: 'Recycled Canvas Tote', linkCount: 4 },
      { name: 'Compostable Mailer Pack', linkCount: 2 },
    ],
  },
};

type Html2PdfInstance = {
  set: (options: Record<string, unknown>) => Html2PdfInstance;
  from: (element: HTMLElement) => Html2PdfInstance;
  save: () => Promise<void>;
};

type Html2PdfFactory = () => Html2PdfInstance;

declare global {
  interface Window {
    html2pdf?: Html2PdfFactory;
  }
}

let html2PdfLoader: Promise<Html2PdfFactory> | null = null;

function loadHtml2Pdf(): Promise<Html2PdfFactory> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PDF export is only available in a browser.'));
  }
  if (window.html2pdf) return Promise.resolve(window.html2pdf);
  if (html2PdfLoader) return html2PdfLoader;

  html2PdfLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-html2pdf]');
    if (existingScript) {
      existingScript.addEventListener('load', () => window.html2pdf ? resolve(window.html2pdf) : reject(new Error('PDF export library did not load.')));
      existingScript.addEventListener('error', () => reject(new Error('PDF export library failed to load.')));
      return;
    }

    const script = document.createElement('script');
    script.dataset.html2pdf = 'true';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    script.onload = () => window.html2pdf ? resolve(window.html2pdf) : reject(new Error('PDF export library did not load.'));
    script.onerror = () => reject(new Error('PDF export library failed to load.'));
    document.head.appendChild(script);
  });

  return html2PdfLoader;
}

function formatEngineList(engines: string[]) {
  return engines.join(', ');
}

export interface AiVisibilityReportProps {
  data?: AiVisibilityReportData;
  agencyName?: string;
}

export function AiVisibilityReport({
  data = MOCK_AI_VISIBILITY_REPORT,
  agencyName = 'Beacon Agency',
}: AiVisibilityReportProps) {
  const reportRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      await html2pdf()
        .set({
          margin: [0.35, 0.35, 0.35, 0.35],
          filename: `${data.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ai-visibility-report.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(reportRef.current)
        .save();
    } catch (error) {
      console.warn('PDF download was unavailable; opening the browser print dialog instead.', error);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 sm:px-6 print:bg-white print:p-0">
      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={isExporting}
        className="no-print fixed right-5 top-5 z-50 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Preparing PDF...' : 'Download as PDF'}
      </button>

      <div ref={reportRef} className="mx-auto max-w-[800px] bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10 print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="border-b border-slate-200 pb-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">AI Visibility Report</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{data.brandName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {data.dateRange}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Prepared by {agencyName}</span>
              </div>
            </div>
            <div className="flex h-16 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Agency logo
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
            A clear view of how often six popular AI search tools recommend your business, where you are already standing out, and where a few focused marketing actions can help.
          </p>
        </header>

        <section className="print-break-inside-avoid py-8" aria-labelledby="summary-heading">
          <div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-emerald-600" /><h2 id="summary-heading" className="text-xl font-bold text-slate-950">1. Executive Summary</h2></div>
          <div className="grid gap-4 sm:grid-cols-[1fr_1.5fr]">
            <div className="rounded-xl bg-emerald-700 p-6 text-white">
              <p className="text-sm font-medium text-emerald-100">Overall AI visibility</p>
              <p className="mt-2 text-6xl font-bold tracking-tight">{data.overallVisibilityScore}%</p>
              <p className="mt-3 text-sm leading-5 text-emerald-100">Your brand appears in about two out of every three tracked AI recommendations.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start gap-3"><TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><h3 className="font-bold text-slate-950">A solid foundation with room to grow</h3><p className="mt-2 text-sm leading-6 text-slate-600">GreenLeaf Packaging is already visible across the major AI search tools. The biggest opportunity is making your strongest answers easier to find and earning more mentions from trusted industry websites.</p></div></div>
            </div>
          </div>
        </section>

        <section className="print-break-inside-avoid border-t border-slate-200 py-8" aria-labelledby="engines-heading">
          <div className="mb-1 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><h2 id="engines-heading" className="text-xl font-bold text-slate-950">2. Visibility by AI Search Tool</h2></div>
          <p className="mb-5 text-sm text-slate-600">The percentage of tracked searches where each tool recommended {data.brandName}.</p>
          <div className="h-[300px] w-full print:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.engineBreakdown} margin={{ top: 8, right: 10, left: -18, bottom: 55 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="engine" angle={-28} textAnchor="end" interval={0} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value}%`, 'Visibility']} contentStyle={{ borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }} />
                <Bar dataKey="visibility" fill="#059669" radius={[5, 5, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="print-break-inside-avoid border-t border-slate-200 py-8" aria-labelledby="winning-heading">
          <div className="mb-5 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><h2 id="winning-heading" className="text-xl font-bold text-slate-950">3. Where You Are Winning</h2></div>
          <div className="overflow-hidden rounded-xl border border-emerald-100">
            <table className="w-full text-left text-sm"><thead className="bg-emerald-50 text-xs uppercase tracking-wide text-emerald-900"><tr><th className="px-4 py-3 font-bold">Search people make</th><th className="px-4 py-3 font-bold">Tools that recommended you</th><th className="px-4 py-3 font-bold">Tone</th></tr></thead><tbody className="divide-y divide-emerald-100 bg-white">{data.topPerformingPrompts.map((prompt) => <tr key={prompt.query} className="align-top"><td className="px-4 py-3.5 font-medium leading-5 text-slate-800">{prompt.query}</td><td className="px-4 py-3.5 leading-5 text-slate-600">{formatEngineList(prompt.enginesAppearedIn)}</td><td className="px-4 py-3.5"><span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{prompt.sentiment}</span></td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="print-break-inside-avoid border-t border-slate-200 py-8" aria-labelledby="blind-spots-heading">
          <div className="mb-5 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 id="blind-spots-heading" className="text-xl font-bold text-slate-950">4. Blind Spots &amp; Competitor Wins</h2></div>
          <div className="overflow-hidden rounded-xl border border-orange-100">
            <table className="w-full text-left text-sm"><thead className="bg-orange-50 text-xs uppercase tracking-wide text-orange-900"><tr><th className="px-4 py-3 font-bold">Search people make</th><th className="px-4 py-3 font-bold">Tools that missed you</th><th className="px-4 py-3 font-bold">Brand recommended instead</th></tr></thead><tbody className="divide-y divide-orange-100 bg-white">{data.worstPerformingPrompts.map((prompt) => <tr key={prompt.query} className="align-top"><td className="px-4 py-3.5 font-medium leading-5 text-slate-800">{prompt.query}</td><td className="px-4 py-3.5 leading-5 text-slate-600">{formatEngineList(prompt.enginesMissed)}</td><td className="px-4 py-3.5"><span className="inline-flex items-center gap-1 font-semibold text-orange-800">{prompt.competitorRecommended}<ArrowUpRight className="h-3.5 w-3.5" /></span></td></tr>)}</tbody></table>
          </div>
        </section>

        <section className="border-t border-slate-200 py-8" aria-labelledby="action-plan-heading">
          <div className="mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-blue-600" /><h2 id="action-plan-heading" className="text-xl font-bold text-slate-950">5. Action Plan</h2></div>
          <p className="mb-5 text-sm text-slate-600">Three practical ways to help more customers find GreenLeaf Packaging in AI search.</p>
          <div className="grid gap-4">{data.recommendations.map((recommendation, index) => <article key={recommendation.target} className="print-break-inside-avoid rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Priority {index + 1}</p><h3 className="mt-1 text-base font-bold text-slate-950">{recommendation.target}</h3></div><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span></div><div className="mt-5 grid gap-4 md:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">What&apos;s Happening</p><p className="mt-1.5 text-sm leading-6 text-slate-700">{recommendation.diagnosis}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">How to Fix It</p><p className="mt-1.5 text-sm leading-6 text-slate-700">{recommendation.action}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Why This Helps Your AI Searchability</p><p className="mt-1.5 text-sm leading-6 text-slate-700">{recommendation.impact}</p></div></div></article>)}</div>
        </section>

        {data.linkVisibility && (
          <section className="print-break-inside-avoid border-t border-slate-200 py-8" aria-labelledby="links-heading">
            <div className="mb-1 flex items-center gap-2"><Link2 className="h-5 w-5 text-purple-600" /><h2 id="links-heading" className="text-xl font-bold text-slate-950">6. Direct Links &amp; Product Accuracy</h2></div>
            <p className="mb-5 text-sm text-slate-600">Visibility is great, but clicks drive sales. This shows how often AI is sending customers directly to your storefront and whether the information it shares is accurate.</p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Storefront links from AI</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{data.linkVisibility.totalDirectLinks}</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">Times AI gave customers a clickable link to your website.</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Links that don&apos;t work</p>
                  <span title="AI sometimes guesses website links incorrectly. We flag these so you can set up redirects.">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </span>
                </div>
                <p className="mt-2 text-4xl font-bold tracking-tight text-amber-900">{data.linkVisibility.brokenLinks}</p>
                <p className="mt-2 text-xs leading-5 text-amber-800">AI sometimes guesses website links incorrectly. We flag these so you can set up redirects.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Price accuracy</p>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">{data.linkVisibility.pricingAccuracy}%</p>
                <p className="mt-2 text-xs leading-5 text-slate-600">How often AI showed the same price as your live storefront.</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold text-slate-950">Products customers click most</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {data.linkVisibility.topLinkedProducts.map((product) => (
                  <li key={product.name} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium text-slate-800">{product.name}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-950">
                      {product.linkCount}
                      <span className="text-xs font-medium text-slate-500">{product.linkCount === 1 ? 'link' : 'links'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <footer className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">Prepared for {data.brandName} by {agencyName}. This report is designed to help your team prioritize clear website content, helpful customer proof, and trusted publisher relationships.</footer>
      </div>
    </main>
  );
}
