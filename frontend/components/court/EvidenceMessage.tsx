import { FileText, File, FileImage, FileArchive } from 'lucide-react';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
}

interface EvidenceMessageProps {
  files: EvidenceFile[];
}

export function EvidenceMessage({ files }: EvidenceMessageProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-[#dc2626]" />;
    if (type.includes('image')) return <FileImage className="w-4 h-4 text-[#2563eb]" />;
    if (type.includes('zip')) return <FileArchive className="w-4 h-4 text-[#f59e0b]" />;
    return <File className="w-4 h-4 text-[#64748b]" />;
  };

  return (
    <div className="flex justify-end mb-4 animate-fadeIn">
      <div className="max-w-[70%]">
        <div className="bg-[#f0f4ff] border border-[#cbd5e1] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-[#155dfc] rounded-full p-1.5">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#0a0a0a]">
              Evidence Submitted ({files.length})
            </span>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 flex items-center gap-3 border border-[#e2e8f0]"
              >
                <div className="bg-[#f8fafc] rounded-lg p-2 border border-[#e2e8f0]">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0a0a0a] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 pt-3 border-t border-[#cbd5e1]">
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <div className="bg-[#dcfce7] rounded-full p-1">
                <svg className="w-2.5 h-2.5 text-[#016630]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Submitted to the court</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
