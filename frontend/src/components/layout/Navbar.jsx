import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <img src="/logo.svg" alt="AskPDF AI Logo" className="h-9 w-9 group-hover:scale-105 transition-transform" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              AskPDF <span className="text-blue-600">AI</span>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isActive('/dashboard') || isActive('/')
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
