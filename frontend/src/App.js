import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/AuthPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
