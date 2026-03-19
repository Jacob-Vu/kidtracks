import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import DEFAULT_PACKS from '../data/defaultTemplates'

// Flat list of all default template tasks with pack metadata
const ALL_TASKS = DEFAULT_PACKS.flatMap((pack) =>
    pack.tasks.map((task, i) => ({
        id: `${pack.id}__${i}`,
        title: task.title,
        description: task.description || '',
        descriptionVi: task.descriptionVi || '',
        packId: pack.id,
        packName: pack.name,
        packIcon: pack.icon,
        packAgeRange: pack.ageRange,
        packColor: pack.color,
    }))
)

function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
function getDesc(task, lang) {
    const isVi = lang.startsWith('vi')
    if (isVi && task.descriptionVi) return task.descriptionVi
    return task.description || task.descriptionVi || ''
}

function getRowPrimaryText(task, lang) {
    const isVi = lang.startsWith('vi')
    if (isVi) return task.descriptionVi || task.title || task.description || ''
    return task.title
}

function getRowSecondaryText(task, lang) {
    const isVi = lang.startsWith('vi')
    if (isVi) return task.description || ''
    return getDesc(task, lang)
}

function getPreviewPrimaryText(task, lang) {
    const isVi = lang.startsWith('vi')
    if (isVi) return task.descriptionVi || task.description || task.title || ''
    return task.description || task.title || task.descriptionVi || ''
}

function getPreviewSecondaryText(task, lang) {
    const isVi = lang.startsWith('vi')
    if (isVi) return task.description || task.title || ''
    return task.descriptionVi || ''
}

function TemplateRow({ tmpl, selected, alreadyAdded, onToggle, lang }) {
    const t = useT()
    const primary = getRowPrimaryText(tmpl, lang)
    const secondary = getRowSecondaryText(tmpl, lang)
    return (
        <div
            className={`tpicker-row${selected ? ' tpicker-row--selected' : ''}${alreadyAdded ? ' tpicker-row--done' : ''}`}
            onClick={() => !alreadyAdded && onToggle(tmpl.id)}
            role="checkbox"
            aria-checked={alreadyAdded ? true : selected}
            tabIndex={alreadyAdded ? -1 : 0}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !alreadyAdded && onToggle(tmpl.id)}
        >
            <div className={`task-checkbox${selected || alreadyAdded ? ' completed' : ''}`} style={{ pointerEvents: 'none', flexShrink: 0 }}>
                {(selected || alreadyAdded) ? '✓' : ''}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {primary && <div className="tpicker-row-title">{primary}</div>}
                {secondary && secondary !== primary && <div className="tpicker-row-desc">{secondary}</div>}
            </div>
            {alreadyAdded && (
                <span className="badge badge-gray" style={{ fontSize: 10, flexShrink: 0 }}>{t('picker.alreadyAddedBadge')}</span>
            )}
        </div>
    )
}

export default function TemplatePickerPage() {
    const t = useT()
    const { lang } = useLang()
    const { kidId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

    const { dailyTasks } = useStore()
    const { addDailyTask } = useFireActions()

    const existingTaskTitles = dailyTasks
        .filter((task) => task.kidId === kidId && task.date === date)
        .map((task) => task.title)

    const [search, setSearch] = useState('')
    const [filterPack, setFilterPack] = useState('all')
    const [selected, setSelected] = useState(new Set())
    const [adding, setAdding] = useState(false)
    const [previewId, setPreviewId] = useState(null)
    const chipScrollRef = useRef(null)
    const [chipCanScrollLeft, setChipCanScrollLeft] = useState(false)
    const [chipCanScrollRight, setChipCanScrollRight] = useState(true)

    const updateChipScrollHints = () => {
        const el = chipScrollRef.current
        if (!el) return
        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
        setChipCanScrollLeft(el.scrollLeft > 2)
        setChipCanScrollRight(el.scrollLeft < maxScrollLeft - 2)
    }

    useEffect(() => {
        updateChipScrollHints()
    }, [filterPack, lang])

    useEffect(() => {
        const onResize = () => updateChipScrollHints()
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    const filtered = useMemo(() => {
        const isVi = lang.startsWith('vi')
        const q = normalize(search.trim())
        return ALL_TASKS.filter((tmpl) => {
            if (filterPack !== 'all' && tmpl.packId !== filterPack) return false
            if (!q) return true
            if (isVi) {
                return normalize(tmpl.descriptionVi || '').includes(q)
                    || normalize(tmpl.title).includes(q)
                    || normalize(tmpl.description || '').includes(q)
            }
            return normalize(tmpl.title).includes(q) || normalize(getDesc(tmpl, lang)).includes(q)
        })
    }, [filterPack, search, lang])

    const selectableFiltered = filtered.filter((tmpl) => !existingTaskTitles.includes(tmpl.title))

    const toggle = (id) => {
        if (adding) return
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (adding) return
        const allIds = selectableFiltered.map((tmpl) => tmpl.id)
        const allSelected = allIds.every((id) => selected.has(id))
        setSelected(allSelected ? new Set() : new Set(allIds))
    }

    const selectedCount = [...selected].filter((id) => {
        const task = ALL_TASKS.find((tmpl) => tmpl.id === id)
        return task && !existingTaskTitles.includes(task.title)
    }).length

    const handleAdd = async () => {
        const toAdd = ALL_TASKS.filter((tmpl) => selected.has(tmpl.id) && !existingTaskTitles.includes(tmpl.title))
        if (toAdd.length === 0) return
        setAdding(true)
        try {
            for (const tmpl of toAdd) {
                await addDailyTask(kidId, date, tmpl.title, getDesc(tmpl, lang))
            }
            navigate(`/daily/${kidId}`)
        } finally {
            setAdding(false)
        }
    }

    const previewTmpl = previewId ? ALL_TASKS.find((tmpl) => tmpl.id === previewId) : null
    const previewPack = previewTmpl ? DEFAULT_PACKS.find((p) => p.id === previewTmpl.packId) : null
    return (
        <div className={`tpicker-page page-with-mobile-sticky-bar${adding ? ' tpicker-page--busy' : ''}`}>
            {/* Header */}
            <div className="tpicker-page-header">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/daily/${kidId}`)}>
                    ← {t('common.back')}
                </button>
                <h1 className="tpicker-page-title">{t('picker.title')}</h1>
            </div>

            {/* Filters */}
            <div className="tpicker-filters">
                <input
                    className="tpicker-search"
                    type="search"
                    placeholder={t('picker.search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
                <div className={`tpicker-chip-scroll-wrap${chipCanScrollLeft ? ' has-left' : ''}${chipCanScrollRight ? ' has-right' : ''}`}>
                    <div
                        ref={chipScrollRef}
                        className={`chip-group tpicker-chip-scroll${chipCanScrollLeft ? ' has-left' : ''}${chipCanScrollRight ? ' has-right' : ''}`}
                        onScroll={updateChipScrollHints}
                    >
                        <button
                            className={`chip chip--sm${filterPack === 'all' ? ' selected' : ''}`}
                            onClick={() => setFilterPack('all')}
                        >
                            {t('picker.all')}
                        </button>
                        {DEFAULT_PACKS.map((pack) => (
                            <button
                                key={pack.id}
                                className={`chip chip--sm${filterPack === pack.id ? ' selected' : ''}`}
                                onClick={() => setFilterPack(pack.id)}
                            >
                                {pack.icon} {pack.name}
                            </button>
                        ))}
                    </div>
                    <div className="tpicker-chip-hint">
                        {t('picker.swipeHint')}
                    </div>
                </div>
            </div>

            {/* Select-all bar */}
            {selectableFiltered.length > 0 && (
                <div className="tpicker-selectbar">
                    <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
                        {selectableFiltered.every((tmpl) => selected.has(tmpl.id)) ? t('tmpl.deselectAll') : t('tmpl.selectAll')}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {filtered.length} {t('picker.templatesUnit')}
                        {filtered.length !== selectableFiltered.length && (
                            <> · {filtered.length - selectableFiltered.length} {t('picker.alreadyAddedUnit')}</>
                        )}
                    </span>
                </div>
            )}

            {/* Body: list + preview */}
            <div className="tpicker-body">
                <div className="tpicker-list">
                    {filtered.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            {t('picker.noResults')}
                        </div>
                    ) : (
                        filtered.map((tmpl) => (
                            <div
                                key={tmpl.id}
                                className={`tpicker-row-wrap${previewTmpl?.id === tmpl.id ? ' tpicker-row-wrap--active' : ''}`}
                                onMouseEnter={() => !adding && setPreviewId(tmpl.id)}
                                onClick={() => !adding && setPreviewId(tmpl.id)}
                            >
                                <TemplateRow
                                    tmpl={tmpl}
                                    selected={selected.has(tmpl.id)}
                                    alreadyAdded={existingTaskTitles.includes(tmpl.title)}
                                    onToggle={toggle}
                                    lang={lang}
                                />
                            </div>
                        ))
                    )}
                </div>

                {/* Preview panel */}
                <div className="tpicker-preview">
                    {previewTmpl ? (
                        <>
                            <div className="tpicker-preview-title">📌 {getRowPrimaryText(previewTmpl, lang)}</div>
                            {getPreviewPrimaryText(previewTmpl, lang) && (
                                <p className="tpicker-preview-desc">{getPreviewPrimaryText(previewTmpl, lang)}</p>
                            )}
                            {(() => {
                                const secondary = getPreviewSecondaryText(previewTmpl, lang)
                                const primary = getPreviewPrimaryText(previewTmpl, lang)
                                if (secondary && secondary !== primary) {
                                    return <p className="tpicker-preview-secondary">{secondary}</p>
                                }
                                return null
                            })()}
                            {previewPack && (
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('picker.packLabel')}
                                    </div>
                                    <span className="badge badge-purple" style={{ marginRight: 4, fontSize: 11 }}>
                                        {previewPack.icon} {previewPack.name}
                                    </span>
                                    <span className="badge badge-gray" style={{ fontSize: 11 }}>
                                        {previewPack.ageRange}
                                    </span>
                                </div>
                            )}
                            <button
                                className={`btn btn-sm btn--full${selected.has(previewTmpl.id) ? ' btn-ghost' : ' btn-primary'}`}
                                style={{ marginTop: 20 }}
                                onClick={() => !existingTaskTitles.includes(previewTmpl.title) && toggle(previewTmpl.id)}
                                disabled={existingTaskTitles.includes(previewTmpl.title)}
                            >
                                {existingTaskTitles.includes(previewTmpl.title)
                                    ? t('picker.btnAlreadyToday')
                                    : selected.has(previewTmpl.id)
                                        ? t('picker.btnDeselect')
                                        : t('picker.btnSelect')
                                }
                            </button>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                            {t('picker.previewHint')}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="tpicker-page-footer">
                <button className="btn btn-ghost" onClick={() => navigate(`/daily/${kidId}`)}>
                    {t('common.cancel')}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    disabled={selectedCount === 0 || adding}
                >
                    {adding ? t('common.loading') : t('picker.addBtn', { count: selectedCount })}
                </button>
            </div>
            <div className="mobile-sticky-action-bar">
                <button className="btn btn-ghost" onClick={() => navigate(`/daily/${kidId}`)} disabled={adding}>
                    {t('common.cancel')}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    disabled={selectedCount === 0 || adding}
                    aria-busy={adding ? 'true' : 'false'}
                >
                    {adding ? t('common.loading') : t('picker.addBtn', { count: selectedCount })}
                </button>
            </div>
        </div>
    )
}

