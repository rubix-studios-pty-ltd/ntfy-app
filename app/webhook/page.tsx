import { Webhook } from '@/components/webhook'

export default function Page() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full flex-col gap-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">Webhook</h1>
        </div>
        <Webhook />
      </div>
    </main>
  )
}
