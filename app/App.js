import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import Renters from './components/Renters';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/renters" element={<Renters />} />
            </Routes>
        </Router>
    );
}

export default App;
