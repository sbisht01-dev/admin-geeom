import AdminDocs from "./pages/Home/AdminDocs";
import Homepage from "./pages/Home/AdminDocs";
import AdminLogin from "./pages/login/Login"
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
     <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route path="admindoc" element={<AdminDocs />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
