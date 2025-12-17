export function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
        <div className="h-4 w-4 rotate-45 rounded-[3px] bg-white/90" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-brand-600">Yimaru</div>
        <div className="text-xs font-medium text-brand-400">Academy</div>
      </div>
    </div>
  )
}


