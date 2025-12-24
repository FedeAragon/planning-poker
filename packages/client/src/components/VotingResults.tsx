import type { Vote } from '@planning-poker/shared';
import { VOTE_VALUES } from '@planning-poker/shared';

interface VotingResultsProps {
  votes: Vote[];
  percentages: Record<number, number>;
  finalEstimate: number;
}

export function VotingResults({ votes, percentages, finalEstimate }: VotingResultsProps) {
  const votesWithPercentage = VOTE_VALUES
    .map(value => ({
      value,
      percentage: percentages[value] || 0,
      count: votes.filter(v => v.value === value).length,
    }))
    .filter(v => v.percentage > 0);

  return (
    <div className="space-y-4">
      {/* Vote distribution */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">Distribution</h4>
        {votesWithPercentage.map(({ value, percentage, count }) => (
          <div key={value} className="flex items-center gap-3">
            <span className={`
              w-8 h-8 flex items-center justify-center rounded font-bold text-sm
              ${value === finalEstimate 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700'
              }
            `}>
              {value}
            </span>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    value === finalEstimate ? 'bg-primary-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
              {percentage}% ({count})
            </span>
          </div>
        ))}
      </div>

      {/* Final estimate */}
      <div className="flex items-center justify-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Final Estimate:</span>
        <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{finalEstimate}</span>
      </div>
    </div>
  );
}


