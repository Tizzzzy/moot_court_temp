import { X } from "lucide-react";
import type { CaseData } from "../../services/api";

interface CaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseData | null;
}

export function CaseDetailModal({ isOpen, onClose, caseData }: CaseDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-[14px] border border-[rgba(0,0,0,0.1)] p-[25px] max-w-[896px] w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between py-[8px] mb-[24px]">
          <h2 className="font-medium text-[24px] text-[#0a0a0a] tracking-[-0.3125px]">
            Case detail
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-[#242424]" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-[24px]">
          {/* Case Information Section */}
          <div className="space-y-[16px]">
            {/* Case Number */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Case Number
              </label>
              <input
                type="text"
                placeholder="e.g., 2025-SC-1234"
                className="h-[36px] px-[12px] py-[4px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.case_number || ""}
                readOnly
              />
            </div>

            {/* Case Type */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Case Type <span className="text-[#fb2c36]">*</span>
              </label>
              <select
                className="h-[36px] px-[13px] py-px border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.case_type || ""}
                disabled
              >
                <option value="">Select case type</option>
                <option value="Small Claims">Small Claims</option>
                <option value="Security Deposit Dispute">Security Deposit Dispute</option>
                <option value="Breach of Contract">Breach of Contract</option>
                <option value="Property Damage">Property Damage</option>
                <option value="Personal Injury">Personal Injury</option>
              </select>
            </div>

            {/* State and Filing Date */}
            <div className="flex gap-[16px]">
              <div className="flex-1 flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                  State <span className="text-[#fb2c36]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., California"
                  className="h-[36px] px-[12px] py-[4px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] focus:outline-none focus:border-[#2b7fff]"
                  defaultValue={caseData?.state || ""}
                  readOnly
                />
              </div>
              <div className="flex-1 flex flex-col gap-[4px]">
                <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                  Filing Date
                </label>
                <input
                  type="text"
                  placeholder="e.g., 2025-01-15"
                  className="h-[36px] px-[12px] py-[4px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] focus:outline-none focus:border-[#2b7fff]"
                  defaultValue={caseData?.filing_date || ""}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Your Information Section */}
          <div className="space-y-[16px]">
            {/* Plaintiff Name */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Plaintiff Name <span className="text-[#fb2c36]">*</span>
              </label>
              <input
                type="text"
                placeholder="First and Last Name"
                className="h-[36px] px-[12px] py-[4px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.plaintiffs?.[0]?.name || ""}
                readOnly
              />
            </div>

            {/* Plaintiff Address */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Plaintiff Address
              </label>
              <textarea
                placeholder="Street Address, City, State, ZIP"
                className="h-[64px] px-[12px] py-[8px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] leading-[20px] resize-none focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.plaintiffs?.[0]?.address || ""}
                readOnly
              />
            </div>
          </div>

          {/* Defendant Information Section */}
          <div className="space-y-[16px]">
            {/* Defendant's Full Name */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Defendant's Full Name <span className="text-[#fb2c36]">*</span>
              </label>
              <input
                type="text"
                placeholder="Full Name or Business Name"
                className="h-[36px] px-[12px] py-[4px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.defendants?.[0]?.name || ""}
                readOnly
              />
            </div>

            {/* Defendant's Address */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Defendant's Address
              </label>
              <textarea
                placeholder="Street Address, City, State, ZIP"
                className="h-[64px] px-[12px] py-[8px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] leading-[20px] resize-none focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.defendants?.[0]?.address || ""}
                readOnly
              />
            </div>
          </div>

          {/* Claim Details Section */}
          <div className="space-y-[16px]">
            {/* Brief Summary */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Brief Summary of Your Claim <span className="text-[#fb2c36]">*</span>
              </label>
              <textarea
                placeholder="Describe in a few sentences what happened and why you're making this claim..."
                className="h-[96px] px-[12px] py-[8px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] leading-[20px] resize-none focus:outline-none focus:border-[#2b7fff]"
                defaultValue={caseData?.claim_summary || ""}
                readOnly
              />
            </div>

            {/* Amount You're Seeking */}
            <div className="flex flex-col gap-[4px]">
              <label className="font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px]">
                Amount You're Seeking <span className="text-[#fb2c36]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[16px] text-[#6a7282] tracking-[-0.3125px]">
                  $
                </span>
                <input
                  type="text"
                  placeholder="2500"
                  className="h-[36px] pl-[28px] pr-[12px] py-[4px] border border-[rgba(0,0,0,0.12)] rounded-[8px] text-[14px] text-[#717182] tracking-[-0.1504px] w-full focus:outline-none focus:border-[#2b7fff]"
                  defaultValue={caseData?.amount_sought?.toString() || ""}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-[12px] mt-[24px]">
          <button
            onClick={onClose}
            className="h-[36px] px-[17px] py-[9px] bg-white border border-[rgba(0,0,0,0.1)] rounded-[8px] font-medium text-[14px] text-[#0a0a0a] tracking-[-0.1504px] hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
