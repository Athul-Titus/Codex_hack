import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Pulse from './pages/Pulse'
import ContentSpark from './pages/ContentSpark'
import Scheduler from './pages/Scheduler'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/content" element={<ContentSpark />} />
            <Route path="/scheduler" element={<Scheduler />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
