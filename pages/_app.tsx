import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import ProfileWidget from '../components/ProfileWidget'
import SolPriceFooter from '../components/ui/SolPriceFooter';
import { WorklyToastContainer } from '../components/WorklyToast'
import { SolPriceProvider } from '../hooks/useSolPrice'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  return (
    <SolPriceProvider>
      {isAuthenticated && <ProfileWidget />}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={router.route}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Component {...pageProps} />
          <WorklyToastContainer />
        </motion.div>
      </AnimatePresence>
      <SolPriceFooter />
    </SolPriceProvider>
  )
}
