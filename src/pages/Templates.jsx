import { useState } from 'react'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import Modal from '../components/Modal'
import DEFAULT_PACKS from '../data/defaultTemplates'

export default function Templates() {
    const { templates, kids } = useStore()
    const { addTemplate, updateTemplate, deleteTemplate, importDefaultPack, assignTemplateToKids } = useFireActions()

    const [showAdd, setShowAdd] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assignKids, setAssignKids] = useState([]) // kid ids for assignment

    const [showAssign, setShowAssign] = useState(null) // template being assigned
    const [assignSelection, setAssignSelection] = useState([])

    const [importing, setImporting] = useState(null) // pack id being imported
    const [importMsg, setImportMsg] = useState('')

    const [showPackDetail, setShowPackDetail] = useState(null) // preview pack

    const openAdd = () => { setTitle(''); setDescription(''); setAssignKids([]); setShowAdd(true) }
    const openEdit = (t) => {
        setEditItem(t); setTitle(t.title); setDescription(t.description)
        setAssignKids(t.assignedKidIds || [])
    }

    const handleSave = async () => {
        if (!title.trim()) return
        if (editItem) {
            await updateTemplate(editItem.id, {
                title: title.trim(), description: description.trim(), assignedKidIds: assignKids,
            })
            setEditItem(null)
        } else {
            await addTemplate(title.trim(), description.trim())
            // Immediately update assignment if needed
            setShowAdd(false)
        }
        setTitle(''); setDescription(''); setAssignKids([])
    }

    const handleImport = async (pack) => {
        setImporting(pack.id)
        setImportMsg('')
        try {
            const count = await importDefaultPack(pack)
            setImportMsg(count > 0
                ? `✅ Imported ${count} new task${count > 1 ? 's' : ''} from "${pack.name}"`
                : `ℹ️ All tasks from "${pack.name}" already exist`)
            setTimeout(() => setImportMsg(''), 4000)
        } catch {
            setImportMsg('❌ Failed to import')
        } finally {
            setImporting(null)
        }
    }

    const openAssign = (t) => {
        setShowAssign(t)
        setAssignSelection(t.assignedKidIds || [])
    }

    const handleSaveAssign = async () => {
        if (showAssign) {
            await assignTemplateToKids(showAssign.id, assignSelection)
            setShowAssign(null)
        }
    }

    const toggleKidAssign = (kidId) => {
        setAssignSelection((prev) =>
            prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId]
        )
    }

    const toggleKidInEdit = (kidId) => {
        setAssignKids((prev) =>
            prev.includes(kidId) ? prev.filter((id) => id !== kidId) : [...prev, kidId]
        )
    }

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">📋 Task Templates</h1>
                    <p className="page-subtitle">Import default packs or create custom templates</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>+ New Template</button>
            </div>

            {importMsg && (
                <div className="toast-inline" style={{ marginBottom: 20 }}>
                    {importMsg}
                </div>
            )}

            {/* ─── Default Packs ─── */}
            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                    📦 Default Packs
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, marginLeft: 10 }}>
                        Import curated task sets for your family
                    </span>
                </h2>
                <div className="pack-grid">
                    {DEFAULT_PACKS.map((pack) => {
                        const alreadyImported = pack.tasks.every((t) => templates.some((ft) => ft.title === t.title))
                        return (
                            <div key={pack.id} className="pack-card" style={{ '--pack-color': pack.color }}>
                                <div className="pack-header">
                                    <span className="pack-icon">{pack.icon}</span>
                                    <div>
                                        <div className="pack-name">{pack.name}</div>
                                        <div className="pack-meta">
                                            <span className="badge badge-gray">{pack.ageRange}</span>
                                            {pack.gender !== 'neutral' && (
                                                <span className="badge badge-purple">{pack.gender === 'boy' ? '♂ Boy' : '♀ Girl'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="pack-desc">{pack.description}</p>
                                <div className="pack-task-count">{pack.tasks.length} tasks</div>
                                <div className="row" style={{ gap: 8, marginTop: 12 }}>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setShowPackDetail(pack)}
                                    >
                                        👁️ Preview
                                    </button>
                                    <button
                                        className={`btn btn-sm ${alreadyImported ? 'btn-ghost' : 'btn-primary'}`}
                                        onClick={() => handleImport(pack)}
                                        disabled={importing === pack.id || alreadyImported}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        {importing === pack.id ? '⏳' : alreadyImported ? '✅ Imported' : '📥 Import'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ─── Family Templates ─── */}
            <section>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                    📋 Family Templates
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 13, marginLeft: 10 }}>
                        {templates.length} template{templates.length !== 1 ? 's' : ''}
                    </span>
                </h2>

                {templates.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <span className="empty-state-icon">📋</span>
                        <p className="empty-state-title">No templates yet</p>
                        <p className="empty-state-desc">Import a default pack above or create a custom template.</p>
                    </div>
                ) : (
                    <div className="col">
                        {templates.map((t, i) => {
                            const assigned = t.assignedKidIds || []
                            const assignedKidsList = assigned.length > 0
                                ? kids.filter((k) => assigned.includes(k.id))
                                : []
                            return (
                                <div key={t.id} className="task-item animate-in" style={{ animationDelay: `${i * 30}ms` }}>
                                    <span style={{ fontSize: 22 }}>📌</span>
                                    <div style={{ flex: 1 }}>
                                        <div className="task-title">{t.title}</div>
                                        {t.description && <div className="task-desc">{t.description}</div>}
                                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                            {assignedKidsList.length > 0 ? (
                                                assignedKidsList.map((k) => (
                                                    <span key={k.id} className="badge badge-purple" style={{ fontSize: 11 }}>
                                                        {k.avatar} {k.displayName || k.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="badge badge-gray" style={{ fontSize: 11 }}>👥 All kids</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="task-actions" style={{ opacity: 1, gap: 4 }}>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openAssign(t)} title="Assign to kids">👤</button>
                                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(t)}>✏️</button>
                                        <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteTemplate(t.id)}>🗑️</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* ─── Pack Preview Modal ─── */}
            {showPackDetail && (
                <Modal title={`${showPackDetail.icon} ${showPackDetail.name}`} onClose={() => setShowPackDetail(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                        {showPackDetail.description} • {showPackDetail.ageRange}
                        {showPackDetail.gender !== 'neutral' && ` • ${showPackDetail.gender === 'boy' ? '♂ Boy' : '♀ Girl'}`}
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
                        <button className="btn btn-ghost" onClick={() => setShowPackDetail(null)}>Close</button>
                        <button className="btn btn-primary" onClick={() => { handleImport(showPackDetail); setShowPackDetail(null) }}>
                            📥 Import All
                        </button>
                    </div>
                </Modal>
            )}

            {/* ─── Add/Edit Template Modal ─── */}
            {(showAdd || editItem) && (
                <Modal title={editItem ? 'Edit Template' : 'New Template'} onClose={() => { setShowAdd(false); setEditItem(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>Task Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Make your bed" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                placeholder="Additional notes..." rows={3} />
                        </div>
                        {editItem && kids.length > 0 && (
                            <div className="form-group">
                                <label>Assign to Kids <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: 'var(--text-muted)' }}>(leave empty = all kids)</span></label>
                                <div className="chip-group">
                                    {kids.map((k) => (
                                        <button key={k.id}
                                            className={`chip ${assignKids.includes(k.id) ? 'selected' : ''}`}
                                            onClick={() => toggleKidInEdit(k.id)}>
                                            {k.avatar} {k.displayName || k.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditItem(null) }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>Save</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ─── Assign to Kids Modal ─── */}
            {showAssign && (
                <Modal title={`👤 Assign "${showAssign.title}"`} onClose={() => setShowAssign(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                        Choose which kids should get this task when loading templates. Leave all unchecked for all kids.
                    </p>
                    <div className="col">
                        {kids.map((k) => (
                            <div key={k.id} className="task-item" style={{ cursor: 'pointer', padding: '10px 14px' }}
                                onClick={() => toggleKidAssign(k.id)}>
                                <div className={`task-checkbox ${assignSelection.includes(k.id) ? 'completed' : ''}`}>
                                    {assignSelection.includes(k.id) ? '✓' : ''}
                                </div>
                                <span style={{ fontSize: 22 }}>{k.avatar}</span>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{k.displayName || k.name}</span>
                            </div>
                        ))}
                        {kids.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No kids added yet.</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setShowAssign(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSaveAssign}>Save Assignment</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
