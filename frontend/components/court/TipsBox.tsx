import { Lightbulb } from 'lucide-react';

interface TipsBoxProps {
  tips: string[];
}

export function TipsBox({ tips }: TipsBoxProps) {
  return (
    <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[10px] p-4 max-w-4xl mx-auto">
      <div className="flex items-start gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-[#2B7FFF] flex-shrink-0 mt-0.5" />
        <h3 className="text-[#0f172b]">Tips for answering:</h3>
      </div>
      <ul className="ml-7 space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="text-sm text-[#45556c]">• {tip}</li>
        ))}
      </ul>
    </div>
  );
}
