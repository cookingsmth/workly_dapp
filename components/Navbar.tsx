export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-6 md:px-12 py-4 bg-gradient-to-r from-[#0f1523] to-[#182848] shadow-lg backdrop-blur-xl rounded-b-2xl z-30 relative">
      <div className="flex items-center space-x-3">
        <span className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-blue-400 via-purple-500 to-purple-700 bg-clip-text text-transparent select-none drop-shadow-lg">
          WORKLY
        </span>
      </div>
      <div className="hidden md:flex items-center space-x-8">
        <a href="#how-it-works" className="text-gray-300 hover:text-blue-300 font-medium transition-colors duration-200">How It Works</a>
        <a href="#features" className="text-gray-300 hover:text-blue-300 font-medium transition-colors duration-200">Features</a>
        <button className="ml-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-500 text-white font-semibold shadow-neon-purple focus:outline-none transition-all duration-200 hover:scale-105 active:scale-95 animate-glow">
          Connect Wallet
        </button>
      </div>
    </nav>
  )
}
