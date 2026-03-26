import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  MessageSquare, 
  BookOpen, 
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Case } from './CaseCard';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MootCourtRoomProps {
  case_: Case;
  onExit: () => void;
}

interface Argument {
  id: string;
  content: string;
  timestamp: string;
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

export function MootCourtRoom({ case_, onExit }: MootCourtRoomProps) {
  const [currentArgument, setCurrentArgument] = useState('');
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const caseDocuments = [
    { id: '1', name: 'Case Brief', type: 'PDF', pages: 12 },
    { id: '2', name: 'Evidence Summary', type: 'PDF', pages: 8 },
    { id: '3', name: 'Precedent Cases', type: 'PDF', pages: 24 },
    { id: '4', name: 'Witness Statements', type: 'PDF', pages: 15 }
  ];

  const handleSubmitArgument = () => {
    if (!currentArgument.trim()) return;

    setIsSubmitting(true);
    
    // Simulate AI judge feedback
    setTimeout(() => {
      const newArgument: Argument = {
        id: Date.now().toString(),
        content: currentArgument,
        timestamp: new Date().toLocaleTimeString(),
        feedback: {
          score: Math.floor(Math.random() * 30) + 70, // 70-100
          strengths: [
            'Strong legal reasoning',
            'Clear articulation of facts',
            'Effective use of precedent'
          ],
          improvements: [
            'Consider addressing counter-arguments',
            'Strengthen the constitutional basis'
          ]
        }
      };

      setArguments([...arguments_, newArgument]);
      setCurrentArgument('');
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onExit}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl mb-2">{case_.title}</h1>
            <p className="text-gray-600">{case_.type}</p>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            Session Active
          </Badge>
        </div>
      </div>

      {/* Court Room Banner */}
      <Card className="mb-6 overflow-hidden">
        <div className="relative h-48">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1758541213979-fe8c9996e197?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VydHJvb20lMjBnYXZlbHxlbnwxfHx8fDE3NjE2OTA4NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Courtroom"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30 flex items-center px-8">
            <div className="text-white">
              <p className="text-sm mb-1">Virtual Moot Court Session</p>
              <p className="text-2xl">Practice makes perfect</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Court Area */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="arguments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="arguments">
                <MessageSquare className="w-4 h-4 mr-2" />
                Arguments
              </TabsTrigger>
              <TabsTrigger value="case-details">
                <FileText className="w-4 h-4 mr-2" />
                Case Details
              </TabsTrigger>
              <TabsTrigger value="resources">
                <BookOpen className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="arguments" className="mt-4">
              <Card className="p-6">
                <h3 className="text-xl mb-4">Present Your Argument</h3>
                
                {/* Previous Arguments */}
                {arguments_.length > 0 && (
                  <div className="mb-6 space-y-4">
                    <h4 className="text-sm text-gray-600">Previous Arguments</h4>
                    {arguments_.map((arg) => (
                      <Card key={arg.id} className="p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm text-gray-500">{arg.timestamp}</p>
                          {arg.feedback && (
                            <Badge className="bg-green-100 text-green-800">
                              Score: {arg.feedback.score}/100
                            </Badge>
                          )}
                        </div>
                        <p className="mb-3">{arg.content}</p>
                        {arg.feedback && (
                          <div className="border-t pt-3 mt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm mb-2 flex items-center text-green-700">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Strengths
                                </p>
                                <ul className="text-sm space-y-1">
                                  {arg.feedback.strengths.map((s, i) => (
                                    <li key={i} className="text-gray-700">• {s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-sm mb-2 flex items-center text-orange-700">
                                  <AlertCircle className="w-4 h-4 mr-1" />
                                  Areas for Improvement
                                </p>
                                <ul className="text-sm space-y-1">
                                  {arg.feedback.improvements.map((imp, i) => (
                                    <li key={i} className="text-gray-700">• {imp}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}

                {/* New Argument Input */}
                <div>
                  <Textarea
                    placeholder="Type your legal argument here. Be clear, concise, and cite relevant laws and precedents..."
                    value={currentArgument}
                    onChange={(e) => setCurrentArgument(e.target.value)}
                    className="min-h-[200px] mb-4"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {currentArgument.length} characters
                    </p>
                    <Button 
                      onClick={handleSubmitArgument}
                      disabled={isSubmitting || !currentArgument.trim()}
                    >
                      {isSubmitting ? (
                        'Evaluating...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Argument
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="case-details" className="mt-4">
              <Card className="p-6">
                <h3 className="text-xl mb-4">Case Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Case Type</p>
                    <p>{case_.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p>{case_.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Key Issues</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Interpretation of constitutional rights</li>
                      <li>Application of precedent law</li>
                      <li>Burden of proof considerations</li>
                      <li>Procedural compliance</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Applicable Laws</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Constitutional Law</Badge>
                      <Badge variant="outline">Civil Procedure</Badge>
                      <Badge variant="outline">Evidence Law</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="mt-4">
              <Card className="p-6">
                <h3 className="text-xl mb-4">Legal Resources</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="mb-1">Legal Research Database</h4>
                    <p className="text-sm text-gray-600">
                      Access to case law and legal precedents
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="mb-1">Argument Templates</h4>
                    <p className="text-sm text-gray-600">
                      Structured frameworks for legal arguments
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="mb-1">Citation Guide</h4>
                    <p className="text-sm text-gray-600">
                      Proper legal citation formats and examples
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h4 className="mb-1">Practice Tips</h4>
                    <p className="text-sm text-gray-600">
                      Strategies for effective moot court performance
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Case Documents */}
          <Card className="p-6">
            <h3 className="text-xl mb-4">Case Documents</h3>
            <div className="space-y-2">
              {caseDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.pages} pages</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doc.type}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Session Progress */}
          <Card className="p-6">
            <h3 className="text-xl mb-4">Session Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Arguments Presented</span>
                  <span>{arguments_.length}/5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(arguments_.length / 5) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Average Score</p>
                <p className="text-2xl">
                  {arguments_.length > 0 
                    ? Math.round(arguments_.reduce((acc, arg) => 
                        acc + (arg.feedback?.score || 0), 0) / arguments_.length)
                    : '--'
                  }/100
                </p>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-xl mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-gray-700">
              Structure your arguments with clear points: Issue, Rule, Application, and Conclusion (IRAC method).
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
