import { X, AlertTriangle } from 'lucide-react';
import { ObjectionType } from '../App';

interface ObjectionModalProps {
  onSubmit: (objection: ObjectionType) => void;
  onCancel: () => void;
}

const objectionTypes: ObjectionType[] = [
  {
    id: 'relevance',
    name: 'Relevance',
    description: 'The statement or evidence does not relate to the case at hand.',
  },
  {
    id: 'hearsay',
    name: 'Hearsay',
    description: 'The witness is testifying about what someone else said outside of court.',
  },
  {
    id: 'speculation',
    name: 'Speculation',
    description: 'The witness is guessing or making assumptions without direct knowledge.',
  },
  {
    id: 'leading',
    name: 'Leading Question',
    description: 'The question suggests the answer or puts words in the witness\'s mouth.',
  },
  {
    id: 'foundation',
    name: 'Lack of Foundation',
    description: 'There is insufficient basis established for the testimony or evidence.',
  },
];

export function ObjectionModal({ onSubmit, onCancel }: ObjectionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl text-[#1e293b]">Raise an Objection</h2>
          <button
            onClick={onCancel}
            className="text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Helper Text */}
          <div className="mb-6 p-4 bg-[#fef3c7] border border-[#fde68a] rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#d97706] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#92400e]">
              Objections may be raised only during the other party's questioning or evidence presentation. 
              Choose the most appropriate objection type below.
            </p>
          </div>

          {/* Objection Types */}
          <div className="space-y-3">
            {objectionTypes.map((objection) => (
              <button
                key={objection.id}
                onClick={() => onSubmit(objection)}
                className="w-full text-left p-4 border-2 border-[#e2e8f0] rounded-xl hover:border-[#155dfc] hover:bg-[#eff6ff] transition-all group"
              >
                <h3 className="text-lg text-[#1e293b] mb-1 group-hover:text-[#155dfc]">
                  {objection.name}
                </h3>
                <p className="text-sm text-[#64748b]">{objection.description}</p>
              </button>
            ))}
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
        </div>
      </div>
    </div>
  );
}
