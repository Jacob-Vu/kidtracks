import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import VoiceMicButton from '../components/VoiceMicButton'
import { useFireActions } from '../hooks/useFirebaseSync'
import { trackTaskCreated } from '../hooks/useAnalytics'
import { useT } from '../i18n/I18nContext'
import useStore from '../store/useStore'

const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/

export default function TaskEditorPage() {
  const t = useT()
  const navigate = useNavigate()
  const { kidId, taskId } = useParams()
  const [searchParams] = useSearchParams()
  const { kids, dailyTasks } = useStore()
  const { addDailyTask, updateDailyTask } = useFireActions()

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedKid = kids.find((kid) => kid.id === kidId)
  const editTask = useMemo(
    () => dailyTasks.find((task) => task.id === taskId && task.kidId === kidId),
    [dailyTasks, taskId, kidId],
  )
  const isEditing = !!taskId

  const queryDate = searchParams.get('date')
  const fallbackDate = DATE_PARAM_RE.test(queryDate || '')
    ? queryDate
    : format(new Date(), 'yyyy-MM-dd')
  const effectiveDate = editTask?.date || fallbackDate
  const backToDailyPath = `/daily/${kidId}?date=${effectiveDate}`

  useEffect(() => {
    if (isEditing) {
      setTaskTitle(editTask?.title || '')
      setTaskDesc(editTask?.description || '')
      return
    }
    setTaskTitle('')
    setTaskDesc('')
  }, [isEditing, editTask?.id, editTask?.title, editTask?.description])

  useEffect(() => {
    if (isEditing && taskId && dailyTasks.length > 0 && !editTask) {
      navigate(backToDailyPath, { replace: true })
    }
  }, [isEditing, taskId, dailyTasks.length, editTask, navigate, backToDailyPath])

  const handleCancel = () => {
    navigate(backToDailyPath)
  }

  const handleSave = async () => {
    const nextTitle = taskTitle.trim()
    if (!nextTitle || !kidId) return

    setSaving(true)
    try {
      if (isEditing && editTask) {
        await updateDailyTask(editTask.id, { title: nextTitle, description: taskDesc.trim() })
      } else {
        await addDailyTask(kidId, effectiveDate, nextTitle, taskDesc.trim())
        trackTaskCreated({
          kid_id: kidId,
          source: 'manual',
          has_description: !!taskDesc.trim(),
          task_type: 'daily_task',
        })
      }
      navigate(backToDailyPath, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="task-editor-page">
      <div className="page-header">
        <h1 className="page-title">{isEditing ? t('daily.editTask') : t('daily.addTaskTitle')}</h1>
        <p className="page-subtitle">
          {selectedKid ? `${selectedKid.avatar} ${selectedKid.displayName || selectedKid.name}` : ''}
        </p>
      </div>

      <div className="card task-editor-card">
        <div className="col">
          <div className="form-group">
            <label>{t('tmpl.taskTitle')}</label>
            <div className="form-group-row">
              <input
                type="text"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder={t('daily.whatTodo')}
                autoFocus
                onKeyDown={(event) => event.key === 'Enter' && handleSave()}
              />
              <VoiceMicButton
                field="task_title"
                role="parent"
                onAppend={(text) => setTaskTitle((prev) => (prev ? `${prev} ${text}` : text))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('tmpl.descLabel')}</label>
            <div className="form-group-row">
              <textarea
                value={taskDesc}
                onChange={(event) => setTaskDesc(event.target.value)}
                placeholder={t('daily.additionalDetails')}
                rows={4}
              />
              <VoiceMicButton
                field="task_description"
                role="parent"
                onAppend={(text) => setTaskDesc((prev) => (prev ? `${prev} ${text}` : text))}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={handleCancel} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!taskTitle.trim() || saving}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
