import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { GlobeAltIcon, LightBulbIcon, PencilIcon, CubeTransparentIcon } from '@heroicons/react/24/solid'

const tasks = [
  {
    title: "Design new logo",
    desc: "Submit SVG concept for rebranding.",
    reward: "18 USDT",
    icon: PencilIcon
  },
  {
    title: "Create meme on Workly",
    desc: "Post a meme on Twitter or Lens with #workly.",
    reward: "5 USDC",
    icon: GlobeAltIcon
  },
  {
    title: "Propose a Workly feature",
    desc: "Suggest a new feature (UX, Web3 logic, viral mechanic). Text or sketch accepted.",
    reward: "6 USDT",
    icon: LightBulbIcon
  },
  {
    title: "Invent a degen game using SPL tokens",
    desc: "Describe a simple on-chain game using SPL tokens (burns, raffles, meme battles, etc).",
    reward: "7 USDT",
    icon: CubeTransparentIcon
  }
]

export default function TrendingTasks() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative z-10 max-w-6xl mx-auto mt-24 px-4">
      <h3 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-10">
        🔥 Trending Tasks
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task, i) => {
          const Icon = task.icon
          return (
            <div
              key={i}
              className={clsx(
                "group transition-all duration-300 transform",
                "bg-gradient-to-br from-[#1e213a] via-[#262b4d] to-[#1a1d34]",
                "border border-purple-500/15",
                "rounded-2xl p-5 shadow-md hover:shadow-purple-500/30",
                "hover:scale-[1.02] hover:ring-2 hover:ring-purple-400/20 hover:ring-offset-2",
                "backdrop-blur-md relative",
                visible ? `opacity-100 translate-y-0-[${i * 100}ms]` : "opacity-0 translate-y-5"
              )}
            >
              <div className="absolute -inset-1 rounded-2xl blur-xl opacity-10 group-hover:opacity-30 transition duration-500 bg-purple-500"></div>

              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-cyan-300 drop-shadow" />
                  <h4 className="text-lg font-semibold text-white">{task.title}</h4>
                </div>
                <span className="text-sm font-bold text-cyan-300">{task.reward}</span>
              </div>

              <p className="text-sm text-gray-300 relative z-10">{task.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
