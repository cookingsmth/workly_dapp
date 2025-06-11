import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Fragment } from 'react'
import { TokenType, SUPPORTED_TOKENS } from '../types/token'

const tokens = Object.values(SUPPORTED_TOKENS)

interface TokenDropdownProps {
  selected: TokenType
  setSelected: (token: TokenType) => void
  showWarnings?: boolean
}

export default function TokenDropdown({ selected, setSelected, showWarnings = true }: TokenDropdownProps) {
  const selectedToken = SUPPORTED_TOKENS[selected]

  return (
    <div className="relative">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="group relative w-full bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 rounded-2xl py-4 pl-6 pr-12 text-left text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 border border-white/10 hover:border-white/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl shadow-lg">
                  {selectedToken.icon}
                </div>
                {selectedToken.requiresExtraSOL && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">+</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <span className="block font-bold text-lg text-white group-hover:text-purple-200 transition-colors">
                  {selected}
                </span>
                <span className="block text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {selectedToken.name}
                </span>
              </div>
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <ChevronUpDownIcon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </span>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#1e2140] to-[#0f1119] shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="p-2">
                {tokens.map((token) => (
                  <Listbox.Option
                    key={token.symbol}
                    value={token.symbol}
                    className={({ active, selected }) =>
                      `relative cursor-pointer select-none rounded-xl p-4 transition-all duration-200 ${
                        active 
                          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 scale-[1.02] shadow-lg' 
                          : 'hover:bg-white/5'
                      } ${
                        selected ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10' : ''
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl shadow-lg">
                              {token.icon}
                            </div>
                            {token.requiresExtraSOL && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">+</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className={`font-bold text-lg block ${selected ? 'text-white' : 'text-gray-200'}`}>
                              {token.symbol}
                            </span>
                            <span className="text-sm text-gray-400 block">{token.name}</span>
                            <span className="text-xs text-gray-500 block">{token.description}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {token.requiresExtraSOL && (
                            <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-full">
                              <span className="text-xs font-bold text-amber-300">
                                +{token.solFeeAmount} SOL
                              </span>
                            </div>
                          )}
                          {selected && (
                            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                              <CheckIcon className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {/* Красивые предупреждения */}
      {showWarnings && selectedToken.requiresExtraSOL && (
        <div className="mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-sm"></div>
          <div className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">!</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2">
                  Additional SOL Required
                  <div className="px-2 py-1 bg-amber-400/20 rounded-full">
                    <span className="text-xs font-bold text-amber-300">
                      +{selectedToken.solFeeAmount} SOL
                    </span>
                  </div>
                </h4>
                <p className="text-amber-200 text-sm leading-relaxed mb-3">
                  You'll need to send <span className="font-bold text-amber-100">{selectedToken.solFeeAmount} SOL</span> along with your {selected} to cover transaction fees for payout.
                </p>
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <span className="text-amber-400">💰</span>
                  </div>
                  <span>Estimated fee cost: ~${(selectedToken.solFeeAmount * 180).toFixed(2)} USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Красивая информация для SOL */}
      {showWarnings && !selectedToken.requiresExtraSOL && (
        <div className="mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-sm"></div>
          <div className="relative bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <div>
                <h4 className="font-bold text-green-300 mb-1">No Extra Fees!</h4>
                <p className="text-sm text-green-200">
                  SOL is the native token and covers its own transaction costs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}