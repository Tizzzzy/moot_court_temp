import { X, Upload, CheckCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UploadEvidenceModalProps {
  onSubmit: (uploadedFiles: File[]) => void;
  onCancel: () => void;
}

export function UploadEvidenceModal({ onSubmit, onCancel }: UploadEvidenceModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDeleteFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(uploadedFiles);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl text-[#1e293b]">Upload Evidence</h2>
            <p className="text-sm text-[#64748b] mt-1">
              Add supporting documents to your answer
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Section */}
          <div>
            <label className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-[#cbd5e1] rounded-lg cursor-pointer hover:border-[#155dfc] hover:bg-[#f8fafc] transition-colors">
              <Upload className="w-12 h-12 text-[#64748b]" />
              <div className="text-center">
                <p className="text-sm font-medium text-[#1e293b] mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[#64748b]">
                  PDF, JPG, PNG (max 10MB each)
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#1e293b] mb-3">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                      <span className="text-sm text-[#475569] truncate">{file.name}</span>
                      <span className="text-xs text-[#94a3b8] flex-shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(index);
                      }}
                      className="text-[#64748b] hover:text-[#dc2626] transition-colors p-1 flex-shrink-0"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-[#e2e8f0] rounded-lg text-[#475569] hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploadedFiles.length === 0}
            className="px-6 py-2 bg-[#155dfc] text-white rounded-lg hover:bg-[#1047d0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
