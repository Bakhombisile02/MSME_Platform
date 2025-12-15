import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import Dashboard from './pages/dashboard/dashboard'
import Login from './pages/login/login'
import RegisterUser from './pages/register-users/register-user-list'
import Faq from './pages/faq/faq'
import FeedbackReceived from './pages/feedback-received/feedback-received'
import ProtectedLayout from './components/layout/protected-layout'
import Articles from './pages/article/page'
import BusinessCategory from './pages/business-categories/business-categories'
import Partners from './pages/partners/partners'
import Banners from './pages/banners/page'
import Contactus from './pages/contact-us/contact-us'
import TeamMembers from './pages/team-member/page'
import DownloadNew from './pages/download-new/page'
import ServiceCategory from './pages/service-provider-categories/page'
import ServiceProvider from './pages/service-provider/page'
import MsmeBusiness from './pages/msme-business/page'
import MsmeDetailPage from './components/msme-business/msme-detail'
import Subscribers from './pages/subscribers/page'
import BusinessSubCategories from './pages/business-sub-categories/business-sub-categories'
import NotFound from './pages/not-found/page'
import MsmeByCategory from './pages/msme-by-category/page'
import ServiceProviderListByCategory from './pages/service-provider-by-category/page'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/registered-user" element={< RegisterUser />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/articles" element={<Articles/>} />
            <Route path="/banner" element={<Banners/>} />
            <Route path="/contact-us" element={<Contactus/>} />
            <Route path="/feedback-received" element={<FeedbackReceived />} />
            <Route path="/business-category" element={<BusinessCategory />}/>
            <Route path="/partners" element={<Partners />}/>
            <Route path="/team-member" element={<TeamMembers />}/>
            <Route path="/download-new" element={<DownloadNew />}/>
            <Route path="/service-category" element={<ServiceCategory />}/> 
            <Route path="/service-provider" element={<ServiceProvider />}/> 
            <Route path="/subscriber" element={<Subscribers />}/> 
            <Route path="/msme-business" element={<Navigate to="/msme-business/0" replace />}/> 
            <Route path="/msme-business/:filter" element={<MsmeBusiness />}/> 
            <Route path="/msme-detail" element={<MsmeDetailPage />}/>
            <Route path="/business-sub-category" element={<BusinessSubCategories />}/> 
            <Route path="/msme-by-category" element={<MsmeByCategory />}/> 
            <Route path="/service-provider-by-category" element={<ServiceProviderListByCategory />}/> 
            {/* <Route path="/incident-reported" element={<IncidentReported />} /> */}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
