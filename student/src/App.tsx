import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { StudentAuthProvider } from '@/contexts/StudentAuthContext'
import StudentLogin from '@/pages/StudentLogin'

function App() {
  return (
    <StudentAuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </StudentAuthProvider>
  )
}

export default App
