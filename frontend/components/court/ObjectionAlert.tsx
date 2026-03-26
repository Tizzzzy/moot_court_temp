import { AlertTriangle } from 'lucide-react';

interface ObjectionAlertProps {
  objectionType?: string;
  reason?: string;
}

export function ObjectionAlert({ objectionType, reason }: ObjectionAlertProps) {
  // Detect if it's a plaintiff objection
  const isPlaintiffObjection = objectionType?.includes('Plaintiff Objection');
  
  // For plaintiff objections, use the objectionType as-is (already includes "Plaintiff Objection - ")
  // For defendant objections, add the "Defendant Objection - " prefix
  const displayText = isPlaintiffObjection 
    ? objectionType 
    : `Defendant Objection - ${objectionType || 'Objection raised'}`;
  
  return (
    <div className="flex justify-center py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className={`w-5 h-5 ${isPlaintiffObjection ? 'text-[#16a34a]' : 'text-[#E17100]'}`} />
        <p className={`font-medium text-base ${isPlaintiffObjection ? 'text-[#15803d]' : 'text-[#7b3306]'}`}>
          {displayText}
        </p>
      </div>
    </div>
  );
}