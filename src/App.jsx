import AdminLogin from "./pages/login/Login"
import Overview from "./pages/Overview/Overview"
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
     <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="overview" element={<Overview />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
