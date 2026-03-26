import { Scale, Users, Trophy, Clock } from 'lucide-react';
import { Card } from './ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl mb-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function DashboardStats() {
  const stats = [
    {
      title: 'Active Cases',
      value: 5,
      icon: <Scale className="w-6 h-6 text-blue-600" />,
      trend: '+2 this week',
      color: 'bg-blue-100'
    },
    {
      title: 'Practice Hours',
      value: '24.5',
      icon: <Clock className="w-6 h-6 text-purple-600" />,
      trend: '+5.2 hours',
      color: 'bg-purple-100'
    },
    {
      title: 'Sessions Completed',
      value: 12,
      icon: <Users className="w-6 h-6 text-orange-600" />,
      trend: '75% success rate',
      color: 'bg-orange-100'
    },
    {
      title: 'Achievements',
      value: 8,
      icon: <Trophy className="w-6 h-6 text-yellow-600" />,
      trend: '3 new badges',
      color: 'bg-yellow-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
