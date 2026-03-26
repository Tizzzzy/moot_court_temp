import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { HearingOverview } from './HearingOverview';
import { ActiveHearing } from './ActiveHearing';
import { EvidenceModal, type EvidenceItem } from './EvidenceModal';
import { EvidenceIndicator } from './EvidenceIndicator';
import { EvidenceSidePanel } from './EvidenceSidePanel';
import { FilePreviewModal } from './FilePreviewModal';
import { useCourtSession } from '@/hooks/useCourtSession';
import { courtSessionService } from '@/services/courtSessionService';
import type { ChatMessage, ObjectionDecision } from '@/types/court';
import { fetchEvidenceRecommendations, fetchDashboardSummary } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

export interface CaseData {
  case_number?: string | null;
  case_type: string;
  state: string;
  filing_date?: string | null;
  plaintiffs: Array<{ name: string; address?: string | null }>;
  defendants: Array<{ name: string; address?: string | null }>;
  claim_summary: string;
  amount_sought: number;
  incident_date: string;
  demand_letter_sent?: boolean;
  agreement_included?: boolean;
}

export type HearingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Message {
  speaker: 'judge' | 'plaintiff' | 'defendant' | 'clerk' | 'system';
  text: string;
  isUser?: boolean;
  isObjection?: boolean;
  objectionType?: string;
  objectionReason?: string;
  feedback?: {
    positive: string;
    improvements: string[];
  };
  evidenceFiles?: EvidenceFile[];
  isPerformanceReport?: boolean;
  performanceData?: {
    overallScore: number;
    strengths: number;
    toImprove: number;
    difficulty: string;
  };
}

export interface EvidenceFile {
  name: string;
  type: string;
  size: number;
  serverFilename?: string;
  previewUrl?: string;
}

function inferMimeType(filename: string, fallback?: string): string {
  if (fallback && fallback !== 'application/octet-stream') {
    return fallback;
  }

  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return fallback || 'application/octet-stream';
}

function mapChatMessageToMessage(chatMsg: ChatMessage): Message {
  return {
    speaker: chatMsg.speaker as any,
    text: chatMsg.text,
    isUser: chatMsg.isUser,
    feedback: chatMsg.feedback ? {
      positive: chatMsg.feedback.positive,
      improvements: chatMsg.feedback.improvements?.filter(i => i.trim()) || []
    } : undefined,
  };
}

export function CourtPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const USER_ID = userId || 'user_1';

  const sessionIdParam = searchParams.get('sessionId');
  const caseIdParam = searchParams.get('caseId');
  const caseId = caseIdParam ? parseInt(caseIdParam, 10) : 1;

  const courtSession = useCourtSession(USER_ID, caseId);

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'overview' | 'hearing'>('overview');
  const [currentStep, setCurrentStep] = useState<HearingStep>(1);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidencePresented, setEvidencePresented] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [pendingEvidence, setPendingEvidence] = useState<EvidenceFile[]>([]);
  const [pendingEvidenceFiles, setPendingEvidenceFiles] = useState<File[]>([]); // Actual file objects
  const [pendingPreparedFolders, setPendingPreparedFolders] = useState<string[]>([]);
  const [showEvidenceIndicator, setShowEvidenceIndicator] = useState(false);
  const [submittedEvidenceNames, setSubmittedEvidenceNames] = useState<string[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
  const [editingMessage, setEditingMessage] = useState<string>('');
  const [userEvidence, setUserEvidence] = useState<EvidenceItem[]>([]);
  const [pendingObjection, setPendingObjection] = useState<ObjectionDecision | null>(null);
  const [pendingObjectionMsg, setPendingObjectionMsg] = useState<string>('');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokenLimit, setTokenLimit] = useState(3000);

  useEffect(() => {
    const loadData = async (targetCaseId: number) => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

        // Load case data — pass case_id so the backend returns the selected case
        const caseResponse = await fetch(`${baseUrl}/court/case-data?user_id=${USER_ID}&case_id=${targetCaseId}`);
        if (caseResponse.ok) {
          const data = await caseResponse.json();
          setCaseData(data);
        }

        // Load token usage
        try {
          const summary = await fetchDashboardSummary(USER_ID);
          setTokensUsed(summary.tokens_used ?? 0);
          setTokenLimit(summary.token_limit ?? 3000);
        } catch {
          // Fall back to auth context values if available
          if (user?.tokensUsed !== undefined) setTokensUsed(user.tokensUsed);
          if (user?.tokenLimit !== undefined) setTokenLimit(user.tokenLimit);
        }

        // Load user's evidence from dashboard (case-specific)
        try {
          const evidenceRecs = await fetch(`${baseUrl}/evidence/for-case/${targetCaseId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
          }).then(r => r.ok ? r.json() : { recommendations: {} }).then(d => {
            const recs: Record<string, string> = d.recommendations ?? {};
            return Object.entries(recs).map(([key, desc]) => ({ title: key.replace(/_/g, ' '), folderName: key.replace(/[^a-zA-Z0-9_-]/g, ''), description: desc as string }));
          });
          // Fetch status for each evidence category (case-specific)
          const evidenceWithStatus = await Promise.all(
            evidenceRecs.map(async (rec) => {
              try {
                const statusRes = await fetch(`${baseUrl}/evidence/status/${USER_ID}?case_id=${targetCaseId}`);
                const statusData = statusRes.ok ? await statusRes.json() : { status: {} };
                const folderStatus = statusData.status?.[rec.folderName];
                return {
                  title: rec.title,
                  folderName: rec.folderName,
                  isReady: folderStatus?.is_ready || false
                };
              } catch {
                return { title: rec.title, folderName: rec.folderName, isReady: false };
              }
            })
          );
          setUserEvidence(evidenceWithStatus.filter(e => e.isReady)); // Only show ready evidence
        } catch (err) {
          console.error('Failed to load evidence:', err);
        }
      } catch (error) {
        console.error('Failed to load case data:', error);
      }
    };

    // If sessionIdParam is present, load historical session instead
    if (sessionIdParam) {
      const loadHistoricalSession = async () => {
        const sessionState = await courtSession.loadSession(sessionIdParam);
        const resolvedCaseId = sessionState?.case_id ?? caseId;

        await loadData(resolvedCaseId);
        setCurrentScreen('hearing');
        setCurrentStep(1 as HearingStep);
      };

      loadHistoricalSession();
    } else {
      loadData(caseId);
    }
  }, [USER_ID, sessionIdParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (previewFile?.previewUrl) {
        URL.revokeObjectURL(previewFile.previewUrl);
      }
    };
  }, [previewFile]);

  useEffect(() => {
    const restoredEvidence: EvidenceFile[] = (courtSession.submittedEvidence || []).map((file: {
      filename: string;
      mime_type: string;
      size_bytes: number;
    }) => ({
      name: file.filename,
      type: inferMimeType(file.filename, file.mime_type),
      size: file.size_bytes,
      serverFilename: file.filename,
    }));

    setEvidenceFiles(restoredEvidence);
    setSubmittedEvidenceNames(restoredEvidence.map((file: EvidenceFile) => file.name));

    // if (sessionIdParam && restoredEvidence.length > 0) {
    //   setShowSidePanel(true);
    // }
  }, [courtSession.submittedEvidence, sessionIdParam]);

  const handleStartHearing = async () => {
    setCurrentScreen('hearing');
    setCurrentStep(1);
    await courtSession.startSession();
  };

  const handleSendMessage = async (message: string) => {
    setEditingMessage('');
    try {
      if (pendingPreparedFolders.length > 0) {
        const preparedUploaded = await courtSession.submitPreparedEvidence(USER_ID, caseId, pendingPreparedFolders);
        if (preparedUploaded && preparedUploaded.length > 0) {
          setEvidencePresented(true);
        }
        setPendingPreparedFolders([]);
      }

      // UPLOAD EVIDENCE FIRST (if any) - ensures it's uploaded during Plaintiff's turn
      // Backend returns turn to Plaintiff after evidence acknowledgement
      if (pendingEvidenceFiles.length > 0) {
        const uploaded = await courtSession.uploadEvidence(pendingEvidenceFiles);
        if (uploaded && uploaded.length > 0) {
          setEvidencePresented(true);
        }
        setPendingEvidence([]);
        setPendingEvidenceFiles([]);
        setEvidencePresented(true);
      }

      // THEN SEND MESSAGE - turn is still Plaintiff after evidence acknowledgement
      const result = await courtSession.sendMessage(message);

      // Check if an objection was raised
      if (result?.hasObjection && result.objection) {
        setPendingObjection(result.objection);
        setPendingObjectionMsg(message);
        return; // Stop here; UI will show objection banner
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handlePresentEvidence = async (selectedEvidence: string[], uploadedFiles: File[]) => {
    setShowEvidenceModal(false);

    if (selectedEvidence.length === 0 && uploadedFiles.length === 0) {
      return;
    }

    const uploadedEvidenceFiles: EvidenceFile[] = uploadedFiles.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size
    }));

    // ALWAYS stage evidence for upload with next message
    setPendingPreparedFolders(selectedEvidence);
    setPendingEvidence(uploadedEvidenceFiles);
    setPendingEvidenceFiles(uploadedFiles);
    setShowEvidenceIndicator(true);
  };

  const handleEditMessage = (index: number) => {
    const messageToEdit = courtSession.messages[index];
    setEditingMessage(messageToEdit.text);
  };

  const handleContinueAnyway = async () => {
    if (!pendingObjectionMsg) return;
    setPendingObjection(null);
    try {
      await courtSession.continueAfterObjection(true, pendingObjectionMsg);
      setPendingObjectionMsg('');
    } catch (error) {
      console.error('Failed to continue after objection:', error);
    }
  };

  const handleRephrase = () => {
    const suggestion = pendingObjection?.suggested_rephrasing || '';
    setPendingObjection(null);
    setPendingObjectionMsg('');
    setEditingMessage(suggestion); // pre-fill the chat input with suggested rephrasing
  };

  const handleNextStep = () => {
    if (currentStep < 7) {
      setCurrentStep((currentStep + 1) as HearingStep);
    }
  };

  const handleBackToDashboard = () => {
    // Return to the dashboard with the current caseId so the correct case stays selected
    navigate(`/dashboard/${USER_ID}?caseId=${caseId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const messages: Message[] = courtSession.messages.map(mapChatMessageToMessage);

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* {currentScreen === 'hearing' && !courtSession.wsConnected && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-md text-sm z-50">
          Reconnecting to courtroom...
        </div>
      )} */}

      {currentScreen === 'hearing' && courtSession.isLoading && (
        <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded-md text-sm z-50">
          Judge is reviewing your statement...
        </div>
      )}

      {currentScreen === 'hearing' && courtSession.error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-md text-sm z-50 max-w-xs">
          Error: {courtSession.error}
        </div>
      )}

      {currentScreen === 'overview' && (
        <HearingOverview
          onStartHearing={handleStartHearing}
          caseData={caseData}
          onBackToDashboard={handleBackToDashboard}
          tokensUsed={tokensUsed}
          tokenLimit={tokenLimit}
          username={user?.username ?? ''}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'hearing' && pendingObjection && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 px-4">
          <div className="bg-amber-50 border border-amber-400 rounded-xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  Objection: {pendingObjection.objection_type || 'Raised by Defense'}
                  {pendingObjection.severity && <span className="ml-2 text-xs uppercase tracking-wide opacity-70">({pendingObjection.severity})</span>}
                </p>
                {pendingObjection.legal_reasoning && (
                  <p className="text-sm text-amber-800 mt-1">{pendingObjection.legal_reasoning}</p>
                )}
                {pendingObjection.suggested_rephrasing && (
                  <p className="text-sm text-amber-700 mt-1 italic">
                    Suggested: "{pendingObjection.suggested_rephrasing}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={handleRephrase}
                className="px-4 py-1.5 text-sm border border-amber-400 rounded-lg text-amber-800 hover:bg-amber-100"
              >
                Rephrase My Statement
              </button>
              <button
                onClick={handleContinueAnyway}
                className="px-4 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'hearing' && (
        <ActiveHearing
          currentStep={currentStep}
          messages={messages}
          evidenceCount={pendingEvidence.length + pendingPreparedFolders.length}
          onNextStep={handleNextStep}
          onSendMessage={handleSendMessage}
          onViewEvidence={() => setShowEvidenceModal(true)}
          onBackToDashboard={handleBackToDashboard}
          onPresentEvidence={() => setShowEvidenceModal(true)}
          onUploadEvidence={() => setShowEvidenceModal(true)}
          hasSubmittedEvidence={evidenceFiles.length > 0}
          onToggleSidePanel={() => setShowSidePanel(true)}
          submittedEvidenceCount={evidenceFiles.length}
          onEditMessage={handleEditMessage}
          editingMessage={editingMessage}
          caseData={caseData}
          currentSpeaker={courtSession.currentSpeaker}
          verdictIssued={courtSession.verdictIssued}
          verdictOutcome={courtSession.verdictOutcome}
          tokensUsed={tokensUsed}
          tokenLimit={tokenLimit}
          username={user?.username ?? ''}
          onLogout={handleLogout}
        />
      )}

      {showEvidenceModal && (
        <EvidenceModal
          onSubmit={handlePresentEvidence}
          onCancel={() => setShowEvidenceModal(false)}
          availableEvidence={userEvidence}
        />
      )}

      {showEvidenceIndicator && submittedEvidenceNames.length > 0 && (
        <EvidenceIndicator
          evidenceCount={submittedEvidenceNames.length}
          evidenceNames={submittedEvidenceNames}
          onDismiss={() => setShowEvidenceIndicator(false)}
        />
      )}

      <EvidenceSidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        evidenceFiles={evidenceFiles}
        onPreview={async (file) => {
          try {
            if (!courtSession.sessionId || !file.serverFilename) {
              setPreviewFile(file);
              setShowSidePanel(false);
              return;
            }

            const blob = await courtSessionService.getSubmittedEvidenceFile(
              courtSession.sessionId,
              file.serverFilename
            );
            const previewUrl = URL.createObjectURL(blob);

            if (previewFile?.previewUrl) {
              URL.revokeObjectURL(previewFile.previewUrl);
            }

            setPreviewFile({
              ...file,
              type: blob.type || file.type,
              previewUrl,
            });
            setShowSidePanel(false);
          } catch (error) {
            console.error('Failed to preview evidence file:', error);
            setPreviewFile(file);
            setShowSidePanel(false);
          }
        }}
      />

      <FilePreviewModal
        isOpen={previewFile !== null}
        onClose={() => {
          if (previewFile?.previewUrl) {
            URL.revokeObjectURL(previewFile.previewUrl);
          }
          setPreviewFile(null);
          setShowSidePanel(true);
        }}
        file={previewFile}
      />
    </div>
  );
}
