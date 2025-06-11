import clsx from 'clsx'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
}

const achievements: Achievement[] = [
  {
    id: 'first-task',
    title: 'First Task',
    description: 'Complete your first task',
    icon: '🎉',
    unlocked: true,
  },
  {
    id: 'creator',
    title: 'Task Creator',
    description: 'Post 5 tasks',
    icon: '🛠️',
    unlocked: false,
  },
  {
    id: 'on-fire',
    title: 'On Fire',
    description: 'Complete 3 tasks in a day',
    icon: '🔥',
    unlocked: false,
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete a task within 1 hour',
    icon: '⏰',
    unlocked: true,
  },
  {
    id: 'stable-worker',
    title: 'Consistent',
    description: 'Complete 7 tasks in a week',
    icon: '📆',
    unlocked: false,
  },
]

export default function AchievementsSection() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6 text-white">🏅 Achievements</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={clsx(
              'rounded-2xl p-6 transition-all duration-300',
              ach.unlocked
                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-400/30 shadow-lg hover:scale-[1.02]'
                : 'bg-white/5 border border-white/10 text-gray-500 opacity-50 hover:scale-[1.01]'
            )}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl">{ach.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-white">{ach.title}</h3>
                <p className="text-sm text-gray-300">{ach.description}</p>
              </div>
            </div>
            {ach.unlocked ? (
              <div className="text-green-400 text-sm font-medium">Unlocked</div>
            ) : (
              <div className="text-gray-400 text-sm">Locked</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
