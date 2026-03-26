import { X, FileText, Image, File } from 'lucide-react';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
}

interface EvidenceViewModalProps {
  onClose: () => void;
  evidenceFiles: EvidenceFile[];
}

export function EvidenceViewModal({ onClose, evidenceFiles }: EvidenceViewModalProps) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-6 h-6 text-[#475569]" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <Image className="w-6 h-6 text-[#475569]" />;
    return <File className="w-6 h-6 text-[#475569]" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl text-[#1e293b]">Your Evidence</h2>
            <p className="text-sm text-[#64748b] mt-1">
              {evidenceFiles.length} {evidenceFiles.length === 1 ? 'file' : 'files'} uploaded
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {evidenceFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
              <p className="text-[#64748b]">No evidence uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evidenceFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="w-12 h-12 bg-[#f1f5f9] rounded-lg flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1e293b] truncate font-medium">{file.name}</p>
                    <p className="text-xs text-[#64748b] mt-1">
                      {(file.size / 1024).toFixed(1)} KB • {file.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-6 py-4 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#155dfc] text-white rounded-lg hover:bg-[#1047d0] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}