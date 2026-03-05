import { useState } from 'react'
import Modal from './Modal'
import useStore from '../store/useStore'

export default function FamilyCodeModal({ onClose }) {
    const { familyId, setFamilyId } = useStore()
    const [inputCode, setInputCode] = useState('')
    const [copied, setCopied] = useState(false)
    const [mode, setMode] = useState('view') // 'view' | 'join'

    const handleCopy = () => {
        navigator.clipboard.writeText(familyId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleJoin = () => {
        if (!inputCode.trim()) return
        setFamilyId(inputCode.trim())
        window.location.reload()
    }

    return (
        <Modal title="🔑 Family Code" onClose={onClose}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                <button className={`chip ${mode === 'view' ? 'selected' : ''}`} onClick={() => setMode('view')}>My Code</button>
                <button className={`chip ${mode === 'join' ? 'selected' : ''}`} onClick={() => setMode('join')}>Join Another</button>
            </div>

            {mode === 'view' ? (
                <div className="col">
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                        Share this code with any device to sync your family's data in real-time via Firebase.
                    </p>
                    <div style={{
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 'var(--radius-md)', padding: '16px 20px',
                        fontFamily: 'monospace', fontSize: 15, letterSpacing: '1px',
                        wordBreak: 'break-all', color: 'var(--accent-purple-light)',
                    }}>
                        {familyId}
                    </div>
                    <button className="btn btn-primary" onClick={handleCopy}>
                        {copied ? '✅ Copied!' : '📋 Copy Code'}
                    </button>
                </div>
            ) : (
                <div className="col">
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                        Enter a family code from another device to switch to that family's data.
                    </p>
                    <div className="form-group">
                        <label>Family Code</label>
                        <input type="text" value={inputCode} onChange={(e) => setInputCode(e.target.value)}
                            placeholder="Paste code here…" autoFocus />
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleJoin} disabled={!inputCode.trim()}>
                            Switch Family
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    )
}
