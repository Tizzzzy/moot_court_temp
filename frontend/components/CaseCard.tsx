import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, FileText } from 'lucide-react';

export interface Case {
  id: string;
  title: string;
  type: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scheduledDate: string;
  duration: string;
  description: string;
  documentsCount: number;
}

interface CaseCardProps {
  case_: Case;
  onEnterCourt: (caseId: string) => void;
}

export function CaseCard({ case_, onEnterCourt }: CaseCardProps) {
  const statusColors = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-orange-100 text-orange-800',
    'completed': 'bg-green-100 text-green-800'
  };

  const difficultyColors = {
    'beginner': 'bg-gray-100 text-gray-800',
    'intermediate': 'bg-yellow-100 text-yellow-800',
    'advanced': 'bg-red-100 text-red-800'
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl mb-2">{case_.title}</h3>
          <p className="text-sm text-gray-600">{case_.type}</p>
        </div>
        <Badge className={statusColors[case_.status]}>
          {case_.status.replace('-', ' ')}
        </Badge>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">{case_.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{case_.scheduledDate}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{case_.duration}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FileText className="w-4 h-4 mr-2" />
          <span>{case_.documentsCount} documents</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge className={difficultyColors[case_.difficulty]}>
          {case_.difficulty}
        </Badge>
        <Button 
          onClick={() => onEnterCourt(case_.id)}
          disabled={case_.status === 'completed'}
        >
          {case_.status === 'completed' ? 'Review' : 'Enter Court'}
        </Button>
      </div>
    </Card>
  );
}
