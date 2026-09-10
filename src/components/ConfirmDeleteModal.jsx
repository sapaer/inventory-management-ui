export default function ConfirmDeleteModal({
  title,
  message,
  itemName,
  cancelLabel = "Cancel",
  deleteLabel = "Delete",
  busy = false,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="overlay" onClick={busy ? undefined : onCancel} role="presentation">
      <div
        className="modal confirm-delete-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <h3 id="confirm-delete-title">{title}</h3>
        <p className="confirm-delete-msg">{message}</p>
        {itemName ? <div className="confirm-delete-name">{itemName}</div> : null}
        <div className="modal-actions">
          <button type="button" className="btn btn-g" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-d" disabled={busy} onClick={onConfirm}>
            {busy ? "…" : deleteLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
