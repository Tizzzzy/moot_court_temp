import { FileText, Image, Mail } from 'lucide-react';

const evidenceItems = [
  {
    id: 1,
    type: 'document',
    title: 'Lease Agreement',
    status: 'valid',
  },
  {
    id: 2,
    type: 'photo',
    title: 'Move-out Photos',
    status: 'invalid',
  },
  {
    id: 3,
    type: 'email',
    title: 'Email from Landlord',
    status: 'valid',
  },
  {
    id: 4,
    type: 'document',
    title: 'Text Messages',
    status: 'valid',
  },
];

export function EvidencePanel() {
  return (
    <div className="w-80 bg-white border border-[#e2e8f0] rounded-xl p-6 h-fit sticky top-8">
      <h3 className="text-lg text-[#1e293b] mb-4">Evidence</h3>
      
      <div className="space-y-3">
        {evidenceItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#f1f5f9] rounded-lg flex items-center justify-center">
              {item.type === 'document' && <FileText className="w-5 h-5 text-[#475569]" />}
              {item.type === 'photo' && <Image className="w-5 h-5 text-[#475569]" />}
              {item.type === 'email' && <Mail className="w-5 h-5 text-[#475569]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#1e293b] truncate">{item.title}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${item.status === 'valid' ? 'bg-[#22c55e]' : 'bg-[#eab308]'}`} />
                <span className="text-xs text-[#64748b] capitalize">{item.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg">
        <p className="text-xs text-[#1e40af]">
          <strong>Tip:</strong> Click on evidence items to present them during your case.
        </p>
      </div>
    </div>
  );
}
