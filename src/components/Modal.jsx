export default function Modal({ title, onClose, children }) {
    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <h2 className="modal-title">{title}</h2>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>
                {children}
            </div>
        </div>
    )
}
