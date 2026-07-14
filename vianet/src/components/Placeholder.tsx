export function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">This page is under construction.</p>
    </div>
  )
}