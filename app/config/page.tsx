import { Config } from '@/components/config'

export default function Page() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full flex-col gap-6 p-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Config</h1>
        </div>
        <section className="flex min-h-0 flex-1 flex-col gap-6 justify-between">
          <Config />
        </section>
      </div>
    </main>
  )
}
