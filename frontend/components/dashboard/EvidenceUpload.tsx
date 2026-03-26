import { useState, useRef, useEffect } from "react";
import { FileText, X, Upload, Info } from "lucide-react";
import {
  uploadEvidenceFile,
  analyzeEvidence,
  type EvidenceRecommendation,
} from "@/services/api";

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

interface EvidenceUploadProps {
  evidenceIndex: number | null;
  evidenceCategory: EvidenceRecommendation | null;
  userId: string;
  caseId?: number | null;
  onUpdate?: (index: number, hasFiles: boolean, analyzed: boolean, files: UploadedFile[], status: "ready" | "needs-improvement" | "none") => void;
  onClose?: () => void;
  initialFiles?: UploadedFile[];
  initialAnalyzed?: boolean;
  initialStatus?: "ready" | "needs-improvement" | "none";
}

export default function EvidenceUpload({
  evidenceIndex,
  evidenceCategory,
  userId,
  caseId,
  onUpdate,
  onClose,
  initialFiles = [],
  initialAnalyzed = false,
  initialStatus = "none",
}: EvidenceUploadProps) {
  const startsInReplacementMode = initialStatus === "ready";
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(initialAnalyzed);
  const [hasStartedReplacementUpload, setHasStartedReplacementUpload] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawFilesRef = useRef<Map<string, File>>(new Map());

  const title = evidenceCategory?.title ?? "Evidence";
  const description = evidenceCategory?.description ?? "";
  const folderName = evidenceCategory?.folderName ?? "";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files);

    const newFiles: UploadedFile[] = selectedFiles.map((file) => {
      const id = Math.random().toString(36).substr(2, 9);
      rawFilesRef.current.set(id, file);
      return {
        id,
        name: file.name,
        size: file.size,
        status: "pending",
      };
    });

    setUploadedFiles((prev) => {
      if (startsInReplacementMode && !hasStartedReplacementUpload) {
        return newFiles;
      }
      return [...prev, ...newFiles];
    });
    if (startsInReplacementMode && !hasStartedReplacementUpload) {
      rawFilesRef.current.clear();
      newFiles.forEach((meta, idx) => {
        const selected = selectedFiles[idx];
        if (selected) {
          rawFilesRef.current.set(meta.id, selected);
        }
      });
      setHasStartedReplacementUpload(true);
    }
    setHasAnalyzed(false);
    setAnalysisError(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (id: string) => {
    rawFilesRef.current.delete(id);
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0 || !folderName) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    // Set all to analyzing
    setUploadedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        status: "analyzing" as const,
      }))
    );

    try {
      // Upload all pending files to the server
      for (const file of uploadedFiles) {
        const rawFile = rawFilesRef.current.get(file.id);
        if (rawFile) {
          await uploadEvidenceFile(userId, folderName, rawFile, caseId);
        }
      }

      // Analyze all files in the folder
      const results = await analyzeEvidence(userId, folderName, caseId);

      // Map results back to uploaded files
      setUploadedFiles((prev) =>
        prev.map((file) => {
          const result = results.find((r) => r.filename === file.name);
          if (result) {
            return {
              ...file,
              status: result.ready_status ? "valid" : "invalid",
              feedback: {
                message: result.specific_feedback,
                suggestions: [],
              },
            };
          }
          return { ...file, status: "pending" as const };
        })
      );

      setHasAnalyzed(true);
    } catch (err) {
      console.error("Analysis failed:", err);
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
      // Reset status on error
      setUploadedFiles((prev) =>
        prev.map((file) => ({
          ...file,
          status: "pending" as const,
        }))
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const validFilesCount = uploadedFiles.filter((f) => f.status === "valid").length;
  const invalidFilesCount = uploadedFiles.filter((f) => f.status === "invalid").length;
  const allFilesValid = uploadedFiles.length > 0 && validFilesCount === uploadedFiles.length;

  // Aggregate feedback messages for display
  const feedbackMessages = uploadedFiles
    .filter((f) => f.feedback?.message)
    .map((f) => f.feedback!.message);
  const primaryFeedback = feedbackMessages[0] || "";

  useEffect(() => {
    if (onUpdate && evidenceIndex !== null) {
      onUpdate(
        evidenceIndex,
        uploadedFiles.length > 0,
        hasAnalyzed,
        uploadedFiles,
        allFilesValid ? "ready" : invalidFilesCount > 0 ? "needs-improvement" : "none"
      );
    }
  }, [uploadedFiles, hasAnalyzed, evidenceIndex, onUpdate]);

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(0,0,0,0.1)] overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="w-full">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <p className="text-[20px] text-[#0a0a0a] tracking-[-0.3125px]">
                <span className="font-['Inter:Medium',sans-serif] font-medium">{title}</span>
                {uploadedFiles.length > 0 && (
                  <>
                    <span className="font-['Inter:Medium',sans-serif] font-medium"> - </span>
                    <span className="font-['Inter:Bold',sans-serif] font-bold">{uploadedFiles.length}</span>
                    <span className="font-['Inter:Medium',sans-serif] font-medium"> file{uploadedFiles.length !== 1 ? "s" : ""} uploaded</span>
                  </>
                )}
              </p>
              {allFilesValid && hasAnalyzed && (
                <div className="bg-[#dcfce7] border border-[#b9f8cf] h-[22px] px-[5px] py-px rounded-[8px] flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="5.5" stroke="#016630" />
                    <path d="M4.5 6L5.5 7L7.5 5" stroke="#016630" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="font-['Inter:Medium',sans-serif] font-medium text-[12px] text-[#016630]">Ready to use</p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6L18 18" stroke="#242424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-[16px] text-[#62748e] tracking-[-0.625px] leading-[24px] mt-1">
            {description}
          </p>
        </div>

        {/* Content */}
        <div className="w-full">
          {uploadedFiles.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
              <div className="bg-[#f8fafc] flex flex-col items-center gap-4 py-[60px]">
                <div className="bg-[#f1f5f9] rounded-full w-16 h-16 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 32 32">
                    <path d="M6.66667 21.3333V25.3333C6.66667 26.0406 6.94762 26.7189 7.44772 27.219C7.94781 27.719 8.62609 28 9.33333 28H22.6667C23.3739 28 24.0522 27.719 24.5523 27.219C25.0524 26.7189 25.3333 26.0406 25.3333 25.3333V21.3333M20 10.6667L16 6.66667M16 6.66667L12 10.6667M16 6.66667V20" stroke="#64748B" strokeWidth="2.66667" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-[14px] text-[#64748b] tracking-[-0.1504px] leading-[21px]">
                  No files uploaded yet. Click the Upload button to add evidence.
                </p>
                <button
                  onClick={handleUploadClick}
                  className="bg-[#2b7fff] text-white px-6 h-[37px] rounded-[10px] flex items-center gap-2 hover:bg-[#1e6fe6] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M3.33333 10.6667V12.6667C3.33333 13.0203 3.47381 13.3594 3.72386 13.6095C3.97391 13.8595 4.31304 14 4.66667 14H11.3333C11.687 14 12.0261 13.8595 12.2761 13.6095C12.5262 13.3594 12.6667 13.0203 12.6667 12.6667V10.6667M10 5.33333L8 3.33333M8 3.33333L6 5.33333M8 3.33333V10" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px] tracking-[-0.1504px]">Upload Files</span>
                </button>
              </div>
            </div>
          ) : (
            /* Files Uploaded State */
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
              <div className="bg-[#f8fafc] p-3 flex flex-col gap-3">
                {/* Error Message */}
                {analysisError && (
                  <div className="bg-red-50 border border-red-200 rounded-[10px] p-[13px]">
                    <div className="flex gap-3">
                      <Info className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
                      <p className="text-[14px] text-red-700">{analysisError}</p>
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                {hasAnalyzed && uploadedFiles.length > 0 && (
                  <>
                    {uploadedFiles.filter((f) => f.feedback?.message).map((file) => {
                      const isValid = file.status === "valid";
                      return (
                        <div
                          key={`feedback-${file.id}`}
                          className={`${
                            isValid
                              ? "bg-[#dcfce7] border-[#b9f8cf]"
                              : "bg-[#eff6ff] border-[#bedbff]"
                          } border rounded-[10px] p-[13px]`}
                        >
                          <div className="flex gap-3">
                            <Info
                              className={`w-4 h-4 flex-shrink-0 mt-1 ${
                                isValid ? "text-[#016630]" : "text-[#155DFC]"
                              }`}
                            />
                            <div className="flex-1">
                              <p
                                className={`font-medium text-[14px] mb-1 ${
                                  isValid ? "text-[#016630]" : "text-[#1c398e]"
                                }`}
                              >
                                {file.name} — {isValid ? "Ready to use" : "Needs improvement"}
                              </p>
                              <div
                                className={`max-h-[200px] overflow-y-auto text-[13px] leading-[20px] whitespace-pre-wrap ${
                                  isValid ? "text-[#016630]" : "text-[#1c398e]"
                                }`}
                              >
                                {file.feedback!.message}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* File List */}
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white border border-[#e2e8f0] rounded-[10px] h-[67px] flex items-center justify-between px-[17px]"
                  >
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-[#0a0a0a]" />
                      <span className="text-[16px] font-['Inter:Bold',sans-serif] font-bold text-[#0f172b] tracking-[-0.3125px]">
                        {file.name}
                      </span>
                      {file.status === "analyzing" && (
                        <div className="ml-2 bg-[#dbeafe] border border-[#93c5fd] text-[#1e40af] text-[12px] px-2 py-1 rounded-lg font-medium flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
                          Analyzing...
                        </div>
                      )}
                      {file.status === "valid" && hasAnalyzed && (
                        <div className="ml-2 bg-[#dcfce7] border border-[#b9f8cf] h-[22px] px-[5px] py-px rounded-[8px] flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="5.5" stroke="#016630" />
                            <path d="M4.5 6L5.5 7L7.5 5" stroke="#016630" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="font-['Inter:Medium',sans-serif] font-medium text-[12px] text-[#016630] capitalize">Valid</p>
                        </div>
                      )}
                      {file.status === "invalid" && hasAnalyzed && (
                        <div className="ml-2 bg-[#fef9c2] border border-[#ac7f5e] h-[22px] px-[5px] py-px rounded-[8px] flex items-center gap-2">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                            <circle cx="6" cy="6" r="5.5" stroke="#AC7F5E" />
                            <path d="M7.5 4.5L4.5 7.5M4.5 4.5L7.5 7.5" stroke="#AC7F5E" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="font-['Inter:Medium',sans-serif] font-medium text-[12px] text-[#ac7f5e] capitalize">Invalid</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="w-9 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M12 4L4 12M4 4L12 12" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add New Button */}
                <button
                  onClick={handleUploadClick}
                  className="bg-white border border-[rgba(0,0,0,0.1)] h-8 rounded-lg px-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors w-[111px]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M3.33333 10.6667V12.6667C3.33333 13.0203 3.47381 13.3594 3.72386 13.6095C3.97391 13.8595 4.31304 14 4.66667 14H11.3333C11.687 14 12.0261 13.8595 12.2761 13.6095C12.5262 13.3594 12.6667 13.0203 12.6667 12.6667V10.6667M10 5.33333L8 3.33333M8 3.33333L6 5.33333M8 3.33333V10" stroke="#0A0A0A" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">Add new</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="w-full flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-white border border-[rgba(0,0,0,0.1)] h-9 w-[120px] rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">Cancel</span>
          </button>
          <button
            onClick={handleAnalyze}
            disabled={uploadedFiles.length === 0 || isAnalyzing || hasAnalyzed}
            className={`h-9 w-[120px] rounded-lg flex items-center justify-center transition-colors ${
              uploadedFiles.length === 0 || hasAnalyzed
                ? "bg-[#ccc] cursor-not-allowed"
                : isAnalyzing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            <span className="font-['Inter:Medium',sans-serif] font-medium text-[14px] text-white tracking-[-0.1504px]">
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
