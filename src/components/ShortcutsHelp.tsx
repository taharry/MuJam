import { KEYBOARD_SHORTCUTS } from "../hooks/useKeyboardShortcuts";

interface Props {
  onClose: () => void;
}

export default function ShortcutsHelp({ onClose }: Props) {
  return (
    <div className="shortcuts-help__overlay" onClick={onClose}>
      <div
        className="shortcuts-help"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-help__header">
          <h2>Keyboard shortcuts</h2>
          <button className="shortcuts-help__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <dl className="shortcuts-help__list">
          {KEYBOARD_SHORTCUTS.map((s) => (
            <div key={s.keys} className="shortcuts-help__row">
              <dt>
                <kbd>{s.keys}</kbd>
              </dt>
              <dd>{s.description}</dd>
            </div>
          ))}
        </dl>
        <p className="shortcuts-help__note">
          Shortcuts are disabled while typing in a search box or any other field.
        </p>
      </div>
    </div>
  );
}
