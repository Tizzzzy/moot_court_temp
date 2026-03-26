import { X, Upload, CheckCircle, Trash2, FileText, Image, File } from 'lucide-react';
import { useState } from 'react';

interface EvidenceFile {
  name: string;
  type: string;
  size: number;
}

interface SelectOrUploadEvidenceModalProps {
  onSubmit: (uploadedFiles: File[]) => void;
  onCancel: () => void;
  existingEvidence: EvidenceFile[];
}

export function SelectOrUploadEvidenceModal({ onSubmit, onCancel, existingEvidence }: SelectOrUploadEvidenceModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedExisting, setSelectedExisting] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDeleteFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleExistingEvidence = (fileName: string) => {
    setSelectedExisting(prev =>
      prev.includes(fileName) ? prev.filter(name => name !== fileName) : [...prev, fileName]
    );
  };

  const handleSubmit = () => {
    onSubmit(uploadedFiles);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-[#475569]" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <Image className="w-5 h-5 text-[#475569]" />;
    return <File className="w-5 h-5 text-[#475569]" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl text-[#1e293b]">Add Evidence</h2>
            <p className="text-sm text-[#64748b] mt-1">
              Reference existing evidence or upload new files
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
          {/* Existing Evidence */}
          {existingEvidence.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#1e293b] mb-3">
                Select from Existing Evidence ({existingEvidence.length})
              </h3>
              <div className="space-y-2">
                {existingEvidence.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => toggleExistingEvidence(file.name)}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedExisting.includes(file.name)
                        ? 'bg-[#eff6ff] border-[#155dfc]'
                        : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedExisting.includes(file.name)
                        ? 'bg-[#155dfc] border-[#155dfc]'
                        : 'bg-white border-[#cbd5e1]'
                    }`}>
                      {selectedExisting.includes(file.name) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#475569] truncate font-medium">{file.name}</p>
                      <p className="text-xs text-[#94a3b8]">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedExisting.length > 0 && (
                <p className="text-sm text-[#155dfc] mt-2">
                  {selectedExisting.length} existing {selectedExisting.length === 1 ? 'file' : 'files'} selected (will be referenced in your response)
                </p>
              )}
            </div>
          )}

          {/* Upload New Evidence */}
          <div>
            <h3 className="text-sm font-medium text-[#1e293b] mb-3">
              Upload New Evidence
            </h3>
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
                New Files ({uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-[#f0fdf4] border border-[#86efac] rounded-lg"
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
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-6 py-4 flex justify-between items-center rounded-b-2xl">
          <p className="text-sm text-[#64748b]">
            {selectedExisting.length > 0 && `${selectedExisting.length} referenced • `}
            {uploadedFiles.length > 0 && `${uploadedFiles.length} new`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-[#e2e8f0] rounded-lg text-[#475569] hover:bg-[#f8fafc] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploadedFiles.length === 0 && selectedExisting.length === 0}
              className="px-6 py-2 bg-[#155dfc] text-white rounded-lg hover:bg-[#1047d0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadedFiles.length > 0 ? `Upload (${uploadedFiles.length})` : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
