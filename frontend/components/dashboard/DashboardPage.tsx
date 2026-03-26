import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import {
  fetchEvidenceRecommendations,
  fetchDashboardSummary,
  fetchEvidenceStatus,
  fetchEvidenceRecommendationsByCaseId,
  type EvidenceRecommendation,
} from "@/services/api";
import { DashboardSummary, PreparationStep } from "@/types/dashboard";
import { hasReachedTokenLimit, showTokenLimitReachedMessage } from "@/utils/tokenGuard";
import EvidenceUpload from "./EvidenceUpload";
import CaseDetailModal from "./CaseDetailModal";
import { DashboardHeader } from "./DashboardHeader";
import { CaseSelectorDropdown } from "./CaseSelectorDropdown";
import { PracticeHearingCard } from "./PracticeHearingCard";
import { CaseDetailsCard } from "./CaseDetailsCard";
import { DashboardEvidenceCard } from "./DashboardEvidenceCard";
import { PreparationJourney } from "./PreparationJourney";
import { SimulationHistory } from "./SimulationHistory";

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

export function DashboardPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const USER_ID = userId || user?.userId || "";

  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [evidenceStates, setEvidenceStates] = useState<EvidenceState>({});
  const [showCaseModal, setShowCaseModal] = useState(false);

  const [evidenceCategories, setEvidenceCategories] = useState<EvidenceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect /dashboard → /dashboard/:userId when userId comes from auth context
  useEffect(() => {
    if (!userId && user?.userId) {
      navigate(`/dashboard/${user.userId}`, { replace: true });
    }
  }, [userId, user, navigate]);

  // Load dashboard data (cases, sessions, tokens)
  useEffect(() => {
    if (!USER_ID) return;
    const loadData = async () => {
      try {
        setIsLoading(true);
        const summary = await fetchDashboardSummary(USER_ID);

        setDashboardSummary(summary);

        // Auto-select: prefer caseId from URL (coming back from court); fallback to newest
        if (summary.cases.length > 0) {
          const urlCaseIdStr = searchParams.get("caseId");
          const urlCaseId = urlCaseIdStr ? parseInt(urlCaseIdStr, 10) : null;
          const targetCase = urlCaseId ? summary.cases.find((c) => c.id === urlCaseId) : null;
          setSelectedCaseId(targetCase ? targetCase.id : summary.cases[0].id);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [USER_ID]);

  // Reload evidence recommendations whenever the selected case changes
  useEffect(() => {
    if (!selectedCaseId) return;

    // Log the selected case summary when switching cases
    const selectedCase = dashboardSummary?.cases.find((c) => c.id === selectedCaseId);
    if (selectedCase) {
      console.log(
        `[Dashboard] Case switched → id=${selectedCase.id}`,
        {
          caseNumber: selectedCase.case_number,
          caseType: selectedCase.case_type,
          plaintiff: selectedCase.plaintiffs?.[0]?.name ?? "Unknown",
          defendant: selectedCase.defendants?.[0]?.name ?? "Unknown",
          hearingDate: selectedCase.hearing_date,
          amountSought: selectedCase.amount_sought,
        }
      );
    }

    setEvidenceCategories([]);
    setEvidenceStates({});

    let cancelled = false;

    const loadCaseEvidence = async () => {
      try {
        const [recs, evidenceStatusRes] = await Promise.all([
          fetchEvidenceRecommendationsByCaseId(selectedCaseId).catch(() =>
            // Fallback to user-level recommendations if case-specific endpoint fails
            fetchEvidenceRecommendations(USER_ID).catch(() => [])
          ),
          fetchEvidenceStatus(USER_ID, selectedCaseId).catch(() => ({ status: {} })),
        ]);

        if (cancelled) return;

        setEvidenceCategories(recs);

        // Populate evidence states from backend status
        if (recs.length > 0 && evidenceStatusRes.status) {
          const initialStates: EvidenceState = {};
          recs.forEach((rec, index) => {
            const folderStatus = evidenceStatusRes.status[rec.folderName];
            if (folderStatus) {
              initialStates[index] = {
                hasFiles: folderStatus.has_files,
                analyzed: folderStatus.has_files,
                files: folderStatus.files.map((fileInfo) => {
                  const name = fileInfo.filename;
                  // Match per-file feedback by stem (filename without extension)
                  const stem = name.replace(/\.[^/.]+$/, "");
                  const feedbackText =
                    fileInfo.feedback ??
                    folderStatus.file_feedbacks?.[stem] ??
                    folderStatus.file_feedbacks?.["_all_"];
                  return {
                    id: name,
                    name,
                    size: fileInfo.size_bytes ?? 0,
                    status: (fileInfo.is_ready ? "valid" : "invalid") as
                      "valid" | "invalid",
                    ...(feedbackText
                      ? { feedback: { message: feedbackText, suggestions: [] } }
                      : {}),
                  };
                }),
                status: folderStatus.is_ready
                  ? "ready"
                  : folderStatus.has_files
                    ? "needs-improvement"
                    : "none",
              };
            }
          });
          setEvidenceStates(initialStates);
        }
      } catch (err) {
        if (!cancelled) console.error("Failed to load evidence for case:", err);
      }
    };

    loadCaseEvidence();

    return () => {
      cancelled = true;
    };
  }, [selectedCaseId, USER_ID]);

  const selectedCase = dashboardSummary?.cases.find((c) => c.id === selectedCaseId) ?? null;

  // Sessions filtered to the currently selected case
  const filteredSessions = (dashboardSummary?.sessions ?? []).filter(
    (s) => !selectedCaseId || s.case_id === selectedCaseId
  );

  // Journey completion rules:
  // - Evidence stage completes only when every recommended evidence category is ready.
  // - Practice stage completes only when at least one simulation has a win verdict.
  const allEvidenceReady =
    evidenceCategories.length > 0 &&
    evidenceCategories.every((_, index) => evidenceStates[index]?.status === "ready");

  const hasWinningSession = filteredSessions.some(
    (session) => (session.verdict_outcome ?? "").toLowerCase() === "win"
  );

  // Determine current preparation step
  // const currentPreparationStep: PreparationStep = dashboardSummary
  //   ? !dashboardSummary.cases.length
  //     ? "intake"
  //     : !allEvidenceReady
  //       ? "evidence"
  //       : !hasWinningSession
  //         ? "practice"
  //         : "final"
  //   : "intake";

  const hasCases = dashboardSummary ? dashboardSummary.cases.length > 0 : false;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEvidenceClick = (index: number) => {
    if (hasReachedTokenLimit(dashboardSummary?.tokens_used, dashboardSummary?.token_limit)) {
      showTokenLimitReachedMessage();
      return;
    }

    setSelectedEvidence(index);
    setShowEvidenceModal(true);
  };

  const handleCloseModal = () => {
    setShowEvidenceModal(false);
  };

  const handleStartPractice = () => {
    if (hasReachedTokenLimit(dashboardSummary?.tokens_used, dashboardSummary?.token_limit)) {
      showTokenLimitReachedMessage();
      return;
    }

    if (selectedCaseId) {
      navigate(`/court/${USER_ID}?caseId=${selectedCaseId}`);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    // Pass caseId so CourtPage can return to the correct case dashboard
    const caseParam = selectedCaseId ? `&caseId=${selectedCaseId}` : "";
    navigate(`/court/${USER_ID}?sessionId=${sessionId}${caseParam}`);
  };

  const handleEvidenceUpdate = useCallback(
    (
      index: number,
      hasFiles: boolean,
      analyzed: boolean,
      files: UploadedFile[],
      status: "ready" | "needs-improvement" | "none"
    ) => {
      setEvidenceStates((prev) => {
        const current = prev[index];
        if (
          current?.hasFiles === hasFiles &&
          current?.analyzed === analyzed &&
          current?.status === status &&
          JSON.stringify(current?.files) === JSON.stringify(files)
        ) {
          return prev;
        }
        return {
          ...prev,
          [index]: { hasFiles, analyzed, files, status },
        };
      });
    },
    []
  );

  const totalFilesUploaded = Object.values(evidenceStates).reduce(
    (sum, state) => sum + (state?.files?.length || 0),
    0
  );

  const hasAttemptedSession = filteredSessions.length > 0;
  const hasAttemptedEvidence = totalFilesUploaded > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        tokensUsed={dashboardSummary?.tokens_used ?? 0}
        tokenLimit={dashboardSummary?.token_limit ?? 3000}
        username={dashboardSummary?.username ?? user?.username ?? "User"}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="max-w-[1256px] mx-auto px-6 py-8">
        <div className="flex gap-12 items-start">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            {/* Greeting + Case Selector */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[24px] font-semibold text-[#101828]">
                    Hi, {dashboardSummary?.username || "there"}
                  </h1>
                  <button
                    onClick={() => navigate('/#start-new-case', { state: { forceShowLanding: true } })}
                    className="h-[36px] px-[14px] bg-[#155dfc] text-white text-[14px] font-medium rounded-[8px] hover:bg-[#1447e6] transition-colors flex items-center gap-[6px]"
                  >
                    <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 14 14">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                    Start New Case
                  </button>
                </div>
                <p className="text-[16px] text-[#4a5565] mt-2">Manage your cases and prepare for court</p>
              </div>
              <div className="w-[321px] flex-shrink-0">
                <CaseSelectorDropdown
                  cases={dashboardSummary?.cases ?? []}
                  selectedCaseId={selectedCaseId}
                  onSelectCase={setSelectedCaseId}
                />
              </div>
            </div>

            {/* Practice Hearing Card */}
            <PracticeHearingCard
              onStartPractice={handleStartPractice}
              selectedCaseId={selectedCaseId}
            />

            {/* Case Details Card */}
            <CaseDetailsCard
              caseData={selectedCase}
              isLoading={isLoading}
              onViewMore={() => setShowCaseModal(true)}
            />

            {/* Evidence Card */}
            <DashboardEvidenceCard
              evidence={evidenceCategories}
              evidenceStates={evidenceStates}
              totalFilesUploaded={totalFilesUploaded}
              onUpload={handleEvidenceClick}
            />
          </div>

          {/* Right Sidebar */}
          <div className="w-[395px] space-y-6">
            <PreparationJourney 
              hasCases={hasCases}
              allEvidenceReady={allEvidenceReady}
              hasWinningSession={hasWinningSession}
              hasAttemptedEvidence={hasAttemptedEvidence}
              hasAttemptedSession={hasAttemptedSession}
            />
            <SimulationHistory
              sessions={filteredSessions}
              onSessionClick={handleSessionClick}
              onStartNew={handleStartPractice}
            />
          </div>
        </div>
      </div>

      {/* Case Detail Modal */}
      <CaseDetailModal
        isOpen={showCaseModal}
        onClose={() => setShowCaseModal(false)}
        caseId={selectedCaseId}
        onSaved={async () => {
          // Refresh dashboard so updated fields appear in the card
          try {
            const summary = await import("@/services/api").then((m) =>
              m.fetchDashboardSummary(USER_ID)
            );
            setDashboardSummary(summary);
          } catch (_) {/* silently ignore */}
        }}
      />

      {/* Evidence Upload Modal */}
      {showEvidenceModal && selectedEvidence !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={handleCloseModal}
                className="absolute -top-14 right-0 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-[14px] font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close
              </button>
              <EvidenceUpload
                evidenceIndex={selectedEvidence}
                evidenceCategory={evidenceCategories[selectedEvidence] || null}
                userId={USER_ID}
                caseId={selectedCaseId}
                onUpdate={handleEvidenceUpdate}
                onClose={handleCloseModal}
                initialFiles={evidenceStates[selectedEvidence]?.files || []}
                initialAnalyzed={evidenceStates[selectedEvidence]?.analyzed || false}
                initialStatus={evidenceStates[selectedEvidence]?.status || "none"}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
