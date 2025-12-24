import { Outlet, Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { ToastContainer } from './Toast';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🃏</span>
              <h1 className="text-xl font-semibold">Planning Poker</h1>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Planning Poker - Sprint Estimation Tool
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}

