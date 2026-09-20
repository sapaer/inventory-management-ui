import { useRef } from "react";

/**
 * A fixed row of photo slots (maxCount, default 3) so the box is the same size
 * whether it's empty or full: uploaded photos fill slots from the left, the
 * next free slot is the "add" button, the rest are quiet placeholders. The
 * first photo is tagged as the main one.
 */
export default function PhotoUploader({
  images = [],
  onAddFiles,
  onRemove,
  uploading = false,
  disabled = false,
  maxCount = 3,
  addLabel = "Add photo",
  mainLabel = "Main",
  uploadingLabel = "Uploading…",
  hint = "",
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

      <div className="photo-slots">
        {Array.from({ length: maxCount }, (_, i) => {
          const url = images[i];
          if (url) {
            return (
              <div className="photo-slot has-img" key={url}>
                <img src={url} alt="" />
                {i === 0 ? <span className="photo-slot-tag">{mainLabel}</span> : null}
                {!disabled && onRemove ? (
                  <button type="button" className="photo-thumb-x" aria-label="Remove photo" onClick={() => onRemove(url)}>
                    ×
                  </button>
                ) : null}
              </div>
            );
          }
          if (i === images.length && (canAdd || uploading)) {
            return (
              <button
                type="button"
                key={`add-${i}`}
                className="photo-slot is-add"
                disabled={!canAdd}
                onClick={() => canAdd && fileRef.current?.click()}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8a2 2 0 0 1 2-2h1.5l1.2-1.6A1 1 0 0 1 9.5 4h5a1 1 0 0 1 .8.4L16.5 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
                  <circle cx="12" cy="12.5" r="3.2" />
                </svg>
                <span>{uploading ? uploadingLabel : addLabel}</span>
              </button>
            );
          }
          return <div className="photo-slot is-empty" key={`empty-${i}`} aria-hidden="true" />;
        })}
      </div>
      {hint ? <p className="photo-hint">{hint}</p> : null}
    </div>
  );
}
