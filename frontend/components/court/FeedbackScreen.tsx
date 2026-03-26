import { ArrowLeft, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { ObjectionType } from '../App';

interface FeedbackScreenProps {
  objection: ObjectionType;
  ruling: 'sustained' | 'overruled';
  onContinue: () => void;
  onBackToDashboard: () => void;
}

const feedbackContent = {
  sustained: {
    hearsay: {
      ruling: "Objection sustained. The witness may not testify about out-of-court statements.",
      tip: "Hearsay objections are common in small claims. Remember that hearsay is when a witness testifies about what someone else said outside of court to prove the truth of that statement. Always object when the opposing party tries to introduce what someone else told them instead of direct evidence."
    },
    relevance: {
      ruling: "Objection sustained. This evidence does not relate to the security deposit dispute.",
      tip: "Good catch! In small claims, judges appreciate when parties keep the focus on relevant facts. Only evidence directly related to the deposit deductions, property condition, or lease terms should be presented."
    },
    speculation: {
      ruling: "Objection sustained. The witness must testify based on personal knowledge, not assumptions.",
      tip: "Well done. Speculation weakens a case. In small claims, stick to facts you can prove: dates, amounts, documented communications, and things you personally witnessed."
    },
    leading: {
      ruling: "Objection sustained. Please rephrase the question without suggesting the answer.",
      tip: "Leading questions are problematic because they put words in the witness's mouth. In small claims, let witnesses tell their story naturally without coaching them toward a particular answer."
    },
    foundation: {
      ruling: "Objection sustained. Proper foundation must be established before this evidence can be admitted.",
      tip: "Foundation is crucial! Before presenting documents or photos, you must establish who created them, when, and that they're authentic. This builds credibility with the judge."
    }
  },
  overruled: {
    hearsay: {
      ruling: "Objection overruled. This falls under an exception to the hearsay rule.",
      tip: "There are exceptions to hearsay rules, such as admissions by the opposing party or business records. In small claims, judges have more flexibility. Consider whether the statement truly affects the outcome before objecting."
    },
    relevance: {
      ruling: "Objection overruled. The court finds this evidence relevant to establishing the timeline.",
      tip: "Sometimes evidence that seems tangential actually helps establish important context. In small claims, judges may allow broader evidence to understand the full story. Focus on the strongest objections."
    },
    speculation: {
      ruling: "Objection overruled. The witness may provide this testimony based on their experience.",
      tip: "Expert knowledge or personal experience can be distinguished from speculation. In small claims, landlords can testify about typical wear and tear based on their experience managing properties."
    },
    leading: {
      ruling: "Objection overruled. The question is acceptable in this context.",
      tip: "Leading questions are sometimes permitted, especially on preliminary matters or with hostile witnesses. Save your objections for questions that genuinely affect the substance of the testimony."
    },
    foundation: {
      ruling: "Objection overruled. Sufficient foundation has been established.",
      tip: "The opposing party may have already established foundation in earlier testimony. Listen carefully to ensure you're not objecting unnecessarily, which can frustrate the judge."
    }
  }
};

export function FeedbackScreen({ objection, ruling, onContinue, onBackToDashboard }: FeedbackScreenProps) {
  const feedback = feedbackContent[ruling][objection.id as keyof typeof feedbackContent.sustained];
  const isSustained = ruling === 'sustained';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] shadow-sm">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-[#334155] mb-4 hover:text-[#155dfc] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to case dashboard</span>
          </button>
          
          <h1 className="text-2xl text-[#1e293b]">Objection Result</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full space-y-6">
          {/* Ruling Card */}
          <div className={`rounded-2xl p-8 border-2 ${
            isSustained 
              ? 'bg-[#f0fdf4] border-[#86efac]' 
              : 'bg-[#fef2f2] border-[#fca5a5]'
          }`}>
            <div className="flex items-start gap-4 mb-4">
              {isSustained ? (
                <CheckCircle className="w-8 h-8 text-[#16a34a] flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-[#dc2626] flex-shrink-0" />
              )}
              <div>
                <h2 className={`text-2xl mb-2 ${
                  isSustained ? 'text-[#15803d]' : 'text-[#991b1b]'
                }`}>
                  Objection {ruling.charAt(0).toUpperCase() + ruling.slice(1)}
                </h2>
                <p className="text-lg text-[#1e293b] mb-4">
                  Your objection: <strong>{objection.name}</strong>
                </p>
              </div>
            </div>

            {/* Judge's Statement */}
            <div className="bg-white/50 rounded-xl p-6 mb-4 border border-[#e2e8f0]">
              <div className="flex items-start gap-3 mb-2">
                <div className="px-3 py-1 bg-[#f1f5f9] border border-[#cad5e2] rounded-lg text-xs text-[#314158]">
                  Judge
                </div>
              </div>
              <p className="text-[#1e293b] leading-relaxed italic">"{feedback.ruling}"</p>
            </div>
          </div>

          {/* Learning Tip */}
          <div className="bg-[#eff6ff] border-2 border-[#93c5fd] rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <Lightbulb className="w-6 h-6 text-[#2563eb] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg text-[#1e3a8a] mb-2">Learning Point</h3>
                <p className="text-[#1e40af] leading-relaxed">{feedback.tip}</p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onContinue}
              className="px-8 py-3 bg-[#155dfc] text-white rounded-xl text-lg hover:bg-[#1047d0] transition-colors"
            >
              Continue Hearing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
