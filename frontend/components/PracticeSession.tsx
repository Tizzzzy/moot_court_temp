import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Mic,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface PracticeSessionProps {
  onComplete: () => void;
}

type SessionPhase = 'intro' | 'opening' | 'evidence' | 'questions' | 'closing' | 'feedback';

export function PracticeSession({ onComplete }: PracticeSessionProps) {
  const [currentPhase, setCurrentPhase] = useState<SessionPhase>('intro');
  const [isRecording, setIsRecording] = useState(false);
  const [completedPhases, setCompletedPhases] = useState<SessionPhase[]>([]);
  const [feedback, setFeedback] = useState<{
    pace: number;
    clarity: number;
    confidence: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  const phases = [
    { id: 'intro' as SessionPhase, title: 'Introduction', duration: '30s' },
    { id: 'opening' as SessionPhase, title: 'Opening Statement', duration: '2min' },
    { id: 'evidence' as SessionPhase, title: 'Present Evidence', duration: '5min' },
    { id: 'questions' as SessionPhase, title: 'Answer Questions', duration: '3min' },
    { id: 'closing' as SessionPhase, title: 'Closing Statement', duration: '2min' }
  ];

  const phaseInstructions = {
    intro: {
      judge: 'Case number 2025-SC-1234. Plaintiff, please state your name for the record.',
      yourTurn: 'Say your name clearly and state that you are the plaintiff/defendant.',
      example: '"Good morning, Your Honor. My name is [Your Name], and I am the plaintiff in this case."'
    },
    opening: {
      judge: 'Thank you. Please proceed with your opening statement.',
      yourTurn: 'Give your opening statement. Explain what happened in 1-2 minutes.',
      example: 'Use the opening statement template you prepared. Speak clearly and make eye contact.'
    },
    evidence: {
      judge: 'Please present your evidence to support your claim.',
      yourTurn: 'Present each piece of evidence and explain what it shows.',
      example: '"Your Honor, I\'d like to present this receipt which shows the payment I made on [date]..."'
    },
    questions: {
      judge: 'I have a few questions. When did you first become aware of this issue?',
      yourTurn: 'Answer the judge\'s questions directly and honestly.',
      example: 'Keep answers brief and to the point. It\'s okay to say "I don\'t remember exactly" if you don\'t.'
    },
    closing: {
      judge: 'Do you have any final statements?',
      yourTurn: 'Summarize your main points and state what you want the judge to decide.',
      example: 'Use your closing statement template. Keep it under 2 minutes.'
    }
  };

  const currentInstruction = currentPhase !== 'feedback' ? phaseInstructions[currentPhase] : null;
  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);
  const progress = currentPhase === 'feedback' ? 100 : ((currentPhaseIndex + 1) / phases.length) * 100;

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Generate mock feedback
    setTimeout(() => {
      setFeedback({
        pace: 85,
        clarity: 90,
        confidence: 78,
        strengths: [
          'Clear and articulate speech',
          'Good organization of main points',
          'Appropriate tone and respect'
        ],
        improvements: [
          'Try to speak a bit slower when presenting evidence',
          'Make more eye contact (don\'t read from notes)',
          'Pause briefly between major points'
        ]
      });
    }, 1500);
  };

  const handleNextPhase = () => {
    setCompletedPhases([...completedPhases, currentPhase]);
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1].id);
      setFeedback(null);
    } else {
      setCurrentPhase('feedback');
    }
  };

  const handleRestart = () => {
    setCurrentPhase('intro');
    setCompletedPhases([]);
    setFeedback(null);
    setIsRecording(false);
  };

  if (currentPhase === 'feedback') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl mb-2">Practice Session Complete! 🎉</h2>
            <p className="text-gray-600">
              Great job working through the entire court process. Here's your performance summary:
            </p>
          </div>

          {feedback && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-blue-50">
                  <p className="text-sm text-gray-600 mb-2">Speaking Pace</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl">{feedback.pace}</p>
                    <p className="text-sm text-gray-600 mb-1">/100</p>
                  </div>
                  <Progress value={feedback.pace} className="mt-2" />
                </Card>
                <Card className="p-4 bg-green-50">
                  <p className="text-sm text-gray-600 mb-2">Clarity</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl">{feedback.clarity}</p>
                    <p className="text-sm text-gray-600 mb-1">/100</p>
                  </div>
                  <Progress value={feedback.clarity} className="mt-2" />
                </Card>
                <Card className="p-4 bg-purple-50">
                  <p className="text-sm text-gray-600 mb-2">Confidence</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl">{feedback.confidence}</p>
                    <p className="text-sm text-gray-600 mb-1">/100</p>
                  </div>
                  <Progress value={feedback.confidence} className="mt-2" />
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg">What You Did Well</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-6 bg-orange-50 border-orange-200">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg">Areas to Improve</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-orange-600 mt-0.5">→</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
          <Button onClick={onComplete} size="lg">
            Continue to Final Preparation →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-2">Practice Session</h2>
            <p className="text-gray-600">
              Practice in a safe environment - make mistakes here, not in court!
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            Phase {currentPhaseIndex + 1} of {phases.length}
          </Badge>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={`p-3 rounded-lg text-center ${
                completedPhases.includes(phase.id)
                  ? 'bg-green-100 border-green-300 border'
                  : phase.id === currentPhase
                  ? 'bg-blue-100 border-blue-300 border'
                  : 'bg-gray-100 border-gray-200 border'
              }`}
            >
              <p className="text-xs mb-1">{phase.title}</p>
              <p className="text-xs text-gray-600">{phase.duration}</p>
            </div>
          ))}
        </div>
      </Card>

      {currentInstruction && (
        <>
          <Card className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-lg">
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300 mb-2">THE JUDGE SAYS:</p>
                <p className="text-lg italic">"{currentInstruction.judge}"</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg mb-2">Your Turn:</h3>
                <p className="text-gray-700 mb-3">{currentInstruction.yourTurn}</p>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm"><strong>Example:</strong> {currentInstruction.example}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-col items-center gap-4">
                {!isRecording && !feedback ? (
                  <>
                    <Button 
                      size="lg" 
                      onClick={handleStartRecording}
                      className="w-full md:w-auto"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Speaking
                    </Button>
                    <p className="text-sm text-gray-600">Click when you're ready to practice this section</p>
                  </>
                ) : isRecording ? (
                  <>
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-lg">Recording... Speak now</p>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={handleStopRecording}
                      className="w-full md:w-auto"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Stop & Get Feedback
                    </Button>
                  </>
                ) : feedback ? (
                  <>
                    <div className="w-full space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm mb-2"><strong>Quick Feedback:</strong></p>
                        <p className="text-sm text-gray-700">
                          {feedback.pace > 80 ? '✓ Good speaking pace' : '⚠ Try speaking a bit slower'}
                        </p>
                        <p className="text-sm text-gray-700">
                          {feedback.clarity > 85 ? '✓ Very clear speech' : '⚠ Focus on clearer pronunciation'}
                        </p>
                      </div>
                      <Button 
                        size="lg" 
                        onClick={handleNextPhase}
                        className="w-full"
                      >
                        Continue to Next Phase →
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        </>
      )}

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg mb-2">💡 Practice Tips</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Practice in a quiet room where you can speak out loud</li>
          <li>Stand up while practicing - you'll stand in court too</li>
          <li>Imagine the judge sitting across from you</li>
          <li>Don't worry about being perfect - this is practice!</li>
        </ul>
      </Card>
    </div>
  );
}
