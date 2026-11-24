import { IconButton } from '@mui/material'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'

type DeleteActionButtonProps = {
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
}

export function DeleteActionButton({
  onClick,
  ariaLabel,
  disabled,
}: DeleteActionButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      size="small"
    >
      <DeleteRoundedIcon fontSize="small" />
    </IconButton>
  )
}
