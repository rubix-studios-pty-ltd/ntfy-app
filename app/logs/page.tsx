import { Logs } from '@/components/logs'
import { Refresh } from '@/components/logs/refresh'

export default function Page() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full flex-col gap-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">Logs</h1>
          <Refresh />
        </div>
        <section className="flex min-h-0 flex-1 flex-col gap-6 justify-between">
          <Logs />
        </section>
      </div>
    </main>
  )
}
