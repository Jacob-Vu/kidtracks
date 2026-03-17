import { useState, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import DEFAULT_PACKS from '../data/defaultTemplates'

const defaultViByTitle = new Map(
    DEFAULT_PACKS.flatMap((p) => p.tasks.map((t) => [t.title, t.descriptionVi || '']))
)

function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function getDesc(tmpl, lang) {
    if (lang === 'vi') {
        const d = tmpl?.descriptions?.vi || defaultViByTitle.get(tmpl?.title) || ''
        if (d) return d
    }
    return tmpl?.descriptions?.en || tmpl?.descriptions?.vi || tmpl?.description || ''
}

function TemplateRow({ tmpl, selected, alreadyAdded, onToggle, lang }) {
    const primary = getDesc(tmpl, lang)
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
                <div className="tpicker-row-title">{tmpl.title}</div>
                {primary && <div className="tpicker-row-desc">{primary}</div>}
            </div>
            {alreadyAdded && (
                <span className="badge badge-gray" style={{ fontSize: 10, flexShrink: 0 }}>Đã có</span>
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

    const { templates, kids, dailyTasks } = useStore()
    const { addDailyTask } = useFireActions()

    const existingTaskTitles = dailyTasks
        .filter((t) => t.kidId === kidId && t.date === date)
        .map((t) => t.title)

    const [search, setSearch] = useState('')
    const [filterKid, setFilterKid] = useState('assigned')
    const [selected, setSelected] = useState(new Set())
    const [adding, setAdding] = useState(false)
    const [previewId, setPreviewId] = useState(null)

    const filtered = useMemo(() => {
        const q = normalize(search.trim())
        return templates.filter((tmpl) => {
            if (filterKid === 'assigned') {
                const a = tmpl.assignedKidIds || []
                if (a.length > 0 && !a.includes(kidId)) return false
            } else if (filterKid !== 'all') {
                const a = tmpl.assignedKidIds || []
                if (a.length > 0 && !a.includes(filterKid)) return false
            }
            if (!q) return true
            const desc = normalize(getDesc(tmpl, lang))
            return normalize(tmpl.title).includes(q) || desc.includes(q)
        })
    }, [templates, filterKid, kidId, search, lang])

    const selectableFiltered = filtered.filter((tmpl) => !existingTaskTitles.includes(tmpl.title))

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        const allIds = selectableFiltered.map((t) => t.id)
        const allSelected = allIds.every((id) => selected.has(id))
        setSelected(allSelected ? new Set() : new Set(allIds))
    }

    const selectedCount = [...selected].filter(
        (id) => !existingTaskTitles.includes(templates.find((t) => t.id === id)?.title || '')
    ).length

    const handleAdd = async () => {
        const toAdd = templates.filter((tmpl) => selected.has(tmpl.id) && !existingTaskTitles.includes(tmpl.title))
        if (toAdd.length === 0) return
        setAdding(true)
        for (const tmpl of toAdd) {
            await addDailyTask(kidId, date, tmpl.title, getDesc(tmpl, lang))
        }
        setAdding(false)
        navigate(`/daily/${kidId}`)
    }

    const previewTmpl = previewId ? templates.find((t) => t.id === previewId) : null

    const otherLang = lang === 'vi' ? 'en' : 'vi'

    return (
        <div className="tpicker-page">
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
                <div className="chip-group" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
                    <button className={`chip chip--sm${filterKid === 'assigned' ? ' selected' : ''}`} onClick={() => setFilterKid('assigned')}>
                        {t('picker.filterAssigned')}
                    </button>
                    <button className={`chip chip--sm${filterKid === 'all' ? ' selected' : ''}`} onClick={() => setFilterKid('all')}>
                        {t('picker.filterAll')}
                    </button>
                    {kids.map((k) => (
                        <button key={k.id} className={`chip chip--sm${filterKid === k.id ? ' selected' : ''}`} onClick={() => setFilterKid(k.id)}>
                            {k.avatar} {k.displayName || k.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Select-all bar */}
            {selectableFiltered.length > 0 && (
                <div className="tpicker-selectbar">
                    <button className="btn btn-ghost btn-sm" onClick={toggleAll}>
                        {selectableFiltered.every((t) => selected.has(t.id)) ? t('tmpl.deselectAll') : t('tmpl.selectAll')}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {filtered.length} {lang === 'vi' ? 'mẫu' : 'templates'}
                        {filtered.length !== selectableFiltered.length && (
                            <> · {filtered.length - selectableFiltered.length} {lang === 'vi' ? 'đã có' : 'already added'}</>
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
                                onMouseEnter={() => setPreviewId(tmpl.id)}
                                onClick={() => setPreviewId(tmpl.id)}
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
                            <div className="tpicker-preview-title">📌 {previewTmpl.title}</div>
                            {getDesc(previewTmpl, lang) && (
                                <p className="tpicker-preview-desc">{getDesc(previewTmpl, lang)}</p>
                            )}
                            {(() => {
                                const secondary = getDesc(previewTmpl, otherLang)
                                const primary = getDesc(previewTmpl, lang)
                                if (secondary && secondary !== primary) {
                                    return <p className="tpicker-preview-secondary">{secondary}</p>
                                }
                                return null
                            })()}
                            {(() => {
                                const assigned = previewTmpl.assignedKidIds || []
                                const assignedKids = assigned.length > 0 ? kids.filter((k) => assigned.includes(k.id)) : []
                                return (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {lang === 'vi' ? 'Giao cho' : 'Assigned to'}
                                        </div>
                                        {assignedKids.length > 0 ? assignedKids.map((k) => (
                                            <span key={k.id} className="badge badge-purple" style={{ marginRight: 4, fontSize: 11 }}>
                                                {k.avatar} {k.displayName || k.name}
                                            </span>
                                        )) : (
                                            <span className="badge badge-gray" style={{ fontSize: 11 }}>{t('tmpl.allKids')}</span>
                                        )}
                                    </div>
                                )
                            })()}
                            <button
                                className={`btn btn-sm btn--full${selected.has(previewTmpl.id) ? ' btn-ghost' : ' btn-primary'}`}
                                style={{ marginTop: 20 }}
                                onClick={() => !existingTaskTitles.includes(previewTmpl.title) && toggle(previewTmpl.id)}
                                disabled={existingTaskTitles.includes(previewTmpl.title)}
                            >
                                {existingTaskTitles.includes(previewTmpl.title)
                                    ? (lang === 'vi' ? '✓ Đã có hôm nay' : '✓ Already added')
                                    : selected.has(previewTmpl.id)
                                        ? (lang === 'vi' ? '☐ Bỏ chọn' : '☐ Deselect')
                                        : (lang === 'vi' ? '+ Chọn' : '+ Select')
                                }
                            </button>
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                            {lang === 'vi' ? 'Chọn một mẫu để xem chi tiết' : 'Select a template to preview'}
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
                    {adding ? '⏳' : t('picker.addBtn', { count: selectedCount })}
                </button>
            </div>
        </div>
    )
}
