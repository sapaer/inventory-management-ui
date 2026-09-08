export default function EditChoiceModal({ item, lang, t, onClose, onEditQuantity, onEditDetails }) {
  if (!item) return null;

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div className="modal edit-choice-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{t(lang, "editWhat")}</h3>
        <p className="edit-choice-sub">{item.partName}</p>
        <div className="edit-choice-options">
          <button type="button" className="edit-choice-card" onClick={onEditQuantity}>
            <span className="edit-choice-ic" aria-hidden="true">
              <QtyIcon />
            </span>
            <span className="edit-choice-title">{t(lang, "editQuantity")}</span>
            <span className="edit-choice-desc">{t(lang, "editQuantityHint")}</span>
          </button>
          <button type="button" className="edit-choice-card" onClick={onEditDetails}>
            <span className="edit-choice-ic" aria-hidden="true">
              <DetailsIcon />
            </span>
            <span className="edit-choice-title">{t(lang, "editDetails")}</span>
            <span className="edit-choice-desc">{t(lang, "editDetailsHint")}</span>
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-g" onClick={onClose}>
            {t(lang, "cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

function QtyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

function DetailsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
