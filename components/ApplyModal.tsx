type ApplyModalProps = {
    isOpen: boolean
    onClose: () => void
    taskTitle: string
}

export default function ApplyModal({ isOpen, onClose, taskTitle }: ApplyModalProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-lg animate-fadeInBackdrop"
            onClick={onClose}
        >
            <div
                className="relative glass-morphism p-8 rounded-3xl max-w-lg w-full shadow-2xl text-white animate-fadeInModal transform hover:scale-[1.02] transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl transition-all duration-200 hover:rotate-90"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Apply to: {taskTitle}
                </h2>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Your Wallet Address</label>
                        <input type="text" placeholder="solana_wallet..." className="w-full rounded-xl px-4 py-3 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Submission / Link</label>
                        <input type="text" placeholder="Paste a link to your work or repo" className="w-full rounded-xl px-4 py-3 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Comments (optional)</label>
                        <textarea placeholder="Any additional details?" rows={3} className="w-full rounded-xl px-4 py-3 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 font-semibold text-white hover:scale-105 transition-all duration-300"
                    >
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    )
}
