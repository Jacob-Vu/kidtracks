import { useState } from 'react'
import Modal from './Modal'
import { useT } from '../i18n/I18nContext'

const ICON_OPTIONS = ['🎯', '🚲', '🎮', '📚', '🧸', '⚽', '🎁', '🛹']

export default function GoalModal({ isOpen, goal, kidName, onClose, onSave, onDelete }) {
    const t = useT()
    const [title, setTitle] = useState(goal?.title || '')
    const [targetAmount, setTargetAmount] = useState(goal?.targetAmount ? String(goal.targetAmount) : '')
    const [icon, setIcon] = useState(goal?.icon || '🎯')
    const [dueDate, setDueDate] = useState(goal?.dueDate || '')

    if (!isOpen) return null

    const targetValue = Number(targetAmount)
    const canSave = title.trim().length > 0 && Number.isFinite(targetValue) && targetValue > 0

    const handleSave = () => {
        if (!canSave) return
        onSave({
            title: title.trim(),
            targetAmount: targetValue,
            icon,
            dueDate: dueDate || null,
        })
    }

    return (
        <Modal title={goal ? t('goal.editTitle') : t('goal.createTitle')} onClose={onClose}>
            <div className="col">
                {kidName && <p className="goal-modal-kid">{t('goal.forKid', { name: kidName })}</p>}
                <div className="form-group">
                    <label>{t('goal.titleLabel')}</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('goal.titlePlaceholder')}
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>{t('goal.targetLabel')}</label>
                    <input
                        type="number"
                        min="1"
                        step="1000"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder={t('goal.targetPlaceholder')}
                    />
                </div>
                <div className="form-group">
                    <label>{t('goal.iconLabel')}</label>
                    <div className="goal-icon-grid">
                        {ICON_OPTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                className={`goal-icon-btn${icon === emoji ? ' selected' : ''}`}
                                onClick={() => setIcon(emoji)}
                                aria-label={t('goal.chooseIcon', { icon: emoji })}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label>{t('goal.dueDateLabel')}</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
                    {goal && (
                        <button className="btn btn-danger" onClick={onDelete}>{t('common.delete')}</button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={!canSave}
                        data-testid="goal-save-btn"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
