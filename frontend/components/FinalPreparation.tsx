import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  FileText, 
  Briefcase, 
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  category: 'documents' | 'items' | 'preparation';
}

export function FinalPreparation() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const checklistItems: ChecklistItem[] = [
    // Documents
    { id: '1', label: 'All original documents', category: 'documents' },
    { id: '2', label: '3 copies of each document (you, judge, other party)', category: 'documents' },
    { id: '3', label: 'Case filing papers/claim number', category: 'documents' },
    { id: '4', label: 'Evidence organized in order', category: 'documents' },
    { id: '5', label: 'Photo ID (driver\'s license or passport)', category: 'documents' },
    { id: '6', label: 'Written notes with key points', category: 'documents' },
    
    // Items to Bring
    { id: '7', label: 'Pen and notepad', category: 'items' },
    { id: '8', label: 'Calculator (if dealing with numbers)', category: 'items' },
    { id: '9', label: 'Water bottle', category: 'items' },
    { id: '10', label: 'Folder or binder for organization', category: 'items' },
    { id: '11', label: 'Phone (turned OFF before entering)', category: 'items' },
    { id: '12', label: 'Parking money/change', category: 'items' },
    
    // Preparation
    { id: '13', label: 'Reviewed all my documents', category: 'preparation' },
    { id: '14', label: 'Practiced my opening statement', category: 'preparation' },
    { id: '15', label: 'Know exactly what I\'m asking for', category: 'preparation' },
    { id: '16', label: 'Planned my route and parking', category: 'preparation' },
    { id: '17', label: 'Outfit chosen (professional attire)', category: 'preparation' },
    { id: '18', label: 'Good night\'s sleep planned', category: 'preparation' }
  ];

  const handleToggle = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const documentItems = checklistItems.filter(item => item.category === 'documents');
  const itemsToNote = checklistItems.filter(item => item.category === 'items');
  const preparationItems = checklistItems.filter(item => item.category === 'preparation');

  const documentProgress = (documentItems.filter(item => checkedItems.has(item.id)).length / documentItems.length) * 100;
  const itemsProgress = (itemsToNote.filter(item => checkedItems.has(item.id)).length / itemsToNote.length) * 100;
  const preparationProgress = (preparationItems.filter(item => checkedItems.has(item.id)).length / preparationItems.length) * 100;
  const totalProgress = (checkedItems.size / checklistItems.length) * 100;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl mb-2">Final Preparation Checklist</h2>
            <p className="text-gray-600">
              Make sure you have everything ready for your court date. Check off each item as you complete it.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl mb-1">{Math.round(totalProgress)}%</p>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>

        {totalProgress === 100 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <strong>You're all set! You're ready for your court date.</strong>
            </p>
          </div>
        )}
      </Card>

      {/* Documents Checklist */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl">Documents to Bring</h3>
          </div>
          <Badge className={documentProgress === 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {documentItems.filter(item => checkedItems.has(item.id)).length}/{documentItems.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {documentItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Checkbox
                id={item.id}
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <label
                htmlFor={item.id}
                className={`flex-1 cursor-pointer ${
                  checkedItems.has(item.id) ? 'line-through text-gray-500' : ''
                }`}
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Items to Bring */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <h3 className="text-xl">Items to Bring</h3>
          </div>
          <Badge className={itemsProgress === 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {itemsToNote.filter(item => checkedItems.has(item.id)).length}/{itemsToNote.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {itemsToNote.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Checkbox
                id={item.id}
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <label
                htmlFor={item.id}
                className={`flex-1 cursor-pointer ${
                  checkedItems.has(item.id) ? 'line-through text-gray-500' : ''
                }`}
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Preparation Tasks */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl">Preparation Tasks</h3>
          </div>
          <Badge className={preparationProgress === 100 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {preparationItems.filter(item => checkedItems.has(item.id)).length}/{preparationItems.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {preparationItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Checkbox
                id={item.id}
                checked={checkedItems.has(item.id)}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <label
                htmlFor={item.id}
                className={`flex-1 cursor-pointer ${
                  checkedItems.has(item.id) ? 'line-through text-gray-500' : ''
                }`}
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Day-Of Timeline */}
      <Card className="p-6">
        <h3 className="text-xl mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Day-Of Timeline
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-24 text-sm text-gray-600">Night Before</div>
            <div className="flex-1">
              <p className="mb-2">Get everything ready:</p>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                <li>Lay out professional clothes</li>
                <li>Pack all documents in a folder</li>
                <li>Set 2 alarms</li>
                <li>Get a good night's sleep</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-24 text-sm text-gray-600">Morning Of</div>
            <div className="flex-1">
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                <li>Eat a good breakfast</li>
                <li>Dress professionally</li>
                <li>Review your key points (don't cram!)</li>
                <li>Leave extra early for traffic/parking</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-24 text-sm text-gray-600">30 Min Before</div>
            <div className="flex-1">
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                <li>Arrive at courthouse</li>
                <li>Find your courtroom</li>
                <li>Use the restroom</li>
                <li>Turn off your phone</li>
                <li>Check in with the clerk</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-24 text-sm text-gray-600">While Waiting</div>
            <div className="flex-1">
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                <li>Review your notes quietly</li>
                <li>Take deep breaths to stay calm</li>
                <li>Observe other cases if possible</li>
                <li>Stay professional - don't talk to the other party</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Important Reminders */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="text-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Last-Minute Reminders
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="mb-2"><strong>What to Wear:</strong></p>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
              <li>Business casual or better</li>
              <li>Clean, pressed clothing</li>
              <li>Conservative colors</li>
              <li>Avoid: jeans, shorts, t-shirts, flip-flops</li>
            </ul>
          </div>
          <div>
            <p className="mb-2"><strong>Court Etiquette:</strong></p>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
              <li>Address judge as "Your Honor"</li>
              <li>Stand when speaking</li>
              <li>No gum, food, or drinks</li>
              <li>Be respectful to everyone</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="p-6">
        <h3 className="text-xl mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Important Contact Information
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="mb-1"><strong>Courthouse Location</strong></p>
                <p className="text-sm text-gray-700">123 Main Street, Courtroom 4B</p>
                <p className="text-sm text-gray-700">Your City, State 12345</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="mb-1"><strong>Court Clerk</strong></p>
                <p className="text-sm text-gray-700">(555) 123-4567</p>
                <p className="text-xs text-gray-600">Call if you need to verify your hearing time</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <p className="mb-1"><strong>Your Hearing</strong></p>
                <p className="text-sm text-gray-700">November 15, 2025 at 9:00 AM</p>
                <p className="text-xs text-gray-600">Case #2025-SC-1234</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Final Encouragement */}
      <Card className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <h3 className="text-2xl mb-3">You've Got This! 💪</h3>
        <p className="mb-4">
          You've put in the work to prepare. You understand the process, you've practiced what to say, 
          and you're organized. Remember:
        </p>
        <ul className="space-y-2 mb-6">
          <li>✓ The judge is there to listen fairly</li>
          <li>✓ You have the right to present your case</li>
          <li>✓ It's okay to be nervous - that's completely normal</li>
          <li>✓ Just tell the truth and speak from your experience</li>
        </ul>
        <p className="text-blue-100">
          Take a deep breath. You're ready for this.
        </p>
      </Card>

      <div className="flex justify-center">
        <Button 
          size="lg" 
          variant="outline"
          onClick={() => window.print()}
        >
          Print This Checklist
        </Button>
      </div>
    </div>
  );
}
