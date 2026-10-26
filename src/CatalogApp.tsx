import { Route, Routes } from 'react-router-dom'
import { FurnitureCatalogPage } from './pages/FurnitureCatalogPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivacyPage } from './pages/PrivacyPage'

export default function CatalogApp() {
  return (
    <Routes>
      <Route path="/" element={<FurnitureCatalogPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
