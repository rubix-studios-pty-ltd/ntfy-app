import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type RulesType } from '@/schema/automation'

type Props = {
  rule: RulesType | null
  onClose: () => void
  onDelete: () => Promise<void>
}

export function Dialog({ rule, onClose, onDelete }: Props) {
  return (
    <AlertDialog onOpenChange={(open) => !open && onClose()} open={rule !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete automation "{rule?.name}" and all associated data. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer duration-500 transition-all" variant="outline">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            className="cursor-pointer duration-500 transition-all"
            onClick={(event) => {
              event.preventDefault()
              void onDelete()
            }}
            variant="destructive"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
