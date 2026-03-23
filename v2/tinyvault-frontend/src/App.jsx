import SubscriptionList from './components/SubscriptionList'
import Header from './components/Header'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <div className="app">
      <Toaster position="bottom-right" />
      <Header />

      <main className="content" style={{ marginTop: '0' }}>
        <SubscriptionList />
      </main>

      <footer className="footer">&copy; 2026 TinyVault</footer>
    </div>
  )
}

export default App
