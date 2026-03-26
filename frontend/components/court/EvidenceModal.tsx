import { X, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import svgPaths from '../../imports/svg-7c37ug1uh2';

interface Evidence {
  id: string;
  name: string;
  isValid: boolean;
  selected: boolean;
}

export interface EvidenceItem {
  title: string;
  folderName: string;
  isReady: boolean;
}

interface EvidenceModalProps {
  isOpen?: boolean;
  onSubmit: (selectedEvidence: string[], uploadedFiles: File[]) => void;
  onCancel: () => void;
  availableEvidence?: EvidenceItem[]; // Evidence from user's dashboard
}

export function EvidenceModal({ isOpen = true, onSubmit, onCancel, availableEvidence = [] }: EvidenceModalProps) {
  // Convert available evidence to selectable format
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (availableEvidence.length > 0) {
      setEvidence(availableEvidence.map((e) => ({
        id: e.folderName,
        name: e.title,
        isValid: e.isReady,
        selected: false
      })));
    } else {
      setEvidence([]);
    }
  }, [availableEvidence]);

  if (!isOpen) return null;

  const selectedCount = evidence.filter(e => e.selected).length;
  const totalCount = evidence.length;

  const toggleEvidence = (id: string) => {
    setEvidence(prev => prev.map(e => 
      e.id === id ? { ...e, selected: !e.selected } : e
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = () => {
    const selectedIds = evidence.filter(e => e.selected).map(e => e.id);
    onSubmit(selectedIds, uploadedFiles);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-[856px] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-[#0a0a0a]">Upload Evidence</h2>
            <p className="text-[#45556c]">{selectedCount + uploadedFiles.length} items</p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#64748b] hover:text-[#0a0a0a] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Evidence List - Only show if user has pre-uploaded evidence */}
        <div className="p-6 space-y-3">
          {evidence.length === 0 && (
            <div className="text-center py-4 text-[#64748b]">
              <p className="text-sm">No evidence uploaded from your dashboard yet.</p>
              <p className="text-xs mt-1">You can upload new files below.</p>
            </div>
          )}
          {evidence.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleEvidence(item.id)}
              className="w-full bg-[#eff6ff] border border-[#bedbff] rounded-[10px] h-12 px-4 flex items-center gap-3 hover:bg-[#dbeafe] transition-colors"
            >
              {/* Checkbox */}
              <div className={`size-4 rounded flex items-center justify-center shrink-0 ${
                item.selected ? 'bg-[#030213]' : 'bg-white border border-[#cbd5e1]'
              }`}>
                {item.selected && (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                    <path
                      d={svgPaths.p3de7e600}
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.16667"
                    />
                  </svg>
                )}
              </div>

              {/* Label */}
              <span className="flex-1 text-left font-medium text-[14px] text-[#0f172b]">
                {item.name}
              </span>

              {/* Validity Badge */}
              {item.isValid ? (
                <div className="bg-[#dcfce7] border border-[#b9f8cf] rounded-lg px-2 py-0.5 flex items-center gap-2 shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <g clipPath="url(#clip-valid)">
                      <path
                        d={svgPaths.p3e7757b0}
                        stroke="#016630"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.5 6L5.5 7L7.5 5"
                        stroke="#016630"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip-valid">
                        <rect fill="white" height="12" width="12" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="text-[12px] font-medium text-[#016630]">Valid</span>
                </div>
              ) : (
                <div className="bg-[#fef9c2] border border-[#ac7f5e] rounded-lg px-2 py-0.5 flex items-center gap-2 shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <g clipPath="url(#clip-invalid)">
                      <path
                        d={svgPaths.p3e7757b0}
                        stroke="#AC7F5E"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.5 4.5L4.5 7.5"
                        stroke="#AC7F5E"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4.5 4.5L7.5 7.5"
                        stroke="#AC7F5E"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip-invalid">
                        <rect fill="white" height="12" width="12" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="text-[12px] font-medium text-[#ac7f5e]">Invalid</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Upload Section */}
        <div className="px-6 pb-4">
          <div className="border-t border-[#e2e8f0] pt-4">
            <label className="w-full border-2 border-dashed border-[#cbd5e1] rounded-[10px] h-14 flex items-center gap-3 px-5 cursor-pointer hover:border-[#94a3b8] transition-colors">
              <Upload className="w-5 h-5 text-[#64748b]" />
              <span className="text-[14px] text-[#64748b]">
                Upload additional evidence (PDF, JPG, PNG)
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadedFiles.length > 0 && (
              <div className="mt-2 text-sm text-[#45556c]">
                {uploadedFiles.length} file(s) uploaded
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="bg-white text-[#64748b] border border-[#cbd5e1] px-6 py-2.5 rounded-[10px] font-medium hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedCount === 0 && uploadedFiles.length === 0}
            className="bg-[#155dfc] text-white px-6 py-2.5 rounded-[10px] font-medium hover:bg-[#0d4fd6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload Evidence
          </button>
        </div>
      </div>
    </div>
  );
}