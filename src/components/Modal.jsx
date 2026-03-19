import { useEffect, useId, useRef } from 'react'

export default function Modal({ title, onClose, children, className, mobileSheet = false }) {
    const titleId = useId()
    const dialogRef = useRef(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        const previousFocus = document.activeElement
        dialog.focus()

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
                return
            }

            if (e.key !== 'Tab') return

            const focusable = dialog.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )

            if (focusable.length === 0) {
                e.preventDefault()
                return
            }

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            const isShift = e.shiftKey

            if (isShift && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!isShift && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        dialog.addEventListener('keydown', handleKeyDown)
        return () => {
            dialog.removeEventListener('keydown', handleKeyDown)
            if (previousFocus && typeof previousFocus.focus === 'function') {
                previousFocus.focus()
            }
        }
    }, [onClose])

    return (
        <div
            className={`modal-overlay${mobileSheet ? ' modal-overlay--sheet' : ''}`}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={dialogRef}
                className={`modal${mobileSheet ? ' modal--mobile-sheet' : ''}${className ? ' ' + className : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
            >
                <h2 id={titleId} className="modal-title">{title}</h2>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                    ✕
                </button>
                {children}
            </div>
        </div>
    )
}
