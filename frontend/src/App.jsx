import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { homePathFor, useAuth } from './hooks/useAuth.jsx'

import Login from './pages/shared/Login.jsx'
import FarmerLogin from './pages/shared/FarmerLogin.jsx'
import BuyerLogin from './pages/shared/BuyerLogin.jsx'
import OfficerLogin from './pages/shared/OfficerLogin.jsx'
import OTPVerify from './pages/shared/OTPVerify.jsx'
import Register from './pages/shared/Register.jsx'
import FarmerRegister from './pages/shared/FarmerRegister.jsx'
import BuyerRegister from './pages/shared/BuyerRegister.jsx'
import OfficerRegister from './pages/shared/OfficerRegister.jsx'
import RegistrationSuccess from './pages/shared/RegistrationSuccess.jsx'
import AppShell from './components/layout/AppShell.jsx'

const Marketplace = lazy(() => import('./pages/shared/Marketplace.jsx'))
const Profile = lazy(() => import('./pages/shared/Profile.jsx'))

const FarmerHome = lazy(() => import('./pages/farmer/FarmerHome.jsx'))
const DiseaseScan = lazy(() => import('./pages/farmer/DiseaseScan.jsx'))
const MyContracts = lazy(() => import('./pages/farmer/MyContracts.jsx'))
const FarmerAlerts = lazy(() => import('./pages/farmer/FarmerAlerts.jsx'))
const ContractDetail = lazy(() => import('./pages/farmer/ContractDetail.jsx'))

const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard.jsx'))
const PostContract = lazy(() => import('./pages/buyer/PostContract.jsx'))
const ContractFulfilment = lazy(() => import('./pages/buyer/ContractFulfilment.jsx'))
const CommitmentDetail = lazy(() => import('./pages/buyer/CommitmentDetail.jsx'))

const OfficerReview = lazy(() => import('./pages/officer/OfficerReview.jsx'))
const IssueAlert = lazy(() => import('./pages/officer/IssueAlert.jsx'))
const RegionalOutbreaks = lazy(() => import('./pages/officer/RegionalOutbreaks.jsx'))
const RegionDetail = lazy(() => import('./pages/officer/RegionDetail.jsx'))
const WarningPanel = lazy(() => import('./pages/officer/WarningPanel.jsx'))
const PriceRanges = lazy(() => import('./pages/officer/PriceRanges.jsx'))

function PageSpinner() {
  return null
}

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
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/farmer" element={<FarmerLogin />} />
        <Route path="/login/buyer" element={<BuyerLogin />} />
        <Route path="/login/officer" element={<OfficerLogin />} />
        <Route path="/login/otp" element={<OTPVerify />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/farmer" element={<FarmerRegister />} />
        <Route path="/register/buyer" element={<BuyerRegister />} />
        <Route path="/register/officer" element={<OfficerRegister />} />
        <Route path="/register/success" element={<RegistrationSuccess />} />

        <Route element={<ProtectedLayout />}>
          {/* Farmer */}
          <Route element={<RoleRoute roles={['farmer']} />}>
            <Route path="/farmer" element={<FarmerHome />} />
            <Route path="/farmer/scan" element={<DiseaseScan />} />
            <Route path="/farmer/contracts" element={<MyContracts />} />
            <Route path="/farmer/alerts" element={<FarmerAlerts />} />
          </Route>

          {/* Buyer */}
          <Route element={<RoleRoute roles={['buyer']} />}>
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/buyer/post" element={<PostContract />} />
            <Route path="/buyer/fulfilment" element={<ContractFulfilment />} />
            <Route path="/buyer/commitment/:id" element={<CommitmentDetail />} />
          </Route>

          {/* Officer */}
          <Route element={<RoleRoute roles={['officer']} />}>
            <Route path="/officer" element={<OfficerReview />} />
            <Route path="/officer/alert" element={<IssueAlert />} />
            <Route path="/officer/outbreaks" element={<RegionalOutbreaks />} />
            <Route path="/officer/outbreaks/:region" element={<RegionDetail />} />
            <Route path="/officer/warnings" element={<WarningPanel />} />
            <Route path="/officer/price-ranges" element={<PriceRanges />} />
          </Route>

          {/* Shared */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ContractDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  )
}
