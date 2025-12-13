interface VoteButtonProps {
  value: number;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function VoteButton({ value, selected, disabled, onClick }: VoteButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-14 h-14 rounded-xl text-xl font-bold transition-all duration-200
        border-2 
        ${selected 
          ? 'bg-primary-600 border-primary-600 text-white scale-110 shadow-lg' 
          : 'border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white hover:scale-105'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
      `}
    >
      {value}
    </button>
  );
}


