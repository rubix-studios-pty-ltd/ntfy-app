import Image from 'next/image'

import ntfy from '@/assets/ntfy.png'
import { Instance } from '@/components/instance'

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-900 text-slate-50">
      <div className="mx-auto grid w-full gap-6 p-4">
        <section className="relative overflow-hidden rounded-lg border border-zinc-700/40 bg-zinc-900 p-4">
          <div className="flex items-center gap-4">
            <div className="grid size-12 p-1.5 place-items-center rounded-lg bg-linear-to-br from-teal-600 to-emerald-800">
              <Image src={ntfy} alt="ntfy" />
            </div>
            <h1 className="text-4xl font-semibold">Ntfy</h1>
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-lg border border-zinc-700/40 bg-zinc-900 p-4">
          <Instance />
        </section>
      </div>
    </main>
  )
}
