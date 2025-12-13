import { useRef, useState } from 'react';
import { Button } from './ui';

interface CsvUploadProps {
  onUpload: (titles: string[]) => void;
  disabled?: boolean;
}

export function CsvUpload({ onUpload, disabled }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setError('File is empty');
        return;
      }

      // Parse CSV - split by newlines and filter empty lines
      const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        setError('No tasks found in file');
        return;
      }

      // Check if first line looks like a header
      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine === 'title' || firstLine === 'task' || firstLine === 'name';
      
      const titles = hasHeader ? lines.slice(1) : lines;

      if (titles.length === 0) {
        setError('No tasks found in file');
        return;
      }

      onUpload(titles);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={disabled}
      >
        📄 Upload CSV
      </Button>
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}


