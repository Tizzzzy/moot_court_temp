import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  CheckCircle,
  Calendar,
  FileText,
  Scale,
  User,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../services/api';
import type { CaseResponse } from '../services/api';

export function CaseSuccess() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadCaseData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch from API first
        try {
          const response = await fetch(`/api/case-data/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setCaseData(data);
            return;
          }
        } catch (e) {
          console.log('API not available, checking localStorage');
        }

        // Fallback: would need to get case data from localStorage if API is down
        // For now, just show a placeholder
        setCaseData({
          id: 0,
          user_id: userId,
          case_number: null,
          case_type: 'Small Claims',
          state: '',
          filing_date: null,
          claim_summary: 'Your case information is being prepared...',
          amount_sought: null,
          incident_date: null,
          plaintiffs: [],
          defendants: [],
        });
      } catch (err) {
        console.error('Error loading case data:', err);
        setError('Unable to load case information. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCaseData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-12">
        <Card className="max-w-2xl w-full p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading case information...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-12">
        <Card className="max-w-2xl w-full p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">Error Loading Case</h2>
              <p className="text-sm text-gray-600 mt-1">{error || 'Unable to load case information'}</p>
              <Button
                onClick={() => navigate('/')}
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4 py-12">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-normal mb-2">Case Details Saved!</h1>
          <p className="text-gray-600">Your case information has been successfully recorded.</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-medium mb-4">Case Summary</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Case Type</p>
                <p className="font-medium">{caseData.case_type || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Case Number</p>
                <p className="font-medium">{caseData.case_number || 'Pending'}</p>
              </div>
            </div>

            {caseData.amount_sought && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Amount Sought</p>
                  <p className="font-medium">${caseData.amount_sought.toLocaleString()}</p>
                </div>
              </div>
            )}

            {caseData.plaintiffs && caseData.plaintiffs.length > 0 && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Plaintiff</p>
                  <p className="font-medium">{caseData.plaintiffs[0]?.name || 'Not specified'}</p>
                </div>
              </div>
            )}

            {caseData.defendants && caseData.defendants.length > 0 && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Defendant</p>
                  <p className="font-medium">{caseData.defendants[0]?.name || 'Not specified'}</p>
                </div>
              </div>
            )}

            {caseData.hearing_date && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Hearing Date</p>
                  <p className="font-medium">
                    {new Date(caseData.hearing_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-6">
            Your case preparation journey begins here. We'll help you prepare step by step.
          </p>
          <Button
            onClick={() => navigate(`/dashboard/${userId}`)}
            className="w-full"
            size="lg"
          >
            Continue to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
