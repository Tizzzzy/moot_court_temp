import { Card } from './ui/card';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { BookOpen, Video, FileText, CheckCircle } from 'lucide-react';

interface EducationalModuleProps {
  onComplete: () => void;
}

export function EducationalModule({ onComplete }: EducationalModuleProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl mb-2">Understanding Small Claims Court</h2>
            <p className="text-gray-600">
              Small claims court is designed to be simple and accessible. You don't need a lawyer, 
              and the process is informal compared to other courts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm mb-1">✓ No lawyer needed</p>
            <p className="text-xs text-gray-600">Represent yourself with confidence</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm mb-1">✓ Informal setting</p>
            <p className="text-xs text-gray-600">More relaxed than regular court</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm mb-1">✓ Quick resolution</p>
            <p className="text-xs text-gray-600">Usually resolved in one hearing</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl mb-4">What to Expect: Step by Step</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                <span>Before the Hearing</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-8 space-y-3">
                <p className="text-gray-700">
                  You've already filed your claim, which is great! Now you need to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Organize all your evidence (receipts, photos, contracts, emails)</li>
                  <li>Make copies of everything (3 sets: you, judge, other party)</li>
                  <li>Write down the key points you want to make</li>
                  <li>Practice what you'll say</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                <span>Arriving at Court</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-8 space-y-3">
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Arrive 30 minutes early to find the courtroom and parking</li>
                  <li>Dress professionally (business casual is fine)</li>
                  <li>Turn off your cell phone</li>
                  <li>Check in with the clerk when you arrive</li>
                  <li>Wait for your case to be called</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm">💡 <strong>Tip:</strong> Bring a water bottle and something to read - there may be a wait.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
                <span>In the Courtroom</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-8 space-y-3">
                <p className="text-gray-700">The typical order of events:</p>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  <li><strong>Judge introduces the case</strong> - The judge will say the case name and ask both parties to identify themselves</li>
                  <li><strong>You present your side</strong> - Explain what happened, show your evidence (usually 10-15 minutes)</li>
                  <li><strong>Other party presents</strong> - They'll give their version of events</li>
                  <li><strong>Questions</strong> - Judge may ask questions to both sides</li>
                  <li><strong>Your response</strong> - Brief chance to respond to what they said</li>
                  <li><strong>Decision</strong> - Judge may decide immediately or mail a decision later</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">4</span>
                <span>Court Etiquette</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-8 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm mb-2 text-green-700">✓ DO:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Address the judge as "Your Honor"</li>
                      <li>Stand when speaking</li>
                      <li>Speak clearly and calmly</li>
                      <li>Be respectful to everyone</li>
                      <li>Answer questions directly</li>
                      <li>Stick to the facts</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm mb-2 text-red-700">✗ DON'T:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>Interrupt anyone</li>
                      <li>Argue with the other party</li>
                      <li>Get emotional or angry</li>
                      <li>Ramble or go off-topic</li>
                      <li>Use slang or profanity</li>
                      <li>Bring up irrelevant information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg mb-2">Watch: A Day in Small Claims Court</h3>
            <p className="text-sm text-gray-700 mb-4">
              See a real courtroom walkthrough to familiarize yourself with the environment
            </p>
            <Button variant="outline" className="border-blue-600 text-blue-600">
              <Video className="w-4 h-4 mr-2" />
              Watch Video (5 min)
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onComplete} size="lg">
          <CheckCircle className="w-4 h-4 mr-2" />
          I Understand - Continue
        </Button>
      </div>
    </div>
  );
}
