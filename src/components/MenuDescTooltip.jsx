'use client';

export default function MenuDescTooltip({ desc, children, disabled = false, className = '' }) {
  const description = typeof desc === 'string' ? desc.trim() : '';
  const shouldShowTooltip = description.length > 0 && !disabled;

  return (
    <span className={`relative inline-flex min-w-0 group/desc ${className}`}>
      {children}
      {shouldShowTooltip && (
        <span className="pointer-events-none absolute left-0 top-full z-[1000] mt-2 hidden max-w-[340px] rounded-lg bg-sky-50 px-2.5 py-2 text-left text-xs font-medium leading-relaxed text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.18)] ring-1 ring-sky-100 whitespace-normal break-keep group-hover/desc:block">
          {description}
        </span>
      )}
    </span>
  );
}
