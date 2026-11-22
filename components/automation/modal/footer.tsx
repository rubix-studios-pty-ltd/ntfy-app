import { SquareArrowDown, SquareArrowUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTransfer } from '@/hooks/use-transfer'
import { type ModalProps } from '@/types/automation'

type Props = Omit<ModalProps, 'rule'> & {
  rule: NonNullable<ModalProps['rule']>
}

export function ModalFooter({ rule, servers, setRule, onSave }: Props) {
  const { importInput, importRule, exportRule } = useTransfer(rule, servers, setRule)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <input
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file) {
              void importRule(file)
            }
          }}
          ref={importInput}
          type="file"
        />

        <Button
          aria-label="Import rule"
          className="cursor-pointer transition-all duration-500"
          onClick={() => importInput.current?.click()}
          type="button"
          variant="outline"
        >
          <SquareArrowUp className="size-4" />
        </Button>

        <Button
          aria-label="Export rule"
          className="cursor-pointer transition-all duration-500"
          onClick={exportRule}
          type="button"
          variant="outline"
        >
          <SquareArrowDown className="size-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          className="cursor-pointer transition-all duration-500"
          onClick={() => setRule(null)}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>

        <Button
          className="cursor-pointer duration-500 transition-all"
          onClick={onSave}
          type="submit"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
