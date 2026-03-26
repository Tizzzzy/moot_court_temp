import React from 'react';
import { UserProfileButton } from '@/components/UserProfileButton';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  tokensUsed: number;
  tokenLimit: number;
  username: string;
  onLogout: () => void;
}

export function DashboardHeader({
  tokensUsed,
  tokenLimit,
  username,
  onLogout,
}: DashboardHeaderProps) {
  const tokensRemaining = tokenLimit - tokensUsed;
  const percentageUsed = Math.round(((tokenLimit - tokensRemaining) / tokenLimit) * 100);

  // Determine bar color based on usage
  const barColor =
    tokensUsed >= tokenLimit * 0.9
      ? 'bg-red-500'
      : 'bg-green-500';

  return (
    <header className="w-full border-b border-gray-100 bg-white h-20">
      <div className="max-w-[1256px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Left: App Name + BETA Badge */}
        <Link 
          to="/" 
          state={{ forceShowLanding: true }}
          className="flex flex-col items-start justify-center cursor-pointer hover:opacity-80 transition-opacity block"
        >
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
        </Link>

        {/* Center: Token Progress Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 w-64 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Tokens available</span>
            <span className="text-sm font-semibold text-gray-900">
              {tokensRemaining.toLocaleString()}/{tokenLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${barColor}`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{username}</span>
          <UserProfileButton />
        </div>
      </div>
    </header>
  );
}
