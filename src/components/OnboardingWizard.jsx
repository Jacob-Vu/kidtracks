import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import DEFAULT_PACKS from '../data/defaultTemplates'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import useStore from '../store/useStore'
import { trackOnboardingCompleted, trackOnboardingStepCompleted } from '../hooks/useAnalytics'

const AVATARS = ['🧒', '👦', '👧', '🧑', '👶', '🐻', '🦁', '🐰', '🐱', '🐶']
const AGE_RANGES = [
    { id: '4-6', label: '4–6' },
    { id: '7-10', label: '7–10' },
    { id: '11-14', label: '11–14' },
]
const AGE_TO_PACKS = {
    '4-6': ['little-star'],
    '7-10': ['school-star'],
    '11-14': ['young-achiever'],
}

export default function OnboardingWizard() {
    const t = useT()
    const { lang } = useLang()
    const isVi = lang.startsWith('vi')
    const navigate = useNavigate()
    const { kids } = useStore()
    const { addKid, importDefaultPack, addDailyTask } = useFireActions()

    const [step, setStep] = useState(0)
    const [childName, setChildName] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('🧒')
    const [selectedAgeRange, setSelectedAgeRange] = useState('7-10')
    const [selectedPackIds, setSelectedPackIds] = useState(['school-star'])
    const [busy, setBusy] = useState(false)
    const [waitingForKid, setWaitingForKid] = useState(false)
    const prevKidsSnapshotRef = useRef(null)

    const togglePack = (packId) => {
        setSelectedPackIds((prev) =>
            prev.includes(packId) ? prev.filter((id) => id !== packId) : [...prev, packId]
        )
    }

    const totalTasks = selectedPackIds.reduce((sum, packId) => {
        const pack = DEFAULT_PACKS.find((p) => p.id === packId)
        return sum + (pack?.tasks.length || 0)
    }, 0)

    // Watch for the newly created kid to appear in the store
    useEffect(() => {
        if (!waitingForKid || !prevKidsSnapshotRef.current) return
        const newKid = kids.find((k) => !prevKidsSnapshotRef.current.some((pk) => pk.id === k.id))
        if (!newKid) return

        setWaitingForKid(false)
        const today = format(new Date(), 'yyyy-MM-dd')
        const addTasksAndNavigate = async () => {
            try {
                for (const packId of selectedPackIds) {
                    const pack = DEFAULT_PACKS.find((p) => p.id === packId)
                    if (!pack) continue
                    for (const task of pack.tasks) {
                        const desc = isVi
                            ? (task.descriptionVi || task.description)
                            : task.description
                        await addDailyTask(newKid.id, today, task.title, desc)
                    }
                }
            } catch (err) {
                console.error('Failed to add daily tasks:', err)
            }
            trackOnboardingCompleted(kids.length, totalTasks)
            navigate(`/daily/${newKid.id}`)
        }
        addTasksAndNavigate()
    }, [kids, waitingForKid, navigate, selectedPackIds, totalTasks, lang, addDailyTask])

    const handleComplete = async () => {
        if (!childName.trim() || selectedPackIds.length === 0 || busy) return
        setBusy(true)
        try {
            prevKidsSnapshotRef.current = [...kids]
            // Import packs first so templates are in Firestore before kid is created
            for (const packId of selectedPackIds) {
                const pack = DEFAULT_PACKS.find((p) => p.id === packId)
                if (pack) await importDefaultPack(pack, pack.tasks)
            }
            await addKid(childName.trim(), selectedAvatar)
            setWaitingForKid(true)
        } catch (err) {
            console.error('Onboarding failed:', err)
            setBusy(false)
        }
    }

    const selectedPackNames = selectedPackIds
        .map((id) => DEFAULT_PACKS.find((p) => p.id === id)?.name || id)
        .join(', ')

    return (
        <div className="onboarding-wizard">
            <div className="onboarding-card">
                {/* Step indicator dots */}
                <div className="onboarding-steps">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className={`onboarding-dot${step === i ? ' active' : step > i ? ' done' : ''}`}
                        />
                    ))}
                </div>

                {/* Step 1: Add child */}
                {step === 0 && (
                    <div className="onboarding-step-content">
                        <h2 className="onboarding-title">{t('onboard.step1Title')}</h2>
                        <p className="onboarding-subtitle">{t('onboard.step1Desc')}</p>

                        <div className="form-group">
                            <label>{t('onboard.nameLabel')}</label>
                            <input
                                type="text"
                                value={childName}
                                onChange={(e) => setChildName(e.target.value)}
                                placeholder={t('onboard.namePlaceholder')}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && childName.trim()) {
                                        trackOnboardingStepCompleted(1, 0)
                                        setStep(1)
                                    }
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('onboard.avatarLabel')}</label>
                            <div className="onboarding-avatar-grid">
                                {AVATARS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className={`onboarding-avatar-btn${selectedAvatar === emoji ? ' selected' : ''}`}
                                        onClick={() => setSelectedAvatar(emoji)}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('onboard.ageLabel')}</label>
                            <div className="chip-group">
                                {AGE_RANGES.map((range) => (
                                    <button
                                        key={range.id}
                                        type="button"
                                        className={`chip${selectedAgeRange === range.id ? ' selected' : ''}`}
                                        onClick={() => {
                                            setSelectedAgeRange(range.id)
                                            setSelectedPackIds(AGE_TO_PACKS[range.id] || [])
                                        }}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 8 }}
                            disabled={!childName.trim()}
                            onClick={() => {
                                trackOnboardingStepCompleted(1, 0)
                                setStep(1)
                            }}
                        >
                            {t('onboard.next')} →
                        </button>
                    </div>
                )}

                {/* Step 2: Pick template pack */}
                {step === 1 && (
                    <div className="onboarding-step-content">
                        <h2 className="onboarding-title">{t('onboard.step2Title')}</h2>
                        <p className="onboarding-subtitle">{t('onboard.step2Desc')}</p>

                        <div className="onboarding-pack-grid">
                            {DEFAULT_PACKS.map((pack) => {
                                const isRecommended = AGE_TO_PACKS[selectedAgeRange]?.includes(pack.id)
                                const isSelected = selectedPackIds.includes(pack.id)
                                return (
                                    <button
                                        key={pack.id}
                                        type="button"
                                        className={`onboarding-pack-card${isSelected ? ' selected' : ''}${isRecommended ? ' recommended' : ''}`}
                                        onClick={() => togglePack(pack.id)}
                                    >
                                        {isRecommended && (
                                            <span className="onboarding-recommended-badge">
                                                {t('onboard.recommended')}
                                            </span>
                                        )}
                                        <span className="onboarding-pack-icon">{pack.icon}</span>
                                        <div className="onboarding-pack-name">{pack.name}</div>
                                        <div className="onboarding-pack-age">{pack.ageRange}</div>
                                        <div className="onboarding-pack-count">
                                            {pack.tasks.length} {t('onboard.tasks')}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="row" style={{ gap: 8, marginTop: 16 }}>
                            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(0)}>
                                ← {t('common.back')}
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                                disabled={selectedPackIds.length === 0}
                                onClick={() => {
                                    trackOnboardingStepCompleted(2, selectedPackIds.length)
                                    setStep(2)
                                }}
                            >
                                {t('onboard.next')} →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: All set! */}
                {step === 2 && (
                    <div className="onboarding-step-content" style={{ textAlign: 'center' }}>
                        <div className="onboarding-celebration">🎉</div>
                        <h2 className="onboarding-title">{t('onboard.step3Title')}</h2>
                        <p className="onboarding-subtitle">
                            {t('onboard.step3Summary', { name: childName, count: totalTasks, packs: selectedPackNames })}
                        </p>

                        <button
                            className="btn btn-primary onboarding-start-btn"
                            disabled={busy}
                            onClick={() => {
                                trackOnboardingStepCompleted(3, selectedPackIds.length)
                                handleComplete()
                            }}
                        >
                            {busy ? t('onboard.starting') : t('onboard.startBtn')}
                        </button>

                        <button
                            className="btn btn-ghost"
                            style={{ marginTop: 10, width: '100%' }}
                            onClick={() => setStep(1)}
                            disabled={busy}
                        >
                            ← {t('common.back')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
