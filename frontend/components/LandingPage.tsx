import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/authService';
import DesignAiCourtroomCoachLandingPage from '@/imports/DesignAiCourtroomCoachLandingPage-1-734';
import { UserProfileButton } from '@/components/UserProfileButton';
import { hasReachedTokenLimit, showTokenLimitReachedMessage } from '@/utils/tokenGuard';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getSection = (index: number) =>
    wrapperRef.current?.querySelectorAll('[data-name="Section"]')?.[index];

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    const button = target.closest('[data-name="Button"]');
    const text = (button ?? target).textContent ?? '';

    // Check if they clicked the specific SVG button by checking data-name
    const isSeeHowItWorks = target.closest('[data-name="See How It Works"]') !== null;

    if (text.includes('Log In')) {
      navigate('/login');
    } else if (text.includes('Practice My Hearing') || text.includes('Start Your Preparation')) {
      getSection(2)?.scrollIntoView({ behavior: 'smooth' });   // Section2 = Status Selection
    } else if (isSeeHowItWorks) {
      // Changed to getSection(0) because "Most people lose" is the 1st section
      getSection(0)?.scrollIntoView({ behavior: 'smooth' });   
    } else if (text.includes('Officially Filed')) {
      void handleStatusClick('filed');
    } else if (text.includes('Submitted') || text.includes('Pending')) {
      void handleStatusClick('pending');
    }
  };
  
  //   const text = (target.closest('[data-name="Button"]') ?? target).textContent ?? '';

  //   if (text.includes('Log In'))
  //     navigate('/login');
  //   else if (text.includes('Practice My Hearing') || text.includes('Start Your Preparation'))
  //     getSection(2)?.scrollIntoView({ behavior: 'smooth' });   // Section2 = Status Selection
  //   else if (text.includes('See How It Works'))
  //     getSection(1)?.scrollIntoView({ behavior: 'smooth' });   // Section = "Most people lose"
  //   else if (text.includes('Officially Filed'))
  //     handleStatusClick('filed');
  //   else if (text.includes('Submitted') || text.includes('Pending'))
  //     handleStatusClick('pending');
  // };

  const handleStatusClick = async (status: 'filed' | 'pending') => {
    if (isAuthenticated) {
      const fallbackTokensUsed = user?.tokensUsed;
      const fallbackTokenLimit = user?.tokenLimit;

      try {
        const me = await authService.getMe();
        if (hasReachedTokenLimit(me.tokens_used, me.token_limit)) {
          showTokenLimitReachedMessage();
          return;
        }
      } catch {
        if (hasReachedTokenLimit(fallbackTokensUsed, fallbackTokenLimit)) {
          showTokenLimitReachedMessage();
          return;
        }
      }

      navigate(`/intake?status=${status}`);
      return;
    }

    navigate('/login', { state: { from: `/intake?status=${status}` } });
  };

  return (
    <div ref={wrapperRef} onClick={handleClick}>
      <DesignAiCourtroomCoachLandingPage
        isAuthenticated={isAuthenticated}
        username={user?.username}
        userButton={isAuthenticated ? <UserProfileButton /> : undefined}
      />
    </div>
  );
}
