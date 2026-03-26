import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { EvidenceUpload } from "./EvidenceUpload";
import { CaseDetailModal } from "./CaseDetailModal";
import {
  fetchCaseData,
  fetchEvidenceRecommendations,
  type CaseData,
  type EvidenceRecommendation,
} from "../../services/api";

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

export function EvidencePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showCaseDetailModal, setShowCaseDetailModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<number | null>(null);
  const [evidenceStates, setEvidenceStates] = useState<EvidenceState>({});

  // API data state
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [evidenceCategories, setEvidenceCategories] = useState<EvidenceRecommendation[]>([]);
  const [isLoadingCase, setIsLoadingCase] = useState(true);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch case data and evidence recommendations on mount
  useEffect(() => {
    if (!userId) {
      setError("No user ID provided");
      return;
    }

    fetchCaseData(userId)
      .then((data) => {
        setCaseData(data);
        setIsLoadingCase(false);
      })
      .catch((err) => {
        console.error("Failed to fetch case data:", err);
        setError("Failed to load case data");
        setIsLoadingCase(false);
      });

    fetchEvidenceRecommendations(userId)
      .then((recs) => {
        setEvidenceCategories(recs);
        setIsLoadingEvidence(false);
      })
      .catch((err) => {
        console.error("Failed to fetch evidence recommendations:", err);
        setError("Failed to load evidence recommendations");
        setIsLoadingEvidence(false);
      });
  }, [userId]);

  const handleEvidenceClick = (index: number) => {
    setSelectedEvidence(index);
    setShowEvidenceModal(true);
  };

  const handleCloseModal = () => {
    setShowEvidenceModal(false);
  };

  const handleCloseCaseDetailModal = () => {
    setShowCaseDetailModal(false);
  };

  const handleViewMore = () => {
    setShowCaseDetailModal(true);
  };

  const handleStartPractice = () => {
    navigate(`/court/${userId}`);
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
        // Only update if values actually changed
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

  // Calculate how many categories are "ready to use"
  const totalCategories = evidenceCategories.length;
  const readyCount = Array.from({ length: totalCategories }, (_, i) => i).filter(
    (i) => evidenceStates[i]?.status === "ready"
  ).length;

  // Calculate total files uploaded across all categories
  const totalFilesUploaded = Object.values(evidenceStates).reduce(
    (sum, state) => sum + (state?.files?.length || 0),
    0
  );

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          <p className="text-gray-600 mt-2">No user ID provided. Please start from the case intake.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Dashboard
        onEvidenceClick={handleEvidenceClick}
        onViewMore={handleViewMore}
        onStartPractice={handleStartPractice}
        evidenceStates={evidenceStates}
        readyCount={readyCount}
        totalCategories={totalCategories}
        totalFilesUploaded={totalFilesUploaded}
        caseData={caseData}
        evidenceCategories={evidenceCategories}
        isLoadingCase={isLoadingCase}
        isLoadingEvidence={isLoadingEvidence}
        error={error}
      />

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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                userId={userId}
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

      {showCaseDetailModal && <CaseDetailModal isOpen={showCaseDetailModal} onClose={handleCloseCaseDetailModal} caseData={caseData} />}
    </div>
  );
}
