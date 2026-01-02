import Link from "next/link";

export function Header() {
  return (
    <header className="bg-gray-900 text-gray-300 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Brand/Logo Section */}
          <Link href="/" className="flex items-center space-x-3 hover:text-white transition-colors">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-lg">
              <span className="text-white font-bold text-lg">VT</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Video Toolbox</h1>
              <p className="text-xs text-gray-400">by Lefty Studios</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/privacy-policy" 
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <a 
              href="https://www.leftystudios.com"
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
            >
              Contact
            </a>
          </nav>

          {/* Mobile Menu Button (for future mobile nav implementation) */}
          <button className="md:hidden text-gray-300 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
} 