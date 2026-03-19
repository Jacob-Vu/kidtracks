import { useState } from 'react'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import Modal from '../components/Modal'
import DEFAULT_PACKS from '../data/defaultTemplates'
import { trackTemplateImported } from '../hooks/useAnalytics'

const defaultTaskViByTitle = new Map(
    DEFAULT_PACKS.flatMap((pack) => pack.tasks.map((task) => [task.title, task.descriptionVi || '']))
)

export default function Templates() {
    const t = useT()
    const { lang } = useLang()
    const isVi = lang.startsWith('vi')
    const { templates, kids } = useStore()
    const { addTemplate, updateTemplate, deleteTemplate, importDefaultPack, assignTemplateToKids } = useFireActions()

    const [showAdd, setShowAdd] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [title, setTitle] = useState('')
    const [descriptionEn, setDescriptionEn] = useState('')
    const [descriptionVi, setDescriptionVi] = useState('')
    const [assignKids, setAssignKids] = useState([])
    const [showAssign, setShowAssign] = useState(null)
    const [assignSelection, setAssignSelection] = useState([])
    const [importing, setImporting] = useState(null)
    const [importMsg, setImportMsg] = useState('')
    const [showPackDetail, setShowPackDetail] = useState(null)
    const [filterKidId, setFilterKidId] = useState('all')
    const [activeTab, setActiveTab] = useState('default')

    // Import selection modal state
    const [importPack, setImportPack] = useState(null)
    const [selectedTasks, setSelectedTasks] = useState([])

    const getPackName = (pack) => isVi ? (t(`pack.${toCamel(pack.id)}`) || pack.name) : pack.name
    const getPackDesc = (pack) => isVi ? (t(`pack.${toCamel(pack.id)}Desc`) || pack.description) : pack.description
    const getPackTaskDesc = (task) => isVi
        ? (task.descriptionVi || task.description || '')
        : (task.description || task.descriptionVi || '')
    const descClassName = isVi ? 'task-desc template-desc-highlight' : 'task-desc'
    const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const getTemplateDesc = (tmpl) => {
        if (isVi && !tmpl?.descriptions?.vi) {
            const defaultVi = defaultTaskViByTitle.get(tmpl?.title)
            if (defaultVi) return defaultVi
        }
        return tmpl?.descriptions?.[lang] || tmpl?.descriptions?.en || tmpl?.descriptions?.vi || tmpl?.description || ''
    }

    const openAdd = () => {
        setTitle('')
        setDescriptionEn('')
        setDescriptionVi('')
        setAssignKids([])
        setShowAdd(true)
    }
    const openEdit = (tmpl) => {
        setEditItem(tmpl)
        setTitle(tmpl.title)
        setDescriptionEn(tmpl?.descriptions?.en || tmpl?.description || '')
        setDescriptionVi(tmpl?.descriptions?.vi || tmpl?.description || '')
        setAssignKids(tmpl.assignedKidIds || [])
    }

    const handleSave = async () => {
        if (!title.trim()) return
        const descriptions = { en: descriptionEn.trim(), vi: descriptionVi.trim() }
        if (editItem) {
            await updateTemplate(editItem.id, {
                title: title.trim(),
                descriptions,
                description: descriptions.en || descriptions.vi || '',
                assignedKidIds: assignKids,
            })
            setEditItem(null)
        } else {
            await addTemplate(title.trim(), descriptions)
            setShowAdd(false)
            setActiveTab('family')
        }
        setTitle('')
        setDescriptionEn('')
        setDescriptionVi('')
        setAssignKids([])
    }

    // Open import selection modal (all tasks selected by default)
    const openImportSelect = (pack) => {
        const existingTitles = templates.map((t) => t.title)
        setImportPack(pack)
        // All tasks selected by default; mark already-imported ones
        setSelectedTasks(pack.tasks.map((task) => task.title))
    }

    const toggleTaskSelect = (taskTitle) => {
        setSelectedTasks((prev) =>
            prev.includes(taskTitle) ? prev.filter((t) => t !== taskTitle) : [...prev, taskTitle]
        )
    }

    const toggleAllTasks = () => {
        if (!importPack) return
        if (selectedTasks.length === importPack.tasks.length) {
            setSelectedTasks([])
        } else {
            setSelectedTasks(importPack.tasks.map((t) => t.title))
        }
    }

    const handleImportSelected = async () => {
        if (!importPack || selectedTasks.length === 0) return
        const tasksToImport = importPack.tasks.filter((t) => selectedTasks.includes(t.title))
        setImporting(importPack.id); setImportMsg(''); setImportPack(null)
        try {
            const count = await importDefaultPack(importPack, tasksToImport)
            trackTemplateImported({ pack_name: importPack.id, task_count: tasksToImport.length })
            setImportMsg(count > 0
                ? t('tmpl.importedCount', { count, name: getPackName(importPack) })
                : t('tmpl.importedAll', { name: getPackName(importPack) }))
            setTimeout(() => setImportMsg(''), 4000)
        } catch { setImportMsg(t('tmpl.importFailed')) }
        finally { setImporting(null) }
    }

    const openAssign = (tmpl) => { setShowAssign(tmpl); setAssignSelection(tmpl.assignedKidIds || []) }
    const handleSaveAssign = async () => { if (showAssign) { await assignTemplateToKids(showAssign.id, assignSelection); setShowAssign(null) } }
    const toggleKid = (kidId, setter) => setter((prev) => prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId])

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">{t('tmpl.title')}</h1>
                    <p className="page-subtitle">{t('tmpl.subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>{t('tmpl.newBtn')}</button>
            </div>

            {importMsg && <div className="toast-inline" style={{ marginBottom: 20 }}>{importMsg}</div>}

            <div className="chip-group" style={{ marginBottom: 18 }}>
                <button
                    className={`chip${activeTab === 'default' ? ' selected' : ''}`}
                    onClick={() => setActiveTab('default')}
                >
                    {t('tmpl.defaultPacks')}
                </button>
                <button
                    className={`chip${activeTab === 'family' ? ' selected' : ''}`}
                    onClick={() => setActiveTab('family')}
                >
                    {t('tmpl.familyTemplates')}
                </button>
            </div>

            {/* Default Packs */}
            {activeTab === 'default' && (
            <section style={{ marginBottom: 36 }}>
                <h2 className="section-title">
                    {t('tmpl.defaultPacks')}
                    <span className="section-note">{t('tmpl.defaultPacksDesc')}</span>
                </h2>
                <div className="pack-grid">
                    {DEFAULT_PACKS.map((pack) => {
                        const allImported = pack.tasks.every((pt) => templates.some((ft) => ft.title === pt.title))
                        return (
                            <div key={pack.id} className="pack-card" style={{ '--pack-color': pack.color }}>
                                <div className="pack-header">
                                    <span className="pack-icon">{pack.icon}</span>
                                    <div>
                                        <div className="pack-name">{getPackName(pack)}</div>
                                        <div className="pack-meta">
                                            <span className="badge badge-gray">{pack.ageRange}</span>
                                            {pack.gender !== 'neutral' && <span className="badge badge-purple">{pack.gender === 'boy' ? '♂' : '♀'}</span>}
                                        </div>
                                    </div>
                                </div>
                                <p className="pack-desc">{getPackDesc(pack)}</p>
                                <div className="pack-task-count">{t('tmpl.tasks', { count: pack.tasks.length })}</div>
                                <div className="row" style={{ gap: 8, marginTop: 12 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowPackDetail(pack)}>{t('tmpl.preview')}</button>
                                    <button className={`btn btn-sm ${allImported ? 'btn-ghost' : 'btn-primary'}`}
                                        onClick={() => openImportSelect(pack)} disabled={importing === pack.id || allImported} style={{ marginLeft: 'auto' }}>
                                        {importing === pack.id ? '⏳' : allImported ? t('tmpl.imported') : t('tmpl.import')}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
            )}

            {/* Family Templates */}
            {activeTab === 'family' && (
            <section>
                <div className="row between center" style={{ marginBottom: 16 }}>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>
                        {t('tmpl.familyTemplates')}
                        <span className="section-note">
                            {t('tmpl.templateCount', { count: templates.length })}
                        </span>
                    </h2>
                    {kids.length > 0 && (
                        <select className="form-select" style={{ fontSize: 13, padding: '6px 30px 6px 12px', width: 'auto' }}
                            value={filterKidId} onChange={(e) => setFilterKidId(e.target.value)}>
                            <option value="all">{t('tmpl.allKids')}</option>
                            {kids.map((k) => (
                                <option key={k.id} value={k.id}>{k.displayName || k.name}</option>
                            ))}
                        </select>
                    )}
                </div>
                {templates.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <span className="empty-state-icon">📋</span>
                        <p className="empty-state-title">{t('tmpl.noTemplates')}</p>
                        <p className="empty-state-desc">{t('tmpl.noTemplatesDesc')}</p>
                    </div>
                ) : (
                    <div className="col">
                        {templates.filter((tmpl) => {
                            if (filterKidId === 'all') return true
                            const assigned = tmpl.assignedKidIds || []
                            return assigned.length === 0 || assigned.includes(filterKidId)
                        }).map((tmpl, i) => {
                            const assigned = tmpl.assignedKidIds || []
                            const assignedKidsList = assigned.length > 0 ? kids.filter((k) => assigned.includes(k.id)) : []
                            return (
                                <div key={tmpl.id} className="task-item animate-in" style={{ animationDelay: `${i * 30}ms` }}>
                                    <span style={{ fontSize: 22 }}>📌</span>
                                    <div style={{ flex: 1 }}>
                                        <div className="task-title">{tmpl.title}</div>
                                        {getTemplateDesc(tmpl) && <div className={descClassName}>{getTemplateDesc(tmpl)}</div>}
                                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                            {assignedKidsList.length > 0 ? assignedKidsList.map((k) => (
                                                <span key={k.id} className="badge badge-purple" style={{ fontSize: 11 }}>{k.avatar} {k.displayName || k.name}</span>
                                            )) : <span className="badge badge-gray" style={{ fontSize: 11 }}>{t('tmpl.allKids')}</span>}
                                        </div>
                                    </div>
                                    <div className="task-actions" style={{ opacity: 1, gap: 4 }}>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openAssign(tmpl)} title={t('tmpl.assignLabel')}>👤</button>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(tmpl)}>✏️</button>
                                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteTemplate(tmpl.id)}>🗑️</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
            )}

            {/* Pack Preview (read-only) */}
            {showPackDetail && (
                <Modal title={`${showPackDetail.icon} ${getPackName(showPackDetail)}`} onClose={() => setShowPackDetail(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                        {getPackDesc(showPackDetail)} • {showPackDetail.ageRange}
                    </p>
                    <div className="col">
                        {showPackDetail.tasks.map((task, i) => {
                            return (
                                <div key={i} className="task-item" style={{ padding: '10px 14px' }}>
                                    <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{i + 1}.</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{task.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{getPackTaskDesc(task)}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setShowPackDetail(null)}>{t('common.close')}</button>
                        <button className="btn btn-primary" onClick={() => { openImportSelect(showPackDetail); setShowPackDetail(null) }}>{t('tmpl.importSelected')}</button>
                    </div>
                </Modal>
            )}

            {/* Import Selection Modal */}
            {importPack && (
                <Modal title={`📥 ${t('tmpl.importFrom')} "${getPackName(importPack)}"`} onClose={() => setImportPack(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                        {t('tmpl.selectTasksDesc')}
                    </p>
                    <div style={{ marginBottom: 12 }}>
                        <button className="btn btn-ghost btn-sm" onClick={toggleAllTasks}>
                            {selectedTasks.length === importPack.tasks.length ? t('tmpl.deselectAll') : t('tmpl.selectAll')}
                        </button>
                        <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                            {selectedTasks.length}/{importPack.tasks.length} {t('tmpl.selectedCountLabel')}
                        </span>
                    </div>
                    <div className="col" style={{ maxHeight: 350, overflowY: 'auto' }}>
                        {importPack.tasks.map((task, i) => {
                            const alreadyImported = templates.some((ft) => ft.title === task.title)
                            const isSelected = selectedTasks.includes(task.title)
                            return (
                                <div key={i} className={`task-item ${alreadyImported ? 'imported' : ''}`}
                                    style={{ cursor: alreadyImported ? 'default' : 'pointer', padding: '10px 14px', opacity: alreadyImported ? 0.5 : 1 }}
                                    onClick={() => !alreadyImported && toggleTaskSelect(task.title)}>
                                    <div className={`task-checkbox ${isSelected && !alreadyImported ? 'completed' : ''}`}
                                        style={{ pointerEvents: 'none' }}>
                                        {alreadyImported ? '✓' : isSelected ? '✓' : ''}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{task.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{getPackTaskDesc(task)}</div>
                                    </div>
                                    {alreadyImported && <span className="badge badge-gray" style={{ fontSize: 10 }}>{t('tmpl.alreadyExists')}</span>}
                                </div>
                            )
                        })}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setImportPack(null)}>{t('common.cancel')}</button>
                        <button className="btn btn-primary" onClick={handleImportSelected}
                            disabled={selectedTasks.filter((title) => !templates.some((ft) => ft.title === title)).length === 0}>
                            {t('tmpl.importBtn', { count: selectedTasks.filter((title) => !templates.some((ft) => ft.title === title)).length })}
                        </button>
                    </div>
                </Modal>
            )}

            {/* Add/Edit Modal */}
            {(showAdd || editItem) && (
                <Modal title={editItem ? t('tmpl.editTemplate') : t('tmpl.newTemplate')} onClose={() => { setShowAdd(false); setEditItem(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>{t('tmpl.taskTitle')}</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder={t('tmpl.taskPlaceholder')} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="form-group">
                            <label>{t('tmpl.descLabelEn', 'Description (English)')}</label>
                            <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder={t('tmpl.descPlaceholder')} rows={3} />
                        </div>
                        <div className="form-group">
                            <label>{t('tmpl.descLabelVi', 'Description (Vietnamese)')}</label>
                            <textarea value={descriptionVi} onChange={(e) => setDescriptionVi(e.target.value)} placeholder={t('tmpl.descPlaceholderVi', 'Mô tả tiếng Việt...')} rows={3} />
                        </div>
                        {editItem && kids.length > 0 && (
                            <div className="form-group">
                                <label>{t('tmpl.assignLabel')} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: 'var(--text-muted)' }}>{t('tmpl.assignHint')}</span></label>
                                <div className="chip-group">
                                    {kids.map((k) => (
                                        <button key={k.id} className={`chip ${assignKids.includes(k.id) ? 'selected' : ''}`}
                                            onClick={() => toggleKid(k.id, setAssignKids)}>{k.avatar} {k.displayName || k.name}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditItem(null) }}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>{t('common.save')}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Assign Modal */}
            {showAssign && (
                <Modal title={t('tmpl.assignTitle', { title: showAssign.title })} onClose={() => setShowAssign(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{t('tmpl.assignDesc')}</p>
                    <div className="col">
                        {kids.map((k) => (
                            <div key={k.id} className="task-item" style={{ cursor: 'pointer', padding: '10px 14px' }} onClick={() => toggleKid(k.id, setAssignSelection)}>
                                <div className={`task-checkbox ${assignSelection.includes(k.id) ? 'completed' : ''}`}>
                                    {assignSelection.includes(k.id) ? '✓' : ''}
                                </div>
                                <span style={{ fontSize: 22 }}>{k.avatar}</span>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{k.displayName || k.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setShowAssign(null)}>{t('common.cancel')}</button>
                        <button className="btn btn-primary" onClick={handleSaveAssign}>{t('tmpl.saveAssign')}</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
