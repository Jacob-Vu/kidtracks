import { useEffect } from 'react'
import { useT } from '../i18n/I18nContext'

const PALETTE = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#3b82f6', '#a78bfa']

const confettiPieces = Array.from({ length: 40 }, (_, i) => {
    const left = ((Math.sin(i * 2.4) + 1) / 2) * 100
    const delay = ((Math.cos(i * 1.7) + 1) / 2) * 2.5
    const duration = 2.5 + ((Math.sin(i * 3.1) + 1) / 2) * 2.5
    const size = 6 + ((Math.cos(i * 2.1) + 1) / 2) * 6
    const colorIndex = i % 8
    const shape = i % 3 // 0=square, 1=circle, 2=rect

    return {
        left,
        delay,
        duration,
        size,
        color: PALETTE[colorIndex],
        shape,
    }
})

export default function CelebrationOverlay({ kid, onClose }) {
    const t = useT()

    useEffect(() => {
        const timer = setTimeout(onClose, 5000)
        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className="celebration-overlay">
            {confettiPieces.map((piece, i) => {
                const borderRadius =
                    piece.shape === 1 ? '50%' : '0'
                const width = piece.size
                const height = piece.shape === 2 ? piece.size / 2 : piece.size

                return (
                    <div
                        key={i}
                        className="confetti-piece"
                        style={{
                            left: `${piece.left}%`,
                            animationDelay: `${piece.delay}s`,
                            animationDuration: `${piece.duration}s`,
                            width: `${width}px`,
                            height: `${height}px`,
                            background: piece.color,
                            borderRadius,
                        }}
                    />
                )
            })}

            <div className="celebration-card">
                <button className="celebration-close-btn" onClick={onClose}>×</button>
                <span className="celebration-star">⭐</span>
                <div className="celebration-title">{t('celebrate.allDone')}</div>
                <div className="celebration-subtitle">
                    {t('celebrate.congrats', { name: kid?.displayName || kid?.name || '' })}
                </div>
                <button className="btn btn-primary" onClick={onClose}>
                    {t('celebrate.close')}
                </button>
            </div>
        </div>
    )
}
