import { Scale, User, Users, Briefcase } from 'lucide-react';

interface DialogueBubbleProps {
  speaker: 'judge' | 'plaintiff' | 'defendant' | 'clerk' | 'witness';
  text: string;
}

const speakerConfig = {
  judge: {
    label: 'Judge',
    bgColor: 'bg-white',
    borderColor: 'border-[#e2e8f0]',
    badgeColor: 'bg-[#f1f5f9] text-[#314158] border-[#cad5e2]',
    icon: Scale,
  },
  plaintiff: {
    label: 'Plaintiff (You)',
    bgColor: 'bg-[#dbeafe]',
    borderColor: 'border-[#93c5fd]',
    badgeColor: 'bg-[#3b82f6] text-white border-[#2563eb]',
    icon: User,
  },
  defendant: {
    label: 'Defendant',
    bgColor: 'bg-[#fee2e2]',
    borderColor: 'border-[#fca5a5]',
    badgeColor: 'bg-[#dc2626] text-white border-[#b91c1c]',
    icon: Users,
  },
  clerk: {
    label: 'Court Clerk',
    bgColor: 'bg-white',
    borderColor: 'border-[#e2e8f0]',
    badgeColor: 'bg-[#f1f5f9] text-[#314158] border-[#cad5e2]',
    icon: Briefcase,
  },
  witness: {
    label: 'Witness',
    bgColor: 'bg-white',
    borderColor: 'border-[#e2e8f0]',
    badgeColor: 'bg-[#f1f5f9] text-[#314158] border-[#cad5e2]',
    icon: User,
  },
};

export function DialogueBubble({ speaker, text }: DialogueBubbleProps) {
  const config = speakerConfig[speaker];
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${config.badgeColor}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs">{config.label}</span>
      </div>
      <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-6`}>
        <p className="text-[#0f172b] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
