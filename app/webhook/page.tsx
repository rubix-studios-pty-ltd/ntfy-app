import { Webhook } from '@/components/webhook'

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-900 p-6 text-slate-50">
      <div className="mx-auto grid w-full gap-6 p-4">
        <section className="relative overflow-hidden rounded-lg border border-zinc-700/40 bg-zinc-900 p-4">
          <h1 className="text-2xl font-semibold">Webhook</h1>
        </section>
        <section className="flex flex-col gap-6 rounded-lg border border-zinc-700/40 bg-zinc-900 p-4">
          <Webhook />
        </section>
      </div>
    </main>
  )
}
