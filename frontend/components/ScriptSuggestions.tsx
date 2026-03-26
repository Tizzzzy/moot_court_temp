import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { MessageSquare, Copy, Edit, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ScriptSuggestionsProps {
  caseType: string;
  onSaveScript: (script: string) => void;
}

export function ScriptSuggestions({ caseType, onSaveScript }: ScriptSuggestionsProps) {
  const [customOpening, setCustomOpening] = useState('');
  const [customEvidence, setCustomEvidence] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const openingStatement = `Good morning/afternoon, Your Honor. My name is [Your Name], and I am the plaintiff/defendant in this case. 

I am here today because [briefly state what happened - 1-2 sentences]. 

I have documentation and evidence to support my claim, which I would like to present to the court.

Thank you for hearing my case today.`;

  const presentingEvidence = `Your Honor, I'd like to present [name of document/photo] as evidence. 

This [document/photo/receipt] shows [what it proves]. I have made copies for you and for the other party.

As you can see here, [point out specific detail], which supports my position that [your main point].`;

  const respondingToOther = `Your Honor, I'd like to respectfully respond to what was just said.

[They said X], but the facts show [your counter-point with evidence].

My evidence clearly demonstrates [your position], and I ask the court to consider [what you want].`;

  const closingStatement = `Your Honor, in summary:

1. [First main point]
2. [Second main point]  
3. [Third main point]

The evidence I've presented today clearly shows [your conclusion]. 

I respectfully ask the court to rule in my favor for [specific amount/action you want].

Thank you for your time and consideration.`;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl mb-2">What to Say in Court</h2>
            <p className="text-gray-600">
              Use these templates and adapt them to your specific case. The key is to be clear, 
              concise, and stick to the facts.
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm">
            <strong>Remember:</strong> You don't need to memorize these word-for-word. The judge wants 
            to hear your story in your own words. These are just guides to help structure your thoughts.
          </p>
        </div>
      </Card>

      <Tabs defaultValue="opening" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opening">Opening</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="responding">Responding</TabsTrigger>
          <TabsTrigger value="closing">Closing</TabsTrigger>
        </TabsList>

        <TabsContent value="opening" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Opening Statement Template</h3>
              <Badge className="bg-blue-100 text-blue-800">
                Say this FIRST
              </Badge>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm">{openingStatement}</pre>
            </div>

            <div className="flex gap-2 mb-6">
              <Button 
                variant="outline" 
                onClick={() => handleCopy(openingStatement)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Template
              </Button>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg mb-3 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Customize Your Opening
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Fill in the blanks and make it your own:
              </p>
              <Textarea
                placeholder="Write your customized opening statement here..."
                value={customOpening}
                onChange={(e) => setCustomOpening(e.target.value)}
                className="min-h-[200px] mb-3"
              />
              <Button onClick={() => onSaveScript(customOpening)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save My Opening
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm mb-2"><strong>Pro Tips:</strong></p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Keep it under 2 minutes</li>
                <li>Make eye contact with the judge</li>
                <li>Speak slowly and clearly</li>
                <li>Don't read from a paper - use notes if needed</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Presenting Evidence Template</h3>
              <Badge className="bg-green-100 text-green-800">
                During your turn
              </Badge>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm">{presentingEvidence}</pre>
            </div>

            <div className="flex gap-2 mb-6">
              <Button 
                variant="outline" 
                onClick={() => handleCopy(presentingEvidence)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Template
              </Button>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg mb-3">Customize for Your Evidence</h4>
              <Textarea
                placeholder="Write how you'll present your evidence..."
                value={customEvidence}
                onChange={(e) => setCustomEvidence(e.target.value)}
                className="min-h-[200px] mb-3"
              />
              <Button onClick={() => onSaveScript(customEvidence)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save My Evidence Script
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm mb-2"><strong>Good Evidence Includes:</strong></p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Receipts and invoices</li>
                  <li>Photos with dates</li>
                  <li>Contracts or agreements</li>
                  <li>Text messages or emails</li>
                  <li>Witness statements (written)</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm mb-2"><strong>When Presenting:</strong></p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Organize documents in order</li>
                  <li>Label everything clearly</li>
                  <li>Hand copies to the judge</li>
                  <li>Explain what each item shows</li>
                  <li>Point out specific details</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="responding" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Responding to the Other Party</h3>
              <Badge className="bg-orange-100 text-orange-800">
                After they speak
              </Badge>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm">{respondingToOther}</pre>
            </div>

            <Button 
              variant="outline" 
              onClick={() => handleCopy(respondingToOther)}
              className="mb-6"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Template
            </Button>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm mb-2"><strong>Important Reminders:</strong></p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Stay calm, even if they say something untrue</li>
                <li>Don't argue directly with them - speak to the judge</li>
                <li>Only respond to major points, not every detail</li>
                <li>Keep it brief - this isn't a debate</li>
                <li>Always remain respectful</li>
              </ul>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="closing" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Closing Statement Template</h3>
              <Badge className="bg-purple-100 text-purple-800">
                Say this LAST
              </Badge>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <pre className="whitespace-pre-wrap text-sm">{closingStatement}</pre>
            </div>

            <Button 
              variant="outline" 
              onClick={() => handleCopy(closingStatement)}
              className="mb-6"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Template
            </Button>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm mb-2"><strong>Closing Checklist:</strong></p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>✓ Summarize your 2-3 strongest points</li>
                <li>✓ Reference the evidence you showed</li>
                <li>✓ Clearly state what you want the judge to decide</li>
                <li>✓ Thank the judge for their time</li>
                <li>✓ Keep it under 2 minutes</li>
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 bg-purple-50 border-purple-200">
        <h3 className="text-lg mb-3">Ready to Practice?</h3>
        <p className="text-sm text-gray-700 mb-4">
          Now that you have your scripts, the next step is to practice saying them out loud. 
          Our practice session will help you rehearse in a realistic courtroom simulation.
        </p>
        <Button>
          Continue to Practice Session →
        </Button>
      </Card>
    </div>
  );
}
