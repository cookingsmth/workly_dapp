import { useState } from 'react'
import clsx from 'clsx'
import { Button } from './ui'

interface Props {
  onClose: () => void
  onTaskCreated: (task: any) => void
}

export default function NewTaskEscrowModal({ onClose, onTaskCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('USDC')
  const [escrowAddress, setEscrowAddress] = useState('')
  const [step, setStep] = useState<'form' | 'waiting' | 'created'>('form')
  const [error, setError] = useState<string | null>(null)

  const generateEscrowAddress = () => {
    const random = Math.random().toString(36).substring(2, 15)
    return `ESCRW_${random.toUpperCase()}`
  }

  const handleGenerate = () => {
    if (!title || !description || !amount) {
      setError('Fill out all fields')
      return
    }

    const address = generateEscrowAddress()
    setEscrowAddress(address)
    setStep('waiting')
    setError(null)

    // Мокаем проверку поступления средств (в реальности — проверка блокчейна)
    setTimeout(() => {
      const fakeBalance = parseFloat(amount)
      if (fakeBalance >= parseFloat(amount)) {
        const newTask = {
          id: Date.now().toString(),
          title,
          description,
          reward: { amount: parseFloat(amount), token },
          escrowAddress: address,
          status: 'open',
          createdBy: 'current_user' // заменить на реального
        }
        onTaskCreated(newTask)
        setStep('created')
      } else {
        setError('Funds not detected. Try again later.')
      }
    }, 4000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1a1a2e] text-white rounded-2xl p-8 w-full max-w-lg shadow-xl z-10 animate-fadeInModal">
        {step === 'form' && (
          <>
            <h2 className="text-xl font-bold mb-4">Create New Task (Escrow Secured)</h2>
            <div className="space-y-4">
              <input
                className="w-full p-3 bg-white/10 rounded-lg outline-none"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full p-3 bg-white/10 rounded-lg outline-none"
                placeholder="Description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  className="w-1/2 p-3 bg-white/10 rounded-lg outline-none"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <select
                  className="w-1/2 p-3 bg-white/10 rounded-lg"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button variant="gradient" onClick={handleGenerate}>Generate Escrow</Button>
              </div>
            </div>
          </>
        )}

        {step === 'waiting' && (
          <div className="text-center space-y-4">
            <div className="text-3xl animate-spin-slow">💰</div>
            <p className="text-sm">Send <strong>{amount} {token}</strong> to the escrow address below:</p>
            <p className="text-purple-400 font-mono break-all border border-purple-500/20 rounded-xl p-3 bg-white/5">
              {escrowAddress}
            </p>
            <p className="text-xs text-gray-400">Waiting for deposit confirmation...</p>
          </div>
        )}

        {step === 'created' && (
          <div className="text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold">Task Created!</h2>
            <p className="text-sm text-gray-300">Your task is now live and funds secured in escrow.</p>
            <Button variant="primary" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  )
}
