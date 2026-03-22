import SubscriptionList from './components/SubscriptionList'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <div className="app">
      <Toaster position="bottom-right" />
      <header className="hero">
        <h1>TinyVault</h1>
        <p>Control subscriptions, spending, and renewal dates</p>
      </header>

      <main className="content">
        <SubscriptionList />
      </main>

      <footer className="footer">&copy; 2026 TinyVault</footer>
    </div>
  )
}

export default App
