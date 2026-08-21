import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ConfirmModal = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  secondaryText,
  destructive = false,
  onConfirm,
  onSecondary,
}) => {
  const handleSecondary = () => {
    if (onSecondary) {
      onSecondary();
    }

    onOpenChange(false);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }

    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="bg-[#181920] border border-[#30313a] text-white max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {title}
          </DialogTitle>

          <DialogDescription className="text-neutral-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md bg-[#2a2b33] text-neutral-200 hover:bg-[#34353e] transition-colors"
          >
            {cancelText}
          </button>

          {secondaryText && onSecondary && (
            <button
              type="button"
              onClick={handleSecondary}
              className="px-4 py-2 rounded-md bg-[#2a2b33] text-red-400 hover:bg-[#34353e] transition-colors"
            >
              {secondaryText}
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-500"
                : "bg-[#8417ff] hover:bg-[#741bda]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmModal;