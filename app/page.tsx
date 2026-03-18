'use client';
import { useState, useEffect } from 'react';
import { Home, FileText, Menu, X, Package, LogOut } from 'lucide-react';

// Removed AdminDashboard import since we don't need it anymore
import AssetManagement from "@/components/AssetManagement";
import FinancialRecordsEnhanced from '@/components/FinancialRecordsEnhanced';
import Login from '@/components/Login';
import ChurchImage from "@/components/Image";

export default function HomePage() {
  const [activeScreen, setActiveScreen] = useState('records');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // This keeps the user logged in across page refreshes
    // And even if the user closes the browser yet the session is still valid
    // And the user can log in again without having to re-enter their credentials
    // const savedAuth = localStorage.getItem('isAuthenticated') === 'true';
    // const savedEmail = localStorage.getItem('userEmail') || '';

    // This keeps the user logged in across page refreshes
    // And user closes the browser they are logged out
    // And they must login again.
    const savedAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    const savedEmail = sessionStorage.getItem('userEmail') || '';
    
    setIsAuthenticated(savedAuth);
    setUserEmail(savedEmail);
    setMounted(true);
  }, []);

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    // localStorage.setItem('isAuthenticated', 'true');
    // localStorage.setItem('userEmail', email);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userEmail', email);
    // Ensure we start on records after a fresh login
    setActiveScreen('records'); 
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setIsAuthenticated(false);
      setUserEmail('');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
    }
  };

  if (!mounted) return null;

  // Login Compulsory Guard
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. CHANGE: Menu only needs these two items now
  const menuItems = [
    { id: 'records', label: 'Financial Records', icon: FileText },
    { id: 'assets', label: 'Asset Management', icon: Package }
  ];

  // 3. CHANGE: Render logic now defaults to Financial Records
  const renderScreen = () => {
    switch (activeScreen) {
      case 'records':
        return <FinancialRecordsEnhanced />;
      case 'assets':
        return <AssetManagement />;
      default:
        return <FinancialRecordsEnhanced />;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
              <ChurchImage />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeScreen === item.id
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-green-700">
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 z-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-gray-900">ICGC-PHT</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Overlay Menu */}
          {mobileMenuOpen && (
            <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-xl lg:hidden">
              <nav className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveScreen(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                        activeScreen === item.id ? 'bg-green-50 text-green-700' : 'text-gray-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 border-t border-gray-100 mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Log Out</span>
                </button>
              </nav>
            </div>
          )}
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto">
            {renderScreen()}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-40">
          <div className="flex items-center justify-around">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`flex flex-col items-center gap-1 p-2 min-w-17.5 ${
                    activeScreen === item.id ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}