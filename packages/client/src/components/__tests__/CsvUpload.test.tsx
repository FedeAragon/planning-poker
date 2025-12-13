import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CsvUpload } from '../CsvUpload';

describe('CsvUpload', () => {
  it('renders upload button', () => {
    render(<CsvUpload onUpload={() => {}} />);
    expect(screen.getByText('📄 Upload CSV')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<CsvUpload onUpload={() => {}} disabled />);
    expect(screen.getByText('📄 Upload CSV')).toBeDisabled();
  });

  it('shows error for non-CSV files', () => {
    render(<CsvUpload onUpload={() => {}} />);
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    
    expect(screen.getByText('Please upload a CSV file')).toBeInTheDocument();
  });

  it('parses CSV and calls onUpload with titles', async () => {
    const onUpload = vi.fn();
    render(<CsvUpload onUpload={onUpload} />);
    
    const csvContent = 'Task 1\nTask 2\nTask 3';
    const file = new File([csvContent], 'tasks.csv', { type: 'text/csv' });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    
    // Mock FileReader
    const originalFileReader = global.FileReader;
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as any,
      result: csvContent,
    };
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    fireEvent.change(input);
    
    // Trigger onload
    mockFileReader.onload?.({ target: { result: csvContent } });
    
    expect(onUpload).toHaveBeenCalledWith(['Task 1', 'Task 2', 'Task 3']);
    
    global.FileReader = originalFileReader;
  });

  it('skips header row if detected', async () => {
    const onUpload = vi.fn();
    render(<CsvUpload onUpload={onUpload} />);
    
    const csvContent = 'title\nTask 1\nTask 2';
    const file = new File([csvContent], 'tasks.csv', { type: 'text/csv' });
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    
    const originalFileReader = global.FileReader;
    const mockFileReader = {
      readAsText: vi.fn(),
      onload: null as any,
      result: csvContent,
    };
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    fireEvent.change(input);
    mockFileReader.onload?.({ target: { result: csvContent } });
    
    expect(onUpload).toHaveBeenCalledWith(['Task 1', 'Task 2']);
    
    global.FileReader = originalFileReader;
  });
});


