import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileButton } from './UserProfileButton';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import svgPathsStatus from '../imports/svg-xci9x66byb';
import svgPathsMethod from '../imports/svg-r2hsv0ngij';
import svgPathsUpload from '../imports/svg-epzro4rgnd';
import svgPathsForm from '../imports/svg-lhkt9sq7f6';
import svgPaths from '../imports/svg-z1o5npmmn9';
import { 
  FileText, 
  Upload, 
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  User,
  MapPin,
  DollarSign,
  File,
  X,
  Eye,
  Loader2,
  Scan,
  FileSearch
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner@2.0.3';
import { apiClient, submitCaseData } from '../services/api';

export interface CaseData {
  // Status
  status: 'filed' | 'pending' | null;

  // Data entry method
  entryMethod: 'upload' | 'manual' | null;

  // Case details
  caseNumber: string;
  caseType: string;
  state: string;
  county: string;

  // Parties
  plaintiffName: string;
  plaintiffAddress: string;
  defendantName: string;
  defendantAddress: string;

  // Claim
  claimSummary: string;
  amountSought: string;

  // Dates
  filingDate: Date | null;
  hasFilingDate: boolean;
  incidentDate?: Date | null;
  courtDate: Date | null;
  hasCourtDate: boolean;
  serviceStatus: 'yes' | 'no' | null;
  serviceDate: Date | null
}

export function CaseIntake() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as 'filed' | 'pending' | null;

  const [step, setStep] = useState<'status' | 'method' | 'upload' | 'form'>(statusParam ? 'method' : 'status');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrCaseId, setOcrCaseId] = useState<number | null>(null);
  const [caseData, setCaseData] = useState<CaseData>({
    status: statusParam ?? null,
    entryMethod: null,
    caseNumber: '',
    caseType: '',
    state: '',
    county: '',
    plaintiffName: '',
    plaintiffAddress: '',
    defendantName: '',
    defendantAddress: '',
    claimSummary: '',
    amountSought: '',
    filingDate: null,
    hasFilingDate: false,
    incidentDate: null,
    courtDate: null,
    hasCourtDate: false,
    serviceStatus: 'no',
    serviceDate: null
  });

  const handleStatusSelect = (status: 'filed' | 'pending') => {
    setCaseData({ ...caseData, status });
    setStep('method');
  };

  const handleMethodSelect = (method: 'upload' | 'manual') => {
    setCaseData({ ...caseData, entryMethod: method });
    if (method === 'manual') {
      setStep('form');
    } else {
      setStep('upload');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsAnalyzing(true);

    try {
      // Get user ID from auth context
      const userId = user!.userId;

      // Upload PDF
      const { job_id } = await apiClient.uploadPdf(file, userId);
      toast.success('File uploaded! Analyzing document...');

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const status = await apiClient.pollJobStatus(job_id);

          if (status.status === 'completed' && status.case_id) {
            clearInterval(pollInterval);

            // Track the OCR-created case so we don't create a duplicate on submit
            setOcrCaseId(status.case_id);

            // Fetch extracted case data
            const caseData = await apiClient.getCase(status.case_id);

            // Pre-fill form fields
            setCaseData(prev => ({
              ...prev,
              caseNumber: caseData.case_number || '',
              caseType: caseData.case_type,
              state: caseData.state,
              county: caseData.county || '',
              plaintiffName: caseData.plaintiffs[0]?.name || '',
              plaintiffAddress: caseData.plaintiffs[0]?.address || '',
              defendantName: caseData.defendants[0]?.name || '',
              defendantAddress: caseData.defendants[0]?.address || '',
              claimSummary: caseData.claim_summary,
              amountSought: caseData.amount_sought?.toString() || '',
              filingDate: caseData.filing_date ? new Date(caseData.filing_date) : null,
              entryMethod: 'upload',
              status: 'filed'
            }));

            setIsAnalyzing(false);
            setStep('form');
            toast.success('Document analyzed successfully!');

          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            toast.error(`Analysis failed: ${status.error || 'Unknown error'}`);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          toast.error('Failed to check analysis status');
        }
      }, 2000); // Poll every 2 seconds

    } catch (error) {
      setIsAnalyzing(false);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Simulate input event to use same handler
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;

      // Create synthetic event
      const event = {
        target: input
      } as React.ChangeEvent<HTMLInputElement>;

      await handleFileUpload(event);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!caseData.caseType || !caseData.state || !caseData.county) {
      toast.error('Please fill in all required case information fields');
      return;
    }

    if (!caseData.plaintiffName || !caseData.defendantName) {
      toast.error('Please provide plaintiff and defendant information');
      return;
    }

    if (!caseData.claimSummary || !caseData.amountSought) {
      toast.error('Please provide claim details');
      return;
    }

    if (caseData.hasFilingDate && !caseData.filingDate) {
      toast.error('Please select a filing date or indicate the case is not yet filed');
      return;
    }

    if (caseData.hasCourtDate && !caseData.courtDate) {
      toast.error('Please select a court date or indicate no hearing is scheduled');
      return;
    }

    if (caseData.serviceStatus === 'yes' && !caseData.serviceDate) {
      toast.error('Please select the date you served the defendant');
      return;
    }

    // Get user ID from auth context
    const userId = user!.userId;

    setIsSubmitting(true);

    try {
      // Format date to YYYY-MM-DD or null
      const formatDate = (date: Date | null) => {
        if (!date) return null;
        return date.toISOString().split('T')[0];
      };

      // Submit case data to backend for AI evidence recommendations
      // Pass ocrCaseId if the case was already created by OCR to avoid duplicates
      await submitCaseData(userId, {
        case_number: caseData.caseNumber || null,
        case_type: caseData.caseType,
        state: caseData.state,
        county: caseData.county,
        filing_date: caseData.hasFilingDate ? formatDate(caseData.filingDate) : null,
        hearing_date: caseData.hasCourtDate ? formatDate(caseData.courtDate) : null,
        plaintiffs: [{ name: caseData.plaintiffName, address: caseData.plaintiffAddress || null }],
        defendants: [{ name: caseData.defendantName, address: caseData.defendantAddress || null }],
        claim_summary: caseData.claimSummary,
        amount_sought: caseData.amountSought ? parseFloat(caseData.amountSought) : null,
        incident_date: formatDate(caseData.incidentDate || null),
        demand_letter_sent: false,
        agreement_included: false,
        existing_case_id: ocrCaseId ?? undefined,
      });

      toast.success('Case information saved! Evidence recommendations generated.');

      // Navigate to success screen
      navigate(`/case/${userId}`);
    } catch (error) {
      console.error('Failed to submit case data:', error);
      toast.error(`Failed to save case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f9fafb] flex flex-col gap-[32px] items-center w-full pb-12">
      {/* Global Header */}
      <div className="bg-white w-full border-b border-[rgba(0,0,0,0.1)] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col h-[81px] items-start justify-center px-[48px] max-w-[1440px] mx-auto">
          <div className="flex h-[48px] items-center justify-between w-full">
            <div className="flex flex-col items-start justify-center">
              <div className="flex items-center gap-[8px] h-[28px]">
                <h1 className="font-semibold text-[#101828] text-[18px] tracking-[-0.4395px]">
                  Pro Se Pro
                </h1>
                <div className="flex items-center gap-[6px]">
                  <span className="bg-[#dbeafe] border border-[#bedbff] text-[#1447e6] text-[12px] font-medium px-[9px] py-[3px] rounded-[4px] leading-none">
                    BETA
                  </span>
                  <span className="bg-[#dcfce7] border border-[#b9f8cf] text-[#008236] text-[12px] font-medium px-[9px] py-[3px] rounded-[4px] leading-none">
                    FREE
                  </span>
                </div>
              </div>
              <p className="font-normal text-[#4a5565] text-[14px] leading-[20px] tracking-[-0.1504px] mt-0.5">
                Help Small Claims Plaintiffs Prepare, Step by Step
              </p>
            </div>
            <UserProfileButton />
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col gap-[32px] items-start w-[896px] max-w-full px-4">
        {/* Header Section */}
        <div className="flex flex-col gap-[14px] items-center w-full">
          <div className="bg-[#dbeafe] relative rounded-full size-[64px] flex items-center justify-center">
            <svg className="size-[32px]" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
              <g>
                <path d={svgPathsStatus.p101a6580} stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                <path d={svgPathsStatus.p76546be} stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                <path d="M13.3333 12H10.6667" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                <path d="M21.3333 17.3333H10.6667" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                <path d="M21.3333 22.6667H10.6667" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
              </g>
            </svg>
          </div>
          <p className="font-normal leading-[40px] text-[#1e1e1e] text-[36px] text-center tracking-[0.3691px]">Let's Get Started</p>
          <p className="font-normal leading-[28px] text-[#1e1e1e] text-[20px] text-center tracking-[-0.4492px]">First, we need some basic information about your case</p>
        </div>

        {/* Progress Indicator */}
        <div className="h-[36px] w-full flex items-center justify-center">
          <div className="flex gap-[8px] items-center justify-center">
            {/* Step 1: Entry Method */}
            <div className={`${
              step === 'method' || step === 'upload' ? 'bg-[#dbeafe]' :
              step === 'form' ? 'bg-[#dcfce7]' : 'bg-[#f3f4f6]'
            } h-[36px] rounded-full px-[16px] flex items-center`}>
              {step === 'form' && (
                <svg className="size-[16px] mr-[8px]" fill="none" viewBox="0 0 16 16">
                  <g clipPath="url(#clip1)">
                    <path d={svgPathsMethod.p3eaa2980} stroke="#34C759" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    <path d={svgPathsMethod.p1f2c5400} stroke="#34C759" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                  </g>
                  <defs><clipPath id="clip1"><rect fill="white" height="16" width="16" /></clipPath></defs>
                </svg>
              )}
              <p className={`font-normal leading-[20px] text-[14px] tracking-[-0.1504px] ${
                step === 'method' || step === 'upload' ? 'text-[#0088FF]' :
                step === 'form' ? 'text-[#34c759]' : 'text-[#99a1af]'
              }`}>1. Entry Method</p>
            </div>

            {/* Arrow */}
            <svg className="size-[16px]" fill="none" viewBox="0 0 16 16">
              <path d="M6 12L10 8L6 4" stroke="#99A1AF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            </svg>

            {/* Step 2: Case Details */}
            <div className={`${
              step === 'form' ? 'bg-[#dbeafe]' : 'bg-[#f3f4f6]'
            } h-[36px] rounded-full px-[16px] flex items-center`}>
              <p className={`font-normal leading-[20px] text-[14px] tracking-[-0.1504px] ${
                step === 'form' ? 'text-[#0088FF]' : 'text-[#99a1af]'
              }`}>2. Case Details</p>
            </div>
          </div>
        </div>

        {/* Step 1: Data Entry Method */}
        {step === 'method' && (
          <div className="bg-white relative rounded-[14px] w-full border border-[rgba(0,0,0,0.1)]">
            <div className="flex flex-col gap-[24px] items-start p-[25px]">
              {/* Back Button */}
              <button
                // onClick={() => navigate('/')}
                onClick={() => navigate('/', { state: { forceShowLanding: true } })}
                className="bg-white h-[36px] relative rounded-[8px] border border-[rgba(0,0,0,0.1)] px-[12px] hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium leading-[20px] text-[#0a0a0a] text-[14px] text-center tracking-[-0.1504px]">← Back</p>
              </button>

              <div className="flex flex-col gap-[8px] items-start w-full">
                <p className="font-medium leading-[32px] text-[#0a0a0a] text-[24px] tracking-[0.0703px]">How would you like to enter your case information?</p>
                <p className="font-normal leading-[24px] text-[#4a5565] text-[16px] tracking-[-0.3125px]">Choose the method that works best for you</p>
              </div>

              <div className="grid grid-cols-2 gap-[16px] w-full">
                {/* Upload Court Forms */}
                <button
                  onClick={() => handleMethodSelect('upload')}
                  className="h-[158px] relative rounded-[10px] border-2 border-[#e5e7eb] hover:border-[#0088FF] transition-colors"
                >
                  <div className="flex flex-col items-start pt-[26px] px-[26px] pb-[2px] h-full">
                    <div className="flex gap-[16px] items-start w-full">
                      <div className="bg-[#f3e8ff] relative rounded-[10px] size-[48px] flex items-center justify-center flex-shrink-0">
                        <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                          <g>
                            <path d="M12 3V15" stroke="#9810FA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d="M17 8L12 3L7 8" stroke="#9810FA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d={svgPathsMethod.p2d557600} stroke="#9810FA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </g>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px] text-left mb-[8px]">Upload Court Forms</p>
                        <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px] text-left mb-[8px]">Upload a PDF or image and we'll extract the information</p>
                        <div className="bg-[#f3e8ff] border border-[rgba(0,0,0,0)] rounded-[8px] w-fit px-[8px] py-[3px]">
                          <p className="font-medium leading-[16px] text-[#9810fa] text-[12px]">Quick start</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Enter Manually */}
                <button
                  onClick={() => handleMethodSelect('manual')}
                  className="h-[158px] relative rounded-[10px] border-2 border-[#e5e7eb] hover:border-[#0088FF] transition-colors"
                >
                  <div className="flex flex-col items-start pt-[36px] px-[26px] pb-[2px] h-full">
                    <div className="flex gap-[16px] items-start w-full">
                      <div className="bg-[#dbeafe] relative rounded-[10px] size-[48px] flex items-center justify-center flex-shrink-0">
                        <svg className="size-[24px]" fill="none" viewBox="0 0 24 24">
                          <g>
                            <path d={svgPathsMethod.pb47f400} stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d={svgPathsMethod.p17a13100} stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d="M10 9H8" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d="M16 13H8" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                            <path d="M16 17H8" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                          </g>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px] text-left mb-[8px]">Enter Manually</p>
                        <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px] text-left">Fill out a simple form with your case details</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Upload Form */}
        {step === 'upload' && (
          <div className="bg-white relative rounded-[14px] w-full border border-[rgba(0,0,0,0.1)]">
            <div className="flex flex-col gap-[24px] items-start p-[24px]">
              {/* Back Button */}
              <button
                onClick={() => setStep('method')}
                className="bg-white h-[36px] relative rounded-[8px] border border-[rgba(0,0,0,0.1)] px-[12px] hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium leading-[20px] text-[#1e1e1e] text-[14px] text-center tracking-[-0.1504px]">← Back</p>
              </button>

              <div className="flex flex-col gap-[8px] items-start w-full">
                <p className="font-medium leading-[32px] text-[#1e1e1e] text-[24px] tracking-[0.0703px]">Upload Your Court Forms</p>
                <p className="font-normal leading-[24px] text-[#4a5565] text-[16px] tracking-[-0.3125px]">Upload PDF or image files of your small claims court documents</p>
              </div>

              {!uploadedFile ? (
                <div
                  className={`bg-[#f9fafb] border-2 border-[#d1d5dc] ${isDragging ? 'border-[#9810FA]' : 'border-dashed'} rounded-[10px] p-[36px] w-full transition-colors`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <div className="bg-[#f3e8ff] relative rounded-full size-[64px] flex items-center justify-center mb-[16px]">
                      <svg className="size-[32px]" fill="none" viewBox="0 0 32 32">
                        <g>
                          <path d="M16 4V20" stroke="#9810FA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                          <path d={svgPathsUpload.p171a9480} stroke="#9810FA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                          <path d={svgPathsUpload.p110a37f0} stroke="#9810FA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66667" />
                        </g>
                      </svg>
                    </div>
                    <p className="font-normal leading-[28px] text-[#1e1e1e] text-[18px] text-center tracking-[-0.4395px] mb-[8px]">
                      Drag and drop your file here
                    </p>
                    <p className="font-normal leading-[20px] text-[#6a7282] text-[14px] text-center tracking-[-0.1504px] mb-[16px]">
                      or
                    </p>
                    <div className="relative">
                      <button className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[8px] h-[36px] px-[16px] hover:bg-gray-50 transition-colors">
                        <p className="font-medium leading-[20px] text-[#1e1e1e] text-[14px] text-center tracking-[-0.1504px]">
                          Browse Files
                        </p>
                      </button>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                    </div>
                    <p className="font-normal leading-[16px] text-[#6a7282] text-[12px] text-center mt-[32px]">
                      Supported formats: PDF (Max 10MB)
                    </p>
                  </div>
                </div>
              ) : isAnalyzing ? (
                // Analyzing Screen
                <div className="space-y-6">
                  <div className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-12">
                    <div className="text-center">
                      {/* Animated Icon */}
                      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                        <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-75"></div>
                        <div className="relative inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full">
                          <Scan className="w-10 h-10 text-purple-600 animate-pulse" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl mb-3">Analyzing Your Document...</h3>
                      <p className="text-gray-600 mb-6">Please wait while we process your court forms</p>
                      
                      {/* Progress Steps */}
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                          <span className="text-sm">Reading document structure...</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                          <FileSearch className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Extracting case information...</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/40 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-gray-300" />
                          <span className="text-sm text-gray-400">Verifying details...</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Helpful Tip */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">
                          <strong>Hang tight!</strong> We're scanning your document to make the next steps easier. 
                          This usually takes just a few seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Uploaded File Display */}
                  <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <File className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="mb-1">{uploadedFile.name}</h4>
                              <p className="text-sm text-gray-600">
                                {(uploadedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadedFile(null)}
                              className="p-1 hover:bg-green-200 rounded transition-colors"
                              title="Remove file"
                            >
                              <X className="w-5 h-5 text-gray-600" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">File uploaded successfully</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Information Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="mb-2">
                          <strong>We've saved your document for reference.</strong>
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          To help you get started quickly, we'll guide you through entering the key information manually. 
                          You can reference your uploaded document throughout the process.
                        </p>
                        <p className="text-xs text-gray-600">
                          Automatic extraction from court forms is coming soon!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      onClick={() => setStep('form')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Continue to Form
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setUploadedFile(null)}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Different File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Manual Entry Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-8 w-full">
            {/* Case Information */}
            <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[14px]">
              <div className="px-[25px] py-[25px] space-y-[24px]">
                <div className="flex items-center gap-[12px]">
                  <div className="bg-[#dbeafe] relative rounded-[10px] size-[40px] flex items-center justify-center">
                    <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                      <g>
                        <path d={svgPaths.pcfbcf00} stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.pd2076c0} stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d="M8.33333 7.5H6.66667" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d="M13.3333 10.8333H6.66667" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d="M13.3333 14.1667H6.66667" stroke="#0088FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px]">Case Information</h3>
                    <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px]">Basic details about your case</p>
                  </div>
                </div>

                <div className="space-y-[16px]">
                  <div>
                    <label htmlFor="caseNumber" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Case Number
                    </label>
                    <Input
                      id="caseNumber"
                      placeholder="e.g., 2025-SC-1234"
                      value={caseData.caseNumber}
                      onChange={(e) => setCaseData({ ...caseData, caseNumber: e.target.value })}
                      className="h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="caseType" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Case Type <span className="text-[#fb2c36]">*</span>
                    </label>
                    <Select
                      value={caseData.caseType}
                      onValueChange={(value) => setCaseData({ ...caseData, caseType: value })}
                    >
                      <SelectTrigger id="caseType" className="h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]">
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract Dispute</SelectItem>
                        <SelectItem value="property">Property Damage</SelectItem>
                        <SelectItem value="debt">Debt Collection</SelectItem>
                        <SelectItem value="landlord-tenant">Landlord-Tenant</SelectItem>
                        <SelectItem value="personal-injury">Personal Injury</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-[16px]">
                    <div>
                      <label htmlFor="state" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                        State <span className="text-[#fb2c36]">*</span>
                      </label>
                      <Input
                        id="state"
                        placeholder="e.g., California"
                        value={caseData.state}
                        onChange={(e) => setCaseData({ ...caseData, state: e.target.value })}
                        required
                        className="h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                      />
                    </div>

                    <div>
                      <label htmlFor="county" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                        County <span className="text-[#fb2c36]">*</span>
                      </label>
                      <Input
                        id="county"
                        placeholder="e.g., Los Angeles"
                        value={caseData.county}
                        onChange={(e) => setCaseData({ ...caseData, county: e.target.value })}
                        required
                        className="h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Plaintiff Information */}
            <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[14px]">
              <div className="px-[25px] py-[25px] space-y-[24px]">
                <div className="flex items-center gap-[12px]">
                  <div className="bg-[#dcfce7] relative rounded-[10px] size-[40px] flex items-center justify-center">
                    <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                      <g>
                        <path d={svgPaths.p1beb9580} stroke="#34C759" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p32ab0300} stroke="#34C759" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px]">Plaintiff Information</h3>
                    <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px]">That's you - the person bringing the claim</p>
                  </div>
                </div>

                <div className="space-y-[16px]">
                  <div>
                    <label htmlFor="plaintiffName" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Your Full Name <span className="text-[#fb2c36]">*</span>
                    </label>
                    <Input
                      id="plaintiffName"
                      placeholder="First and Last Name"
                      value={caseData.plaintiffName}
                      onChange={(e) => setCaseData({ ...caseData, plaintiffName: e.target.value })}
                      required
                      className="h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="plaintiffAddress" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Your Address <span className="text-[#fb2c36]">*</span>
                    </label>
                    <Textarea
                      id="plaintiffAddress"
                      placeholder="Street Address, City, State, ZIP"
                      value={caseData.plaintiffAddress}
                      onChange={(e) => setCaseData({ ...caseData, plaintiffAddress: e.target.value })}
                      className="h-[64px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px] resize-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Defendant Information */}
            <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[14px]">
              <div className="px-[25px] py-[25px] space-y-[24px]">
                <div className="flex items-center gap-[12px]">
                  <div className="bg-[#ffedd4] relative rounded-[10px] size-[40px] flex items-center justify-center">
                    <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                      <g>
                        <path d={svgPaths.p1beb9580} stroke="#F54900" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p32ab0300} stroke="#F54900" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px]">Defendant Information</h3>
                    <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px]">The person or business you're making a claim against</p>
                  </div>
                </div>

                <div className="space-y-[16px]">
                  <div>
                    <label htmlFor="defendantName" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Defendant's Full Name <span className="text-[#fb2c36]">*</span>
                    </label>
                    <Input
                      id="defendantName"
                      placeholder="Full Name or Business Name"
                      value={caseData.defendantName}
                      onChange={(e) => setCaseData({ ...caseData, defendantName: e.target.value })}
                      required
                      className="h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="defendantAddress" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Defendant's Address <span className="text-[#fb2c36]">*</span>
                    </label>
                    <Textarea
                      id="defendantAddress"
                      placeholder="Street Address, City, State, ZIP"
                      value={caseData.defendantAddress}
                      onChange={(e) => setCaseData({ ...caseData, defendantAddress: e.target.value })}
                      className="h-[64px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px] resize-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Claim Details */}
            <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[14px]">
              <div className="px-[25px] py-[25px] space-y-[24px]">
                <div className="flex items-center gap-[12px]">
                  <div className="bg-[#e0e7ff] relative rounded-[10px] size-[40px] flex items-center justify-center">
                    <svg className="size-[20px]" fill="none" viewBox="0 0 20 20">
                      <g>
                        <path d={svgPaths.p1da67b80} stroke="#6366f1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                        <path d={svgPaths.p3055a600} stroke="#6366f1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                      </g>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px]">Claim Details</h3>
                    <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px]">What you're suing for and why</p>
                  </div>
                </div>

                <div className="space-y-[16px]">
                  <div>
                    <label htmlFor="claimSummary" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Brief Summary of Your Claim <span className="text-[#fb2c36]">*</span>
                    </label>
                    <p className="font-normal leading-[20px] text-[#717182] text-[12px] tracking-[-0.1504px] mb-[8px]">
                      Describe in a few sentences what happened and why you're making this claim
                    </p>
                    <Textarea
                      id="claimSummary"
                      placeholder="e.g., I hired the defendant to repair my roof. They took my $2,500 payment but never completed the work..."
                      value={caseData.claimSummary}
                      onChange={(e) => setCaseData({ ...caseData, claimSummary: e.target.value })}
                      rows={4}
                      required
                      className="rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px] resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="amountSought" className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[4px]">
                      Amount You're Seeking <span className="text-[#fb2c36]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[14px]">$</span>
                      <Input
                        id="amountSought"
                        type="number"
                        placeholder="2500"
                        className="pl-7 h-[36px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                        value={caseData.amountSought}
                        onChange={(e) => setCaseData({ ...caseData, amountSought: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Important Dates */}
            <Card className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[14px]">
              <div className="px-[25px] py-[25px] space-y-[24px]">
                <div className="flex items-center gap-[12px]">
                  <div className="bg-[#dbeafe] relative rounded-[10px] size-[40px] flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-[#0088FF]" />
                  </div>
                  <div>
                    <h3 className="font-normal leading-[28px] text-[#0a0a0a] text-[20px] tracking-[-0.4492px]">Important Dates</h3>
                    <p className="font-normal leading-[20px] text-[#4a5565] text-[14px] tracking-[-0.1504px]">Key timeline information for your case</p>
                  </div>
                </div>

                <div className="space-y-[24px]">
                  {/* Filing Date */}
                  <div>
                    <label className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[16px]">
                      When was/will the case be filed? <span className="text-[#fb2c36]">*</span>
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] mb-[16px]">
                      <button
                        type="button"
                        onClick={() => setCaseData({ 
                          ...caseData, 
                          hasFilingDate: true
                        })}
                        className={`p-[16px] border-2 rounded-[8px] text-left transition-all ${
                          caseData.hasFilingDate
                            ? 'border-[#0088FF] bg-[#dbeafe]'
                            : 'border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-[12px]">
                          <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                            caseData.hasFilingDate
                              ? 'border-[#0088FF] bg-[#0088FF]'
                              : 'border-[rgba(0,0,0,0.2)]'
                          }`}>
                            {caseData.hasFilingDate && (
                              <div className="w-[10px] h-[10px] bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-normal text-[14px] tracking-[-0.1504px] ${caseData.hasFilingDate ? 'text-[#0a0a0a]' : 'text-[#717182]'}`}>
                            I know the filing date
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCaseData({ 
                          ...caseData, 
                          hasFilingDate: false,
                          filingDate: null
                        })}
                        className={`p-[16px] border-2 rounded-[8px] text-left transition-all ${
                          !caseData.hasFilingDate
                            ? 'border-[#0088FF] bg-[#dbeafe]'
                            : 'border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-[12px]">
                          <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                            !caseData.hasFilingDate
                              ? 'border-[#0088FF] bg-[#0088FF]'
                              : 'border-[rgba(0,0,0,0.2)]'
                          }`}>
                            {!caseData.hasFilingDate && (
                              <div className="w-[10px] h-[10px] bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-normal text-[14px] tracking-[-0.1504px] ${!caseData.hasFilingDate ? 'text-[#0a0a0a]' : 'text-[#717182]'}`}>
                            Not yet filed / Don't know
                          </span>
                        </div>
                      </button>
                    </div>

                    {caseData.hasFilingDate && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-[44px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {caseData.filingDate ? format(caseData.filingDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={caseData.filingDate || undefined}
                            onSelect={(date) => setCaseData({ ...caseData, filingDate: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Court Date */}
                  <div>
                    <label className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[16px]">
                      Is a court hearing scheduled? <span className="text-[#fb2c36]">*</span>
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] mb-[16px]">
                      <button
                        type="button"
                        onClick={() => setCaseData({ 
                          ...caseData, 
                          hasCourtDate: true
                        })}
                        className={`p-[16px] border-2 rounded-[8px] text-left transition-all ${
                          caseData.hasCourtDate
                            ? 'border-[#0088FF] bg-[#dbeafe]'
                            : 'border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-[12px]">
                          <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                            caseData.hasCourtDate
                              ? 'border-[#0088FF] bg-[#0088FF]'
                              : 'border-[rgba(0,0,0,0.2)]'
                          }`}>
                            {caseData.hasCourtDate && (
                              <div className="w-[10px] h-[10px] bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-normal text-[14px] tracking-[-0.1504px] ${caseData.hasCourtDate ? 'text-[#0a0a0a]' : 'text-[#717182]'}`}>
                            Yes, I have a court date
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCaseData({ 
                          ...caseData, 
                          hasCourtDate: false,
                          courtDate: null
                        })}
                        className={`p-[16px] border-2 rounded-[8px] text-left transition-all ${
                          !caseData.hasCourtDate
                            ? 'border-[#0088FF] bg-[#dbeafe]'
                            : 'border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-[12px]">
                          <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                            !caseData.hasCourtDate
                              ? 'border-[#0088FF] bg-[#0088FF]'
                              : 'border-[rgba(0,0,0,0.2)]'
                          }`}>
                            {!caseData.hasCourtDate && (
                              <div className="w-[10px] h-[10px] bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-normal text-[14px] tracking-[-0.1504px] ${!caseData.hasCourtDate ? 'text-[#0a0a0a]' : 'text-[#717182]'}`}>
                            No hearing scheduled yet
                          </span>
                        </div>
                      </button>
                    </div>

                    {caseData.hasCourtDate && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-[44px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {caseData.courtDate ? format(caseData.courtDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={caseData.courtDate || undefined}
                            onSelect={(date) => setCaseData({ ...caseData, courtDate: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Service Status */}
                  <div>
                    <label className="font-medium leading-[14px] text-[#0a0a0a] text-[14px] tracking-[-0.1504px] block mb-[8px]">
                      Have you served the defendant? <span className="text-[#fb2c36]">*</span>
                    </label>
                    <p className="font-normal leading-[20px] text-[#717182] text-[12px] tracking-[-0.1504px] mb-[16px]">
                      "Serving" means officially delivering the court papers to the defendant
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] mb-[16px]">
                      <button
                        type="button"
                        onClick={() => setCaseData({ 
                          ...caseData, 
                          serviceStatus: 'yes'
                        })}
                        className={`p-[16px] border-2 rounded-[8px] text-left transition-all ${
                          caseData.serviceStatus === 'yes'
                            ? 'border-[#0088FF] bg-[#dbeafe]'
                            : 'border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-[12px]">
                          <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                            caseData.serviceStatus === 'yes'
                              ? 'border-[#0088FF] bg-[#0088FF]'
                              : 'border-[rgba(0,0,0,0.2)]'
                          }`}>
                            {caseData.serviceStatus === 'yes' && (
                              <div className="w-[10px] h-[10px] bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-normal text-[14px] tracking-[-0.1504px] ${caseData.serviceStatus === 'yes' ? 'text-[#0a0a0a]' : 'text-[#717182]'}`}>
                            Yes, I've served the defendant
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCaseData({ 
                          ...caseData, 
                          serviceStatus: 'no',
                          serviceDate: null
                        })}
                        className={`p-[16px] border-2 rounded-[8px] text-left transition-all ${
                          caseData.serviceStatus === 'no'
                            ? 'border-[#0088FF] bg-[#dbeafe]'
                            : 'border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.2)] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-[12px]">
                          <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                            caseData.serviceStatus === 'no'
                              ? 'border-[#0088FF] bg-[#0088FF]'
                              : 'border-[rgba(0,0,0,0.2)]'
                          }`}>
                            {caseData.serviceStatus === 'no' && (
                              <div className="w-[10px] h-[10px] bg-white rounded-full" />
                            )}
                          </div>
                          <span className={`font-normal text-[14px] tracking-[-0.1504px] ${caseData.serviceStatus === 'no' ? 'text-[#0a0a0a]' : 'text-[#717182]'}`}>
                            Not yet / Not applicable
                          </span>
                        </div>
                      </button>
                    </div>

                    {caseData.serviceStatus === 'yes' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal h-[44px] rounded-[8px] border-[rgba(0,0,0,0.12)] text-[14px]"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {caseData.serviceDate ? format(caseData.serviceDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={caseData.serviceDate || undefined}
                            onSelect={(date) => setCaseData({ ...caseData, serviceDate: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('method')}
                className="font-medium leading-[20px] text-[#1e1e1e] text-[14px] tracking-[-0.1504px] hover:text-[#0088FF] transition-colors"
              >
                ← Back
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0088FF] hover:bg-[#0077EE] h-[44px] px-[24px] rounded-[8px] font-medium text-[14px] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    Save and Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
