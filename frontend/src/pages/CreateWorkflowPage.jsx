import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, Table2, Image, Video, X, Plus,
  ArrowRight, AlertCircle, FileCode, Loader
} from 'lucide-react'
import TopBar from '../components/TopBar'
import { uploadFiles } from '../api/client'

const FILE_TYPE_META = {
  pdf:   { label: 'PDF',   color: 'text-red-400    bg-red-900/20    border-red-800/30' },
  pptx:  { label: 'PPTX',  color: 'text-orange-400 bg-orange-900/20 border-orange-800/30' },
  ppt:   { label: 'PPT',   color: 'text-orange-400 bg-orange-900/20 border-orange-800/30' },
  docx:  { label: 'DOCX',  color: 'text-blue-400   bg-blue-900/20   border-blue-800/30' },
  doc:   { label: 'DOC',   color: 'text-blue-400   bg-blue-900/20   border-blue-800/30' },
  csv:   { label: 'CSV',   color: 'text-green-400  bg-green-900/20  border-green-800/30' },
  xlsx:  { label: 'XLSX',  color: 'text-green-400  bg-green-900/20  border-green-800/30' },
  json:  { label: 'JSON',  color: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30' },
  mp4:   { label: 'MP4',   color: 'text-purple-400 bg-purple-900/20 border-purple-800/30' },
  mov:   { label: 'MOV',   color: 'text-purple-400 bg-purple-900/20 border-purple-800/30' },
  png:   { label: 'PNG',   color: 'text-cyan-400   bg-cyan-900/20   border-cyan-800/30' },
  jpg:   { label: 'JPG',   color: 'text-cyan-400   bg-cyan-900/20   border-cyan-800/30' },
  txt:   { label: 'TXT',   color: 'text-zinc-400   bg-zinc-800/30   border-zinc-700/30' },
}

function getFileMeta(name) {
  const ext = name.split('.').pop().toLowerCase()
  return FILE_TYPE_META[ext] || { label: ext.toUpperCase(), color: 'text-zinc-400 bg-zinc-800/30 border-zinc-700/30' }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileTypeIcon({ name }) {
  const ext = name.split('.').pop().toLowerCase()
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return <Video size={15} className="text-purple-400" />
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) return <Image size={15} className="text-cyan-400" />
  if (['csv', 'xlsx', 'xls'].includes(ext)) return <Table2 size={15} className="text-green-400" />
  if (['json'].includes(ext)) return <FileCode size={15} className="text-yellow-400" />
  return <FileText size={15} className="text-orange-400" />
}

const ACCEPT = '.pdf,.docx,.doc,.pptx,.ppt,.csv,.xlsx,.xls,.json,.txt,.png,.jpg,.jpeg,.mp4,.mov,.avi,.mkv'

export default function CreateWorkflowPage({ user }) {
  const [files, setFiles]             = useState([])
  const [dragging, setDragging]       = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [context, setContext]         = useState('')
  const [uploading, setUploading]     = useState(false)
  const [error, setError]             = useState('')
  const fileInputRef                  = useRef()
  const navigate                      = useNavigate()

  const addFiles = useCallback((newFiles) => {
    const items = Array.from(newFiles).map(f => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: f.size,
      file: f,
    }))
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...items.filter(f => !existing.has(f.name))]
    })
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id))

  const handleStart = async () => {
    if (files.length === 0 || uploading) return
    setError('')
    setUploading(true)
    try {
      const { job_id } = await uploadFiles(files, workflowName)
      navigate(`/processing/${job_id}`)
    } catch (err) {
      setError(err.message || 'Upload failed. Is the backend running?')
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <TopBar user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
            <span>Workspace</span><span>/</span>
            <span className="text-orange-400">New Analysis</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Create Analysis Workflow</h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload your data sources. Supported: PDF, PPTX, DOCX, CSV, Excel, JSON, images, and video.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT — Upload + Files */}
          <div className="col-span-2 space-y-5">

            {/* Workflow name */}
            <div className="card">
              <label className="block text-xs font-medium text-text-secondary mb-2">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                placeholder="e.g., Q1 Financial Analysis"
                className="input-base"
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                dragging
                  ? 'border-orange-500 bg-orange-500/5'
                  : 'border-surface-border hover:border-orange-500/40 hover:bg-surface-raised/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT}
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                dragging ? 'bg-orange-500/20' : 'bg-surface-elevated'
              }`}>
                <Upload size={22} className={dragging ? 'text-orange-400' : 'text-text-muted'} />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">
                {dragging ? 'Drop files here' : 'Drop files or click to browse'}
              </p>
              <p className="text-xs text-text-muted text-center leading-relaxed">
                PDF, PPTX, DOCX, CSV, XLSX, JSON, TXT<br />PNG, JPG, MP4, MOV — up to 500 MB per file
              </p>
              <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
                {['PDF', 'PPTX', 'CSV', 'MP4', 'PNG', 'JSON'].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded border border-surface-border text-text-muted">{t}</span>
                ))}
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Queued Files</p>
                  <span className="badge bg-surface-elevated text-text-muted border border-surface-border">
                    {files.length} file{files.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-2">
                  {files.map(f => {
                    const meta = getFileMeta(f.name)
                    return (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-surface-elevated rounded-lg border border-surface-border/50 group">
                        <FileTypeIcon name={f.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{f.name}</p>
                          <p className="text-xs text-text-muted">{formatSize(f.size)}</p>
                        </div>
                        <span className={`badge border text-xs ${meta.color}`}>{meta.label}</span>
                        <button
                          onClick={() => removeFile(f.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all ml-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <Plus size={13} /> Add more files
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-900/10 border border-red-800/30 rounded-xl">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* RIGHT — Config */}
          <div className="space-y-5">
            <div className="card">
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Analysis Focus <span className="text-text-muted">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="What are you looking for? e.g., Find revenue inconsistencies and customer churn patterns..."
                className="input-base resize-none text-sm"
              />
            </div>

            <div className="card">
              <p className="section-title">Supported sources</p>
              <div className="space-y-2.5">
                {[
                  { icon: FileText, label: 'Documents',      desc: 'PDF, DOCX, PPTX, TXT' },
                  { icon: Table2,   label: 'Structured Data', desc: 'CSV, Excel, JSON' },
                  { icon: Image,    label: 'Images',          desc: 'PNG, JPG, BMP, TIFF' },
                  { icon: Video,    label: 'Video',           desc: 'MP4, MOV, AVI, MKV' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-surface-elevated flex items-center justify-center border border-surface-border">
                      <Icon size={13} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 bg-surface-elevated rounded-xl border border-surface-border">
              <AlertCircle size={13} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-xs text-text-secondary leading-relaxed">
                Upload multiple files to enable cross-document conflict detection and entity resolution.
              </p>
            </div>

            <button
              onClick={handleStart}
              disabled={files.length === 0 || uploading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              {uploading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Start Analysis
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            {files.length === 0 && !uploading && (
              <p className="text-center text-xs text-text-muted -mt-2">Add at least one file to proceed</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
