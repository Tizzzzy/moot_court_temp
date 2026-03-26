import { X, FileText, File, FileImage, FileArchive, Eye } from 'lucide-react';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  serverFilename?: string;
  previewUrl?: string;
}

interface EvidenceSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceFiles: EvidenceFile[];
  onPreview: (file: EvidenceFile) => void;
}

export function EvidenceSidePanel({ isOpen, onClose, evidenceFiles, onPreview }: EvidenceSidePanelProps) {
  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-[#dc2626]" />;
    if (type.includes('image')) return <FileImage className="w-5 h-5 text-[#2563eb]" />;
    if (type.includes('zip')) return <FileArchive className="w-5 h-5 text-[#f59e0b]" />;
    return <File className="w-5 h-5 text-[#64748b]" />;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#0a0a0a] text-lg">Submitted Evidence</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              {evidenceFiles.length} {evidenceFiles.length === 1 ? 'document' : 'documents'} submitted to court
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#0a0a0a] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Evidence List */}
        <div className="flex-1 overflow-y-auto">
          {evidenceFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="bg-[#f1f5f9] rounded-full p-4 mb-4">
                <FileText className="w-8 h-8 text-[#94a3b8]" />
              </div>
              <h3 className="font-medium text-[#0a0a0a] mb-2">No Evidence Submitted</h3>
              <p className="text-sm text-[#64748b]">
                Upload evidence using the document icon in the chat bar below
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {evidenceFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 hover:border-[#cbd5e1] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* File Icon */}
                    <div className="bg-white rounded-lg p-2.5 border border-[#e2e8f0] shrink-0">
                      {getFileIcon(file.type)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#0a0a0a] text-sm truncate mb-1">
                        {file.name}
                      </h4>
                      <p className="text-xs text-[#64748b]">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    {/* Preview Button */}
                    <button
                      onClick={() => onPreview(file)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#155dfc] text-white p-2 rounded-lg hover:bg-[#0d4fd6]"
                      title="Preview file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#e2e8f0] px-6 py-4 bg-[#f8fafc]">
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <div className="bg-[#dcfce7] rounded-full p-1.5">
              <svg className="w-3 h-3 text-[#016630]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>All evidence has been submitted to the court</span>
          </div>
        </div>
      </div>
    </>
  );
}
