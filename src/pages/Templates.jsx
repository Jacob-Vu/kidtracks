import { useState } from 'react'
import useStore from '../store/useStore'
import Modal from '../components/Modal'

export default function Templates() {
    const { templates, addTemplate, updateTemplate, deleteTemplate } = useStore()
    const [showAdd, setShowAdd] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const openAdd = () => { setTitle(''); setDescription(''); setShowAdd(true) }
    const openEdit = (t) => { setEditItem(t); setTitle(t.title); setDescription(t.description) }

    const handleSave = () => {
        if (!title.trim()) return
        if (editItem) {
            updateTemplate(editItem.id, { title: title.trim(), description: description.trim() })
            setEditItem(null)
        } else {
            addTemplate(title.trim(), description.trim())
            setShowAdd(false)
        }
        setTitle(''); setDescription('')
    }

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">📋 Task Templates</h1>
                    <p className="page-subtitle">Create reusable tasks that can be loaded for any day</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>+ New Template</button>
            </div>

            {templates.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">📋</span>
                    <p className="empty-state-title">No templates yet</p>
                    <p className="empty-state-desc">Create task templates like "Make bed", "Do homework" and quickly load them for daily tasks.</p>
                    <button className="btn btn-primary" onClick={openAdd}>+ Create First Template</button>
                </div>
            ) : (
                <div className="col">
                    {templates.map((t, i) => (
                        <div key={t.id} className="task-item animate-in" style={{ animationDelay: `${i * 40}ms` }}>
                            <span style={{ fontSize: 22 }}>📌</span>
                            <div style={{ flex: 1 }}>
                                <div className="task-title">{t.title}</div>
                                {t.description && <div className="task-desc">{t.description}</div>}
                            </div>
                            <div className="task-actions" style={{ opacity: 1 }}>
                                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(t)} title="Edit">✏️</button>
                                <button
                                    className="btn btn-danger btn-icon btn-sm"
                                    onClick={() => deleteTemplate(t.id)}
                                    title="Delete"
                                >🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(showAdd || editItem) && (
                <Modal title={editItem ? 'Edit Template' : 'New Template'} onClose={() => { setShowAdd(false); setEditItem(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>Task Title</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Make your bed" autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                placeholder="Additional notes..." rows={3} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditItem(null) }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>Save</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
