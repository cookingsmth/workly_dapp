// pages/settings.tsx
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import BackButton from '../components/BackButton'

interface UserSettings {
  id: string
  email: string
  name: string
  username: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  github?: string
  twitter?: string
  linkedin?: string
  notifications: {
    email: boolean
    push: boolean
    newTasks: boolean
    taskUpdates: boolean
    messages: boolean
    marketing: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    showEmail: boolean
    showStats: boolean
    showCompletedTasks: boolean
  }
  preferences: {
    theme: 'light' | 'dark'
    language: string
    timezone: string
    currency: string
  }
  createdAt?: string
}

export default function SettingsPage() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'preferences' | 'account'>('profile')
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    console.log('Token from localStorage:', token)
    if (!token) {
      console.log('No token found, redirecting to home')
      router.push('/')
      return
    }
    console.log('Token found, user authenticated') 
    setIsAuthenticated(true)
  }, [router])

  // Load settings
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        console.log('Fetching settings with token:', token)
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('Settings response status:', response.status) 

        if (!response.ok) {
          const errorData = await response.json()
          console.log('Settings error:', errorData)
          throw new Error(errorData.message || 'Failed to load settings')
        }

        const data = await response.json()
        console.log('Settings data:', data)
        setSettings(data)
      } catch (err) {
        console.error('Fetch settings error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [isAuthenticated])

  const saveSettings = async (updatedData: Partial<UserSettings>) => {
    if (!settings) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      setSuccess('Settings saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setError('Please type "DELETE_MY_ACCOUNT" to confirm')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ confirmPassword: deleteConfirmation })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete account')
      }

      // Redirect to home after successful deletion
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setSaving(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-gray-400">Loading settings...</span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-50">⚙️</div>
          <p className="text-xl text-gray-400">Failed to load settings</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
    { id: 'privacy' as const, label: 'Privacy', icon: '🔒' },
    { id: 'preferences' as const, label: 'Preferences', icon: '⚙️' },
    { id: 'account' as const, label: 'Account', icon: '🗑️' }
  ]

  return (
    <>
      <Head>
        <title>Workly - Settings</title>
        <link rel="icon" href="/workly.png" sizes="64x64" type="image/png" />
        <meta name="description" content="Web3 platform for tasks with payment in Solana. Post simple tasks and get them done quickly, with payments guaranteed by smart contracts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white">
        <BackButton />

        <div className="p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account preferences</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-300">
              ✅ {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 rounded-xl p-4 sticky top-8">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'text-gray-300 hover:bg-white/10'
                        }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 rounded-xl p-6"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">👤 Profile Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={settings.name || ''}
                          onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                        <input
                          type="text"
                          value={settings.username || ''}
                          onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                      <textarea
                        value={settings.bio || ''}
                        onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                        rows={3}
                        className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                        <input
                          type="text"
                          value={settings.location || ''}
                          onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="City, Country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                        <input
                          type="url"
                          value={settings.website || ''}
                          onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">GitHub</label>
                        <input
                          type="text"
                          value={settings.github || ''}
                          onChange={(e) => setSettings({ ...settings, github: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
                        <input
                          type="text"
                          value={settings.twitter || ''}
                          onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="@username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn</label>
                        <input
                          type="text"
                          value={settings.linkedin || ''}
                          onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          placeholder="username"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => saveSettings({
                        name: settings.name,
                        username: settings.username,
                        bio: settings.bio,
                        location: settings.location,
                        website: settings.website,
                        github: settings.github,
                        twitter: settings.twitter,
                        linkedin: settings.linkedin
                      })}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">🔔 Notification Preferences</h2>

                    <div className="space-y-4">
                      {[
                        { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                        { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                        { key: 'newTasks', label: 'New Tasks', desc: 'Notify when new tasks are posted' },
                        { key: 'taskUpdates', label: 'Task Updates', desc: 'Notify about updates to your tasks' },
                        { key: 'messages', label: 'Messages', desc: 'Notify when you receive new messages' },
                        { key: 'marketing', label: 'Marketing', desc: 'Receive promotional emails and updates' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <div className="font-medium text-white">{item.label}</div>
                            <div className="text-sm text-gray-400">{item.desc}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.notifications[item.key as keyof typeof settings.notifications]}
                              onChange={(e) => setSettings({
                                ...settings,
                                notifications: {
                                  ...settings.notifications,
                                  [item.key]: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => saveSettings({ notifications: settings.notifications })}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      {saving ? 'Saving...' : 'Save Notifications'}
                    </button>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">🔒 Privacy Settings</h2>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
                        <select
                          value={settings.privacy.profileVisibility}
                          onChange={(e) => setSettings({
                            ...settings,
                            privacy: {
                              ...settings.privacy,
                              profileVisibility: e.target.value as 'public' | 'private'
                            }
                          })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="public">Public - Anyone can view your profile</option>
                          <option value="private">Private - Only you can view your profile</option>
                        </select>
                      </div>

                      {[
                        { key: 'showEmail', label: 'Show Email Address', desc: 'Display your email on your public profile' },
                        { key: 'showStats', label: 'Show Statistics', desc: 'Display your task completion stats' },
                        { key: 'showCompletedTasks', label: 'Show Completed Tasks', desc: 'Display your completed tasks list' }
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div>
                            <div className="font-medium text-white">{item.label}</div>
                            <div className="text-sm text-gray-400">{item.desc}</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.privacy[item.key as keyof typeof settings.privacy] as boolean}
                              onChange={(e) => setSettings({
                                ...settings,
                                privacy: {
                                  ...settings.privacy,
                                  [item.key]: e.target.checked
                                }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => saveSettings({ privacy: settings.privacy })}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      {saving ? 'Saving...' : 'Save Privacy Settings'}
                    </button>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">⚙️ Preferences</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                        <select
                          value={settings.preferences.theme}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              theme: e.target.value as 'light' | 'dark'
                            }
                          })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              language: e.target.value
                            }
                          })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="en">English</option>
                          <option value="ru">Русский</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              timezone: e.target.value
                            }
                          })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="Europe/Moscow">Moscow</option>
                          <option value="Asia/Tokyo">Tokyo</option>
                          <option value="Asia/Shanghai">Shanghai</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                        <select
                          value={settings.preferences.currency}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: {
                              ...settings.preferences,
                              currency: e.target.value
                            }
                          })}
                          className="w-full p-3 bg-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="RUB">RUB (₽)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="SOL">SOL</option>
                          <option value="USDT">USDT</option>
                          <option value="USDC">USDC</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => saveSettings({ preferences: settings.preferences })}
                      disabled={saving}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold mb-6">🗑️ Account Management</h2>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Danger Zone</h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-white mb-2">Delete Account</h4>
                          <p className="text-sm text-gray-400 mb-4">
                            This action cannot be undone. This will permanently delete your account,
                            all your tasks, applications, messages, and remove all data associated with your account.
                          </p>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Type "DELETE_MY_ACCOUNT" to confirm:
                              </label>
                              <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full p-3 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                placeholder="DELETE_MY_ACCOUNT"
                              />
                            </div>

                            <button
                              onClick={handleDeleteAccount}
                              disabled={saving || deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
                              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                              {saving ? 'Deleting Account...' : 'Delete My Account'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <h4 className="font-medium text-white mb-2">Account Information</h4>
                          <div className="space-y-2 text-sm text-gray-400">
                            <div>Email: {settings.email}</div>
                            <div>User ID: {settings.id}</div>
                            <div>Member since: {settings.createdAt ? new Date(settings.createdAt).toLocaleDateString() : 'Unknown'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}