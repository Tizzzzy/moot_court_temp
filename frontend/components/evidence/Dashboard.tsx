import { Calendar, Sparkles } from "lucide-react";
import type { CaseData, EvidenceRecommendation } from "../../services/api";
import { UserProfileButton } from "@/components/UserProfileButton";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "pending" | "valid" | "invalid" | "analyzing";
  feedback?: {
    message: string;
    suggestions: string[];
  };
}

interface EvidenceData {
  hasFiles: boolean;
  analyzed: boolean;
  files: UploadedFile[];
  status: "ready" | "needs-improvement" | "none";
}

interface EvidenceState {
  [key: number]: EvidenceData;
}

interface DashboardProps {
  onEvidenceClick: (index: number) => void;
  onViewMore: () => void;
  onStartPractice: () => void;
  evidenceStates: EvidenceState;
  readyCount: number;
  totalCategories: number;
  totalFilesUploaded: number;
  caseData: CaseData | null;
  evidenceCategories: EvidenceRecommendation[];
  isLoadingCase: boolean;
  isLoadingEvidence: boolean;
  error: string | null;
}

export function Dashboard({
  onEvidenceClick,
  onViewMore,
  onStartPractice,
  evidenceStates,
  readyCount,
  totalCategories,
  totalFilesUploaded,
  caseData,
  evidenceCategories,
  isLoadingCase,
  isLoadingEvidence,
  error,
}: DashboardProps) {
  const plaintiffName = caseData?.plaintiffs?.[0]?.name ?? "there";
  const firstName = plaintiffName.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.1)] shadow-sm">
        <div className="max-w-7xl mx-auto px-8 md:px-12 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-normal text-[#0a0a0a] tracking-[-0.4492px]">
              Case Dashboard
            </h1>
            <p className="text-[14px] text-[#4a5565] tracking-[-0.1504px] mt-1">
              We'll help you prepare step by step
            </p>
          </div>
          <UserProfileButton />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 md:px-12 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Practice Section */}
            <div className="bg-[#2b7fff] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-4 left-6">
                <span className="bg-white/20 text-white text-[12px] px-2 py-1 rounded-md font-medium">
                  Recommended
                </span>
              </div>
              <div className="mt-10">
                <h2 className="text-[20px] font-medium text-white tracking-[-0.4492px] mb-2">
                  Practice Your Hearing
                </h2>
                <p className="text-[16px] text-[#dbeafe] tracking-[-0.3125px] mb-4">
                  Talk through your case with an AI judge in a practice session
                </p>
                <button onClick={onStartPractice} className="bg-white text-[#2b7fff] px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                  Start Practice
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Greeting */}
            <div>
              <h2 className="text-[32px] font-normal text-[#0a0a0a]">
                Hi, {isLoadingCase ? "..." : firstName}
              </h2>
            </div>

            {/* Case Info */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-medium text-[#0a0a0a]">Your Case</h3>
                <button className="text-[14px] text-[#2b7fff] hover:underline" onClick={onViewMore}>
                  View more
                </button>
              </div>
              {isLoadingCase ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              ) : caseData ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-[12px] text-[#64748b] mb-1">Case Number</p>
                      <p className="text-[14px] text-[#0a0a0a] font-medium">
                        {caseData.case_number || "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#64748b] mb-1">Amount Claimed</p>
                      <p className="text-[14px] text-[#0a0a0a] font-medium">
                        ${caseData.amount_sought?.toLocaleString() ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#64748b] mb-1">Case Type</p>
                      <p className="text-[14px] text-[#0a0a0a] font-medium">
                        {caseData.case_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#64748b] mb-1">Defendant</p>
                      <p className="text-[14px] text-[#0a0a0a] font-medium">
                        {caseData.defendants?.[0]?.name ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  {/* Date Timeline */}
                  <div className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-[#2b7fff]" />
                      <p className="text-[14px] font-medium text-[#0a0a0a]">Case Timeline</p>
                    </div>
                    <div className="relative">
                      {/* Timeline connector line */}
                      <div className="absolute top-3 left-0 right-0 h-[2px] bg-[#e2e8f0]"></div>
                      <div className="flex justify-between relative">
                        {/* Incident Date */}
                        <div className="flex flex-col items-center text-center w-1/3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${
                              caseData.incident_date ? "bg-[#2b7fff]" : "bg-[#e2e8f0]"
                            }`}
                          >
                            {caseData.incident_date && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-[12px] text-[#64748b] mt-2">Incident Date</p>
                          <p className="text-[13px] text-[#0a0a0a] font-medium mt-1">
                            {caseData.incident_date
                              ? new Date(caseData.incident_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </p>
                        </div>
                        {/* Filing Date */}
                        <div className="flex flex-col items-center text-center w-1/3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${
                              caseData.filing_date ? "bg-[#2b7fff]" : "bg-[#e2e8f0]"
                            }`}
                          >
                            {caseData.filing_date && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-[12px] text-[#64748b] mt-2">Filing Date</p>
                          <p className="text-[13px] text-[#0a0a0a] font-medium mt-1">
                            {caseData.filing_date
                              ? new Date(caseData.filing_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Pending"}
                          </p>
                        </div>
                        {/* Hearing Date */}
                        <div className="flex flex-col items-center text-center w-1/3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${
                              caseData.hearing_date ? "bg-[#2b7fff]" : "bg-[#e2e8f0]"
                            }`}
                          >
                            {caseData.hearing_date && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <p className="text-[12px] text-[#64748b] mt-2">Hearing Date</p>
                          <p className="text-[13px] text-[#0a0a0a] font-medium mt-1">
                            {caseData.hearing_date
                              ? new Date(caseData.hearing_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Not scheduled"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[14px] text-[#64748b]">No case data available.</p>
              )}
            </div>

            {/* Evidence Section */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-[#2b7fff] mt-0.5" />
                <h3 className="text-[18px] font-medium text-[#0a0a0a]">AI recommended evidence</h3>
              </div>
              <p className="text-[14px] text-[#64748b] mb-4">
                Upload your documents and get AI-powered feedback
              </p>

              {isLoadingEvidence ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border border-[#e2e8f0] rounded-xl p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <p className="text-[14px] text-[#64748b]">
                      {readyCount} of {totalCategories} categories have evidence • {totalFilesUploaded} file
                      {totalFilesUploaded !== 1 ? "s" : ""} uploaded
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-[#2b7fff] h-2 rounded-full transition-all"
                        style={{ width: `${(readyCount / totalCategories) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {evidenceCategories.map((evidence, index) => {
                      const state = evidenceStates[index];
                      const isAnalyzed = state?.analyzed || false;
                      const hasFiles = state?.hasFiles || false;
                      const status = state?.status || "none";
                      const fileCount = state?.files?.length || 0;

                      return (
                        <div
                          key={index}
                          className="border border-[#e2e8f0] rounded-xl p-4 hover:border-[#2b7fff] transition-colors cursor-pointer"
                          onClick={() => onEvidenceClick(index)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[16px] text-[#0f172b] tracking-[-0.3125px]">
                                  {evidence.title}
                                </h4>
                                {fileCount > 0 && (
                                  <span className="text-[14px] text-[#64748b]">
                                    - {fileCount} file{fileCount !== 1 ? "s" : ""} uploaded
                                  </span>
                                )}
                                {status === "ready" && (
                                  <div className="bg-[#dcfce7] border border-[#b9f8cf] h-[22px] px-[5px] py-px rounded-[8px] flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                                      <circle cx="6" cy="6" r="5.5" stroke="#016630" />
                                      <path
                                        d="M4.5 6L5.5 7L7.5 5"
                                        stroke="#016630"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                    <p className="font-medium text-[12px] text-[#016630]">
                                      Ready to use
                                    </p>
                                  </div>
                                )}
                                {status === "needs-improvement" && (
                                  <div className="bg-[#fef9c2] border border-[#ac7f5e] h-[22px] px-[5px] py-px rounded-[8px] flex items-center gap-2">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                                      <circle cx="6" cy="6" r="5.5" stroke="#AC7F5E" />
                                      <path
                                        d="M6 4V6M6 8H6.005"
                                        stroke="#AC7F5E"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                    <p className="font-medium text-[12px] text-[#ac7f5e]">
                                      Need improvement
                                    </p>
                                  </div>
                                )}
                              </div>
                              <p className="text-[14px] text-[#62748e] tracking-[-0.3125px] line-clamp-2">
                                {evidence.description}
                              </p>
                            </div>
                            {isAnalyzed && hasFiles ? (
                              <button className="ml-4 flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-[14px] text-[#0a0a0a] font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
                                View detail
                              </button>
                            ) : (
                              <button className="ml-4 flex items-center gap-2 px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-lg text-[14px] text-[#0a0a0a] font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                  />
                                </svg>
                                Upload
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Other Evidence */}
              <div className="mt-4 border border-[#e2e8f0] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-[16px] text-[#0f172b] tracking-[-0.3125px] mb-1">
                      Other evidence
                    </h4>
                    <p className="text-[14px] text-[#62748e] tracking-[-0.3125px]">
                      Please upload any evidence you believe could be helpful. This may include documents,
                      images, or any other relevant materials that support your case.
                    </p>
                  </div>
                  <button className="ml-4 flex items-center gap-2 px-4 py-2 border border-[rgba(0,0,0,0.1)] rounded-lg text-[14px] text-[#0a0a0a] font-medium hover:bg-gray-50 transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 sticky top-6">
              <h3 className="text-[16px] font-medium text-[#0a0a0a] mb-4">
                Your Preparation Journey
              </h3>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 relative">
                    {/* Connecting line */}
                    <div className="absolute left-1/2 top-6 w-[2px] h-[calc(100%+16px)] bg-[#e2e8f0] -translate-x-1/2"></div>
                    <div className="w-6 h-6 rounded-full bg-[#dcfce7] border border-[#b9f8cf] flex items-center justify-center relative z-10">
                      <svg
                        className="w-4 h-4 text-[#016630]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-medium text-[#0a0a0a] mb-1">
                      Enter court form
                    </h4>
                    <p className="text-[12px] text-[#64748b] mb-1">
                      Please provide your basic information so we can understand your situation better.
                    </p>
                    <p className="text-[12px] text-[#64748b]">About 15 min</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 relative">
                    {/* Connecting line */}
                    <div className="absolute left-1/2 top-6 w-[2px] h-[calc(100%+16px)] bg-[#e2e8f0] -translate-x-1/2"></div>
                    {readyCount === totalCategories ? (
                      <div className="w-6 h-6 rounded-full bg-[#dcfce7] border border-[#b9f8cf] flex items-center justify-center relative z-10">
                        <svg
                          className="w-4 h-4 text-[#016630]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#2b7fff] flex items-center justify-center relative z-10">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[14px] font-medium text-[#0a0a0a]">Upload evidence</h4>
                      {readyCount < totalCategories && (
                        <span className="bg-[#2b7fff] text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#64748b] mb-1">
                      Upload your evidence and get AI-powered feedback
                    </p>
                    <p className="text-[12px] text-[#64748b]">About 20 min</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 relative">
                    {/* Connecting line */}
                    <div className="absolute left-1/2 top-6 w-[2px] h-[calc(100%+16px)] bg-[#e2e8f0] -translate-x-1/2"></div>
                    {readyCount === totalCategories ? (
                      <div className="w-6 h-6 rounded-full bg-[#dbeafe] flex items-center justify-center relative z-10">
                        <div className="w-2 h-2 rounded-full bg-[#155dfc]"></div>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-[#e2e8f0] bg-white relative z-10"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`text-[14px] font-medium ${
                          readyCount === totalCategories ? "text-[#0a0a0a]" : "text-[#62748e]"
                        }`}
                      >
                        Practice your hearing
                      </h4>
                      {readyCount === totalCategories && (
                        <span className="bg-[#dbeafe] border border-[#93c5fd] text-[#1e40af] text-[10px] px-2 py-0.5 rounded-md font-medium">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#64748b] mb-1">
                      Rehearse in a simulated courtroom environment
                    </p>
                    <p className="text-[12px] text-[#64748b]">About 45 min</p>
                    {readyCount === totalCategories && (
                      <button onClick={onStartPractice} className="mt-2 bg-white border border-[rgba(0,0,0,0.1)] h-[32px] px-4 rounded-lg text-[14px] text-[#0a0a0a] font-medium hover:bg-gray-50 transition-colors">
                        Start
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 relative">
                    <div className="w-6 h-6 rounded-full border-2 border-[#e2e8f0] bg-white relative z-10"></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[14px] font-medium text-[#62748e] mb-1">
                      Final Preparation
                    </h4>
                    <p className="text-[12px] text-[#64748b] mb-1">
                      Checklist and day-of guidelines
                    </p>
                    <p className="text-[12px] text-[#64748b]">About 15 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
