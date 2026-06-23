import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, X, CheckCircle } from 'lucide-react'
import { useSearchStore } from '../store/useSearchStore'
import { useNavigate } from 'react-router-dom'

export default function ImageUploader({ onUploaded, showSearch = true }) {
  const { setQueryImage, queryImagePreview, clearImage, searchImage, isLoading } = useSearchStore()
  const navigate = useNavigate()

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setQueryImage(file, preview)
  }, [setQueryImage])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    multiple: false,
  })

  const handleSearch = async () => {
    const { queryImage } = useSearchStore.getState()
    if (!queryImage) return
    await searchImage(queryImage)
    navigate('/results')
  }

  return (
    <div className="uploader-wrap">
      <AnimatePresence mode="wait">
        {!queryImagePreview ? (
          <motion.div
            key="drop"
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'drag-active' : ''} ${isDragReject ? 'drag-reject' : ''}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <input {...getInputProps()} />
            <div className="dropzone-inner">
              <motion.div
                className="dropzone-icon"
                animate={{ y: isDragActive ? -8 : 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Upload size={32} />
              </motion.div>
              <p className="dropzone-title">
                {isDragActive ? 'Drop your image here!' : 'Drag & drop an image'}
              </p>
              <p className="text-sm text-3">or click to browse · JPG, PNG, WebP, GIF</p>
              <div className="dropzone-formats">
                <span className="badge badge-accent">Image Search</span>
                <span className="badge badge-accent">Reverse Search</span>
                <span className="badge badge-accent">Similar Products</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            className="preview-wrap"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="preview-img-wrap">
              <img src={queryImagePreview} alt="Selected" className="preview-img" />
              <button className="preview-remove" onClick={clearImage} title="Remove image">
                <X size={14} />
              </button>
              <div className="preview-ready-badge">
                <CheckCircle size={13} /> Ready to search
              </div>
            </div>
            {showSearch && (
              <button
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center', marginTop: 12 }}
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading
                  ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  : <ImageIcon size={16} />
                }
                {isLoading ? 'Searching…' : 'Find Similar Images'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .uploader-wrap { width: 100%; }
        .dropzone {
          border: 2px dashed var(--clr-border-2);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          cursor: pointer;
          transition: all var(--transition);
          background: var(--clr-surface);
          text-align: center;
        }
        .dropzone:hover, .dropzone.drag-active {
          border-color: var(--clr-accent);
          background: rgba(124,92,250,0.05);
          box-shadow: 0 0 0 4px rgba(124,92,250,0.08);
        }
        .dropzone.drag-reject { border-color: var(--clr-error); background: rgba(242,92,110,0.05); }
        .dropzone-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .dropzone-icon {
          width: 64px; height: 64px; border-radius: var(--radius-lg);
          background: rgba(124,92,250,0.1); border: 1px solid rgba(124,92,250,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--clr-accent);
        }
        .dropzone-title { font-size: 1rem; font-weight: 700; color: var(--clr-text); }
        .dropzone-formats { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
        .preview-wrap { display: flex; flex-direction: column; }
        .preview-img-wrap { position: relative; border-radius: var(--radius-lg); overflow: hidden; }
        .preview-img { width: 100%; max-height: 320px; object-fit: contain; background: var(--clr-surface); }
        .preview-remove {
          position: absolute; top: 10px; right: 10px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(8,11,20,0.8); color: #fff;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.2); cursor: pointer;
          backdrop-filter: blur(4px); transition: all var(--transition-fast);
        }
        .preview-remove:hover { background: var(--clr-error); }
        .preview-ready-badge {
          position: absolute; bottom: 10px; left: 10px;
          display: flex; align-items: center; gap: 5px;
          background: rgba(34,211,160,0.15); border: 1px solid rgba(34,211,160,0.3);
          color: var(--clr-success); font-size: 0.75rem; font-weight: 600;
          padding: 4px 10px; border-radius: var(--radius-full);
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  )
}
