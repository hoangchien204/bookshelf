import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';

import AppRoutes from './Approuter';
import { AuthProvider } from './components/user/AuthContext';
function App() {

  return (
    <Router>
      <AuthProvider >
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
