import { useState } from 'react'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import Modal from '../components/Modal'
import DEFAULT_PACKS from '../data/defaultTemplates'

export default function Templates() {
    const t = useT()
    const { lang } = useLang()
    const { templates, kids } = useStore()
    const { addTemplate, updateTemplate, deleteTemplate, importDefaultPack, assignTemplateToKids } = useFireActions()

    const [showAdd, setShowAdd] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assignKids, setAssignKids] = useState([])
    const [showAssign, setShowAssign] = useState(null)
    const [assignSelection, setAssignSelection] = useState([])
    const [importing, setImporting] = useState(null)
    const [importMsg, setImportMsg] = useState('')
    const [showPackDetail, setShowPackDetail] = useState(null)

    const getPackName = (pack) => lang === 'vi' ? (t(`pack.${toCamel(pack.id)}`) || pack.name) : pack.name
    const getPackDesc = (pack) => lang === 'vi' ? (t(`pack.${toCamel(pack.id)}Desc`) || pack.description) : pack.description
    const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

    const openAdd = () => { setTitle(''); setDescription(''); setAssignKids([]); setShowAdd(true) }
    const openEdit = (tmpl) => { setEditItem(tmpl); setTitle(tmpl.title); setDescription(tmpl.description); setAssignKids(tmpl.assignedKidIds || []) }

    const handleSave = async () => {
        if (!title.trim()) return
        if (editItem) {
            await updateTemplate(editItem.id, { title: title.trim(), description: description.trim(), assignedKidIds: assignKids })
            setEditItem(null)
        } else {
            await addTemplate(title.trim(), description.trim())
            setShowAdd(false)
        }
        setTitle(''); setDescription(''); setAssignKids([])
    }

    const handleImport = async (pack) => {
        setImporting(pack.id); setImportMsg('')
        try {
            const count = await importDefaultPack(pack)
            setImportMsg(count > 0
                ? t('tmpl.importedCount', { count, name: getPackName(pack) })
                : t('tmpl.importedAll', { name: getPackName(pack) }))
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

            {/* Default Packs */}
            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                    {t('tmpl.defaultPacks')}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, marginLeft: 10 }}>{t('tmpl.defaultPacksDesc')}</span>
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
                                        onClick={() => handleImport(pack)} disabled={importing === pack.id || allImported} style={{ marginLeft: 'auto' }}>
                                        {importing === pack.id ? '⏳' : allImported ? t('tmpl.imported') : t('tmpl.import')}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Family Templates */}
            <section>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                    {t('tmpl.familyTemplates')}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, marginLeft: 10 }}>
                        {templates.length} {lang === 'vi' ? 'mẫu' : (templates.length !== 1 ? 'templates' : 'template')}
                    </span>
                </h2>
                {templates.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <span className="empty-state-icon">📋</span>
                        <p className="empty-state-title">{t('tmpl.noTemplates')}</p>
                        <p className="empty-state-desc">{t('tmpl.noTemplatesDesc')}</p>
                    </div>
                ) : (
                    <div className="col">
                        {templates.map((tmpl, i) => {
                            const assigned = tmpl.assignedKidIds || []
                            const assignedKidsList = assigned.length > 0 ? kids.filter((k) => assigned.includes(k.id)) : []
                            return (
                                <div key={tmpl.id} className="task-item animate-in" style={{ animationDelay: `${i * 30}ms` }}>
                                    <span style={{ fontSize: 22 }}>📌</span>
                                    <div style={{ flex: 1 }}>
                                        <div className="task-title">{tmpl.title}</div>
                                        {tmpl.description && <div className="task-desc">{tmpl.description}</div>}
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

            {/* Pack Preview */}
            {showPackDetail && (
                <Modal title={`${showPackDetail.icon} ${getPackName(showPackDetail)}`} onClose={() => setShowPackDetail(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                        {getPackDesc(showPackDetail)} • {showPackDetail.ageRange}
                    </p>
                    <div className="col">
                        {showPackDetail.tasks.map((task, i) => (
                            <div key={i} className="task-item" style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{i + 1}.</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{task.title}</div>
                                    {task.description && <div className="task-desc">{task.description}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setShowPackDetail(null)}>{t('common.close')}</button>
                        <button className="btn btn-primary" onClick={() => { handleImport(showPackDetail); setShowPackDetail(null) }}>{t('tmpl.importAll')}</button>
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
                            <label>{t('tmpl.descLabel')}</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('tmpl.descPlaceholder')} rows={3} />
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
