import { useState, useMemo } from 'react'
import Modal from './Modal'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import DEFAULT_PACKS from '../data/defaultTemplates'

const defaultViByTitle = new Map(
    DEFAULT_PACKS.flatMap((p) => p.tasks.map((t) => [t.title, t.descriptionVi || '']))
)

function getDesc(tmpl, lang) {
    if (lang === 'vi') {
        const d = tmpl?.descriptions?.vi || defaultViByTitle.get(tmpl?.title) || ''
        if (d) return d
    }
    return tmpl?.descriptions?.en || tmpl?.descriptions?.vi || tmpl?.description || ''
}

// ─── Single template row ──────────────────────────────────────────────────────
function TemplateRow({ tmpl, selected, alreadyAdded, onToggle, lang }) {
    const desc = getDesc(tmpl, lang)
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
                {desc && <div className="tpicker-row-desc">{desc}</div>}
            </div>
            {alreadyAdded && (
                <span className="badge badge-gray" style={{ fontSize: 10, flexShrink: 0 }}>Đã có</span>
            )}
        </div>
    )
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function TemplatePickerModal({ kidId, date, existingTaskTitles = [], onClose }) {
    const t = useT()
    const { lang } = useLang()
    const { templates, kids } = useStore()
    const { addDailyTask } = useFireActions()

    const [search, setSearch] = useState('')
    const [filterKid, setFilterKid] = useState('assigned') // 'assigned' | 'all' | kidId
    const [selected, setSelected] = useState(new Set())
    const [adding, setAdding] = useState(false)
    const [preview, setPreview] = useState(null) // template id for detail peek

    // Filter templates
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return templates.filter((tmpl) => {
            // Kid filter
            if (filterKid === 'assigned') {
                const a = tmpl.assignedKidIds || []
                if (a.length > 0 && !a.includes(kidId)) return false
            } else if (filterKid !== 'all') {
                const a = tmpl.assignedKidIds || []
                if (a.length > 0 && !a.includes(filterKid)) return false
            }
            // Search
            if (!q) return true
            const desc = getDesc(tmpl, lang).toLowerCase()
            return tmpl.title.toLowerCase().includes(q) || desc.includes(q)
        })
    }, [templates, filterKid, kidId, search, lang])

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectableFiltered = filtered.filter((tmpl) => !existingTaskTitles.includes(tmpl.title))

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
        onClose()
    }

    const previewTmpl = preview ? templates.find((t) => t.id === preview) : null

    return (
        <Modal title={t('picker.title')} onClose={onClose} className="modal--lg">
            {/* ── Filters ── */}
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

            {/* ── Select all bar ── */}
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

            {/* ── List + preview side by side ── */}
            <div className="tpicker-body">
                {/* Template list */}
                <div className="tpicker-list">
                    {filtered.length === 0 ? (
                        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                            {t('picker.noResults')}
                        </div>
                    ) : (
                        filtered.map((tmpl) => (
                            <div
                                key={tmpl.id}
                                className={`tpicker-row-wrap${previewTmpl?.id === tmpl.id ? ' tpicker-row-wrap--active' : ''}`}
                                onMouseEnter={() => setPreview(tmpl.id)}
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
                            {lang === 'vi' && getDesc(previewTmpl, 'en') !== getDesc(previewTmpl, lang) && (
                                <p className="tpicker-preview-en">{getDesc(previewTmpl, 'en')}</p>
                            )}
                            {(() => {
                                const assigned = previewTmpl.assignedKidIds || []
                                const assignedKids = assigned.length > 0
                                    ? kids.filter((k) => assigned.includes(k.id))
                                    : []
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
                            {lang === 'vi' ? 'Rê chuột vào mẫu để xem chi tiết' : 'Hover a template to preview'}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="modal-footer">
                <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
                <button
                    className="btn btn-primary"
                    onClick={handleAdd}
                    disabled={selectedCount === 0 || adding}
                >
                    {adding ? '⏳' : t('picker.addBtn', { count: selectedCount })}
                </button>
            </div>
        </Modal>
    )
}
