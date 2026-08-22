import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { homePathFor, useAuth } from './hooks/useAuth.jsx'

import Login from './pages/shared/Login.jsx'
import Register from './pages/shared/Register.jsx'
import Marketplace from './pages/shared/Marketplace.jsx'
import AppShell from './components/layout/AppShell.jsx'

import FarmerHome from './pages/farmer/FarmerHome.jsx'
import DiseaseScan from './pages/farmer/DiseaseScan.jsx'
import MyContracts from './pages/farmer/MyContracts.jsx'

import BuyerDashboard from './pages/buyer/BuyerDashboard.jsx'
import PostContract from './pages/buyer/PostContract.jsx'

import OfficerReview from './pages/officer/OfficerReview.jsx'
import Profile from './pages/shared/Profile.jsx'

function ProtectedLayout() {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <AppShell />
}

function RoleRoute({ roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}

function RootRedirect() {
  const { user } = useAuth()
  if (user) return <Navigate to={homePathFor(user.role)} replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedLayout />}>
        {/* Farmer */}
        <Route element={<RoleRoute roles={['farmer']} />}>
          <Route path="/farmer" element={<FarmerHome />} />
          <Route path="/farmer/scan" element={<DiseaseScan />} />
          <Route path="/farmer/contracts" element={<MyContracts />} />
        </Route>

        {/* Buyer */}
        <Route element={<RoleRoute roles={['buyer']} />}>
          <Route path="/buyer" element={<BuyerDashboard />} />
          <Route path="/buyer/post" element={<PostContract />} />
        </Route>

        {/* Officer */}
        <Route element={<RoleRoute roles={['officer']} />}>
          <Route path="/officer" element={<OfficerReview />} />
        </Route>

        {/* Shared */}
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
