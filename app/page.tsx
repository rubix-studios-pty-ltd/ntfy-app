import Image from 'next/image'

import ntfy from '@/assets/ntfy.png'
import { Instance } from '@/components/instance'

export default function Page() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full flex-col gap-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src={ntfy} alt="ntfy" className="size-10" loading="eager" />
            <h1 className="text-2xl font-bold">Ntfy</h1>
          </div>
        </div>
        <Instance />
      </div>
    </main>
  )
}
