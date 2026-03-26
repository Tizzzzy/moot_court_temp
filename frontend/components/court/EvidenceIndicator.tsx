import { FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EvidenceIndicatorProps {
  evidenceCount: number;
  evidenceNames: string[];
  onDismiss: () => void;
}

export function EvidenceIndicator({ evidenceCount, evidenceNames, onDismiss }: EvidenceIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-24 right-6 bg-white rounded-xl shadow-lg border border-[#e2e8f0] p-4 max-w-sm transition-all duration-300 z-40 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="bg-[#dcfce7] rounded-lg p-2 shrink-0">
          <FileText className="w-5 h-5 text-[#016630]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#0a0a0a] text-sm mb-1">
            Evidence Submitted to Court
          </h4>
          <p className="text-xs text-[#64748b] mb-2">
            {evidenceCount} {evidenceCount === 1 ? 'document' : 'documents'} uploaded successfully
          </p>
          <div className="space-y-1">
            {evidenceNames.slice(0, 3).map((name, index) => (
              <div key={index} className="text-xs text-[#45556c] truncate">
                • {name}
              </div>
            ))}
            {evidenceNames.length > 3 && (
              <div className="text-xs text-[#64748b] italic">
                +{evidenceNames.length - 3} more
              </div>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-[#94a3b8] hover:text-[#64748b] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
