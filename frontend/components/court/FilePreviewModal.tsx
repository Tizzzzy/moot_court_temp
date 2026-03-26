import { X, Download, FileText } from 'lucide-react';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: EvidenceFile | null;
}

export function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

  const canPreviewPdf = Boolean(file.previewUrl && file.type.includes('pdf'));
  const canPreviewImage = Boolean(file.previewUrl && file.type.includes('image'));
  const canPreview = canPreviewPdf || canPreviewImage;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = () => {
    if (!file.previewUrl) return;
    const link = document.createElement('a');
    link.href = file.previewUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="font-semibold text-[#0a0a0a] text-lg truncate">{file.name}</h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                {formatFileSize(file.size)} • {file.type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                disabled={!file.previewUrl}
                className="bg-[#f1f5f9] text-[#475569] px-4 py-2 rounded-lg hover:bg-[#e2e8f0] transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download</span>
              </button>
              <button
                onClick={onClose}
                className="text-[#64748b] hover:text-[#0a0a0a] transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 min-h-[500px] flex flex-col items-center justify-center">
              {canPreviewPdf && (
                <iframe
                  src={file.previewUrl}
                  title={file.name}
                  className="w-full h-[70vh] rounded-lg border border-[#e2e8f0]"
                />
              )}

              {canPreviewImage && (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}

              {!canPreview && (
                <div className="text-center max-w-xl">
                  <div className="bg-[#f1f5f9] rounded-full p-6 inline-flex mb-6">
                    <FileText className="w-16 h-16 text-[#475569]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#0a0a0a] mb-3">Preview not available</h3>
                  <p className="text-[#64748b] mb-4">
                    This file type cannot be rendered inline. Use Download to open it locally.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
