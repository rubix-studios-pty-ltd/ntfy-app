import { BackButton } from '@/components/back-button'
import { Logs } from '@/components/logs'

export default function Page() {
  return (
    <main className="flex h-dvh min-h-0 text-sm">
      <div className="flex min-w-0 flex-1 flex-col p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold select-none">Logs</h1>
          <BackButton />
        </div>

        <section className="flex flex-1 flex-col gap-4">
          <Logs />
        </section>
      </div>
    </main>
  )
}
