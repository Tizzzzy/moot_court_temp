import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  estimatedTime?: string;
}

const steps: Step[] = [
  {
    id: '1',
    title: 'Understanding the Process',
    description: 'Learn what happens in small claims court',
    status: 'completed',
    estimatedTime: '15 min'
  },
  {
    id: '2',
    title: 'Review Your Case',
    description: 'Go through your documents and facts',
    status: 'completed',
    estimatedTime: '20 min'
  },
  {
    id: '3',
    title: 'Prepare What to Say',
    description: 'Learn effective statements and responses',
    status: 'current',
    estimatedTime: '30 min'
  },
  {
    id: '4',
    title: 'Practice Your Presentation',
    description: 'Rehearse in a safe environment',
    status: 'upcoming',
    estimatedTime: '45 min'
  },
  {
    id: '5',
    title: 'Final Preparation',
    description: 'Checklist and day-of guidelines',
    status: 'upcoming',
    estimatedTime: '15 min'
  }
];

export function ProcessTimeline() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl mb-6">Your Preparation Journey</h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.status === 'completed' 
                  ? 'bg-green-100' 
                  : step.status === 'current'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : step.status === 'current' ? (
                  <Clock className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-12 ${
                  step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-lg">{step.title}</h3>
                {step.status === 'current' && (
                  <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{step.description}</p>
              {step.estimatedTime && (
                <p className="text-xs text-gray-500">⏱️ About {step.estimatedTime}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
