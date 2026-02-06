
import AdminLogin from "./pages/login/Login"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminHome from "./pages/Admin/AdminHome";

function App() {
  return (
    <>
     <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="adminHome" element={<AdminHome />} />

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
