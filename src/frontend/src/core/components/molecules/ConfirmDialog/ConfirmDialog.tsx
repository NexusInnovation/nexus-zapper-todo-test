import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  isConfirming?: boolean
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isConfirming) return
        onCancel()
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 1 }}>{title}</DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onCancel} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isConfirming}
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
