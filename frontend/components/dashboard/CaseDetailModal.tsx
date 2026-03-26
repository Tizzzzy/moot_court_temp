import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import {
  fetchFullCase,
  updateCase,
  type FullCaseData,
  type CaseUpdateInput,
} from "@/services/api";
import { resolveCaseDisplayName } from "./caseNaming";

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: number | null;
  onSaved?: () => void;
}

const CASE_TYPE_OPTIONS = [
  "small-claims",
  "security-deposit",
  "breach-of-contract",
  "property-damage",
  "personal-injury",
  "other",
];

export default function CaseDetailModal({
  isOpen,
  onClose,
  caseId,
  onSaved,
}: CaseDetailModalProps) {
  const [caseData, setCaseData] = useState<FullCaseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [alias, setAlias] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseType, setCaseType] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [filingDate, setFilingDate] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [claimSummary, setClaimSummary] = useState("");
  const [amountSought, setAmountSought] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [plaintiffName, setPlaintiffName] = useState("");
  const [plaintiffAddress, setPlaintiffAddress] = useState("");
  const [defendantName, setDefendantName] = useState("");
  const [defendantAddress, setDefendantAddress] = useState("");
  const todayString = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || caseId === null) return;

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await fetchFullCase(caseId);
        setCaseData(data);
        setAlias(
          resolveCaseDisplayName({
            alias: data.alias,
            plaintiff: data.plaintiffs[0]?.name,
            defendant: data.defendants[0]?.name,
            caseNumber: data.case_number,
          })
        );
        setCaseNumber(data.case_number ?? "");
        setCaseType(data.case_type ?? "");
        setState(data.state ?? "");
        setCounty(data.county ?? "");
        setFilingDate(data.filing_date ?? "");
        setHearingDate(data.hearing_date ?? "");
        setClaimSummary(data.claim_summary ?? "");
        setAmountSought(data.amount_sought !== null ? String(data.amount_sought) : "");
        setIncidentDate(data.incident_date ?? "");
        setPlaintiffName(data.plaintiffs[0]?.name ?? "");
        setPlaintiffAddress(data.plaintiffs[0]?.address ?? "");
        setDefendantName(data.defendants[0]?.name ?? "");
        setDefendantAddress(data.defendants[0]?.address ?? "");
      } catch (err) {
        setLoadError("Failed to load case details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOpen, caseId]);

  const handleSave = async () => {
    if (!caseId) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      const payload: CaseUpdateInput = {
        alias: alias || null,
        case_number: caseNumber || null,
        case_type: caseType,
        state,
        county: county || null,
        filing_date: filingDate || null,
        hearing_date: hearingDate || null,
        claim_summary: claimSummary,
        amount_sought: amountSought ? parseFloat(amountSought) : null,
        incident_date: incidentDate || null,
        plaintiffs: plaintiffName ? [{ name: plaintiffName, address: plaintiffAddress || null }] : [],
        defendants: defendantName ? [{ name: defendantName, address: defendantAddress || null }] : [],
      };
      await updateCase(caseId, payload);
      onSaved?.();
      onClose();
    } catch (err) {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[14px] border border-[rgba(0,0,0,0.1)] p-[25px] max-w-[896px] w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between py-[8px] mb-[24px]">
          <h2 className="font-medium text-[24px] text-[#0a0a0a] tracking-[-0.3125px]">
            Case Details
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-[#242424]" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading case details...</span>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="py-8 text-center text-red-600 text-sm">{loadError}</div>
        )}

        {!isLoading && !loadError && caseData && (
          <div className="space-y-[24px]">
            <div className="space-y-[16px]">
              <p className="text-[14px] font-semibold text-[#62748e] uppercase tracking-wide">
                Case Information
              </p>
              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-medium text-[14px] text-[#0a0a0a]">Case Alias</label>
                  <input
                    type="text"
                    placeholder="e.g., Landlord Dispute"
                    className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-medium text-[14px] text-[#0a0a0a]">Case Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 2025-SC-1234"
                    className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">
                  Case Type <span className="text-[#fb2c36]">*</span>
                </label>
                <select
                  className="h-[36px] px-[13px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff] bg-white"
                  value={caseType}
                  onChange={(e) => setCaseType(e.target.value)}
                >
                  <option value="">Select case type</option>
                  {CASE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-medium text-[14px] text-[#0a0a0a]">
                    State <span className="text-[#fb2c36]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., California"
                    className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-medium text-[14px] text-[#0a0a0a]">County</label>
                  <input
                    type="text"
                    placeholder="e.g., Los Angeles"
                    className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-[16px]">
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-medium text-[14px] text-[#0a0a0a]">Filing Date</label>
                  <input
                    type="date"
                    max={todayString}
                    className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-[4px]">
                  <label className="font-medium text-[14px] text-[#0a0a0a]">Hearing Date</label>
                  <input
                    type="date"
                    min={todayString}
                    className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-[16px]">
              <p className="text-[14px] font-semibold text-[#62748e] uppercase tracking-wide">
                Plaintiff (You)
              </p>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">
                  Full Name <span className="text-[#fb2c36]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="First and Last Name"
                  className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                  value={plaintiffName}
                  onChange={(e) => setPlaintiffName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">Address</label>
                <textarea
                  placeholder="Street Address, City, State, ZIP"
                  className="h-[64px] px-[12px] py-[8px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] leading-[20px] resize-none focus:outline-none focus:border-[#2b7fff]"
                  value={plaintiffAddress}
                  onChange={(e) => setPlaintiffAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-[16px]">
              <p className="text-[14px] font-semibold text-[#62748e] uppercase tracking-wide">
                Defendant
              </p>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">
                  Full Name <span className="text-[#fb2c36]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full Name or Business Name"
                  className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff]"
                  value={defendantName}
                  onChange={(e) => setDefendantName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">Address</label>
                <textarea
                  placeholder="Street Address, City, State, ZIP"
                  className="h-[64px] px-[12px] py-[8px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] leading-[20px] resize-none focus:outline-none focus:border-[#2b7fff]"
                  value={defendantAddress}
                  onChange={(e) => setDefendantAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-[16px]">
              <p className="text-[14px] font-semibold text-[#62748e] uppercase tracking-wide">
                Claim Details
              </p>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">Incident Date</label>
                <input
                  type="date"
                  max={todayString}
                  className="h-[36px] px-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] focus:outline-none focus:border-[#2b7fff] w-full sm:w-1/2"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">
                  Brief Summary of Your Claim <span className="text-[#fb2c36]">*</span>
                </label>
                <textarea
                  placeholder="Describe what happened and why you are making this claim..."
                  className="h-[96px] px-[12px] py-[8px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] leading-[20px] resize-none focus:outline-none focus:border-[#2b7fff]"
                  value={claimSummary}
                  onChange={(e) => setClaimSummary(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a]">
                  Amount Sought <span className="text-[#fb2c36]">*</span>
                </label>
                <div className="relative w-full sm:w-1/2">
                  <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[14px] text-[#6a7282]">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2500"
                    className="h-[36px] pl-[28px] pr-[12px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] w-full focus:outline-none focus:border-[#2b7fff]"
                    value={amountSought}
                    onChange={(e) => setAmountSought(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-red-600">{saveError}</p>
            )}
          </div>
        )}

        {!isLoading && !loadError && caseData && (
          <div className="flex items-center justify-end gap-[12px] mt-[24px]">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="h-[36px] px-[17px] bg-white border border-[rgba(0,0,0,0.1)] rounded-[8px] font-medium text-[14px] text-[#0a0a0a] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-[36px] px-[29px] bg-black rounded-[8px] font-medium text-[14px] text-white hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
