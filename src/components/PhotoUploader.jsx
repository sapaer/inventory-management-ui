import { useRef } from "react";

/**
 * Empty by default. Thumbnails appear only after the user uploads.
 * maxCount defaults to 3.
 */
export default function PhotoUploader({
  images = [],
  onAddFiles,
  onRemove,
  uploading = false,
  disabled = false,
  maxCount = 3,
  chooseLabel = "Choose Files",
  emptyTitle = "Add photos",
  emptyHint = "JPEG or PNG · up to 3 images",
  uploadingLabel = "Uploading…",
}) {
  const fileRef = useRef(null);
  const canAdd = !disabled && images.length < maxCount && !uploading && typeof onAddFiles === "function";

  return (
    <div className={`photo-uploader${disabled ? " is-readonly" : ""}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={(e) => {
          onAddFiles?.(e.target.files);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      <button
        type="button"
        className="photo-drop"
        disabled={!canAdd}
        onClick={() => canAdd && fileRef.current?.click()}
      >
        <span className="photo-drop-ic" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 16V8M8.5 11.5 12 8l3.5 3.5" />
            <path d="M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
          </svg>
        </span>
        <span className="photo-drop-title">{uploading ? uploadingLabel : emptyTitle}</span>
        <span className="photo-drop-hint">{emptyHint}</span>
        {!disabled ? <span className="photo-drop-btn">{chooseLabel}</span> : null}
      </button>

      {images.length > 0 ? (
        <div className="photo-thumbs">
          {images.map((url) => (
            <div className="photo-thumb" key={url}>
              <img src={url} alt="" />
              {!disabled && onRemove ? (
                <button
                  type="button"
                  className="photo-thumb-x"
                  aria-label="Remove photo"
                  onClick={() => onRemove(url)}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
          {canAdd ? (
            <button
              type="button"
              className="photo-thumb-add"
              aria-label="Add another photo"
              onClick={() => fileRef.current?.click()}
            >
              +
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
