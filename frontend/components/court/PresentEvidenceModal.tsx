import { X, CheckCircle, AlertCircle, Upload, Lightbulb, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface EvidenceItem {
  id: string;
  name: string;
  status: 'valid' | 'invalid';
}

interface PresentEvidenceModalProps {
  onSubmit: (selectedEvidence: string[], statement: string, uploadedFiles: File[]) => void;
  onCancel: () => void;
}

const availableEvidence: EvidenceItem[] = [
  { id: '1', name: 'Lease Agreement', status: 'valid' },
  { id: '2', name: 'Move-out photos', status: 'invalid' },
  { id: '3', name: 'Email from landlord', status: 'valid' },
  { id: '4', name: 'Text messages', status: 'valid' },
  { id: '5', name: 'Bank statements', status: 'valid' },
  { id: '6', name: 'Cleaning receipts', status: 'valid' },
];

export function PresentEvidenceModal({ onSubmit, onCancel }: PresentEvidenceModalProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>(
    availableEvidence.map(item => item.id)
  );
  const [statement, setStatement] = useState(
    "Your Honor, I'm seeking the return of my $2,000 security deposit. I moved out on December 1. I cleaned the apartment thoroughly, as my photos show. The landlord kept the entire deposit claiming 'excessive cleaning' and 'wall damage,' but these damages were normal wear and tear."
  );
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const toggleEvidence = (id: string) => {
    setSelectedEvidence(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEvidence.length === availableEvidence.length) {
      setSelectedEvidence([]);
    } else {
      setSelectedEvidence(availableEvidence.map(item => item.id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDeleteFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(selectedEvidence, statement, uploadedFiles);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl text-[#1e293b]">Present your case</h2>
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
          {/* Instructions */}
          <div>
            <p className="text-lg text-[#1e293b] mb-2">
              Please state your name and explain why you're here today.
            </p>
            <p className="text-sm text-[#64748b]">
              The judge wants to understand the basics of your case right away.
            </p>
          </div>

          {/* Tips Box */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-[#155dfc] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm text-[#1e293b] mb-2">Tips for answering:</h3>
                <ul className="text-sm text-[#475569] space-y-1 list-disc list-inside">
                  <li>Speak clearly and confidently</li>
                  <li>State your name first</li>
                  <li>Briefly explain what you're claiming and why</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Evidence Selection */}
          <div className="border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg text-[#1e293b]">Choose Your Evidence</h3>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-[#155dfc] hover:text-[#1047d0]"
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedEvidence.length === availableEvidence.length
                    ? 'bg-[#155dfc] border-[#155dfc]'
                    : 'border-[#cbd5e1]'
                }`}>
                  {selectedEvidence.length === availableEvidence.length && (
                    <CheckCircle className="w-4 h-4 text-white" />
                  )}
                </div>
                Select all
              </button>
            </div>
            <p className="text-sm text-[#64748b] mb-4">
              {selectedEvidence.length} of {availableEvidence.length} items selected
            </p>
            <p className="text-sm text-[#64748b] mb-4">
              Select which evidence you want to practice presenting
            </p>

            <div className="space-y-3">
              {availableEvidence.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleEvidence(item.id)}
                  className="flex items-center justify-between p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg cursor-pointer hover:bg-[#dbeafe] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedEvidence.includes(item.id)
                        ? 'bg-[#155dfc] border-[#155dfc]'
                        : 'bg-white border-[#cbd5e1]'
                    }`}>
                      {selectedEvidence.includes(item.id) && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-[#1e293b]">{item.name}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs ${
                    item.status === 'valid'
                      ? 'bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7]'
                      : 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a]'
                  }`}>
                    {item.status === 'valid' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span className="capitalize">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Section */}
            <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-[#cbd5e1] rounded-lg cursor-pointer hover:border-[#155dfc] hover:bg-[#f8fafc] transition-colors">
                <Upload className="w-5 h-5 text-[#64748b]" />
                <span className="text-sm text-[#64748b]">Upload additional evidence (PDF, JPG, PNG)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                        <span className="text-sm text-[#475569]">{file.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(index);
                        }}
                        className="text-[#64748b] hover:text-[#dc2626] transition-colors p-1"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Statement Textarea */}
          <div>
            <label className="block text-sm text-[#475569] mb-2">Your answer:</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={5}
              className="w-full p-4 border border-[#e2e8f0] rounded-lg text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#155dfc] focus:border-transparent resize-none"
              placeholder="Type your opening statement here..."
            />
          </div>
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
            className="px-6 py-2 bg-[#155dfc] text-white rounded-lg hover:bg-[#1047d0] transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}