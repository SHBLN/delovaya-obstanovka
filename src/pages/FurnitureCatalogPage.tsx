import { CatalogSection } from '../components/catalog/CatalogSection'
import { FloatingContact } from '../components/contacts/FloatingContact'
import { ScrollToTopButton } from '../components/ScrollToTopButton'
import { AboutSection } from '../components/site/AboutSection'
import { AdvantagesSection } from '../components/site/AdvantagesSection'
import { ContactsSection } from '../components/site/ContactsSection'
import { HeroSection } from '../components/site/HeroSection'
import { HighlightsSection } from '../components/site/HighlightsSection'
import { SiteFooter } from '../components/site/SiteFooter'
import { SiteHeader } from '../components/site/SiteHeader'
import { createAnchorClickHandler } from '../lib/scroll'
import { useHashNavigation } from '../lib/useHashNavigation'

export function FurnitureCatalogPage() {
  useHashNavigation()

  return (
    <div className="min-h-screen bg-[#f7f2ea] text-[#35322e]">
      <SiteHeader />

      <main onClick={createAnchorClickHandler()}>
        <HeroSection />
        <CatalogSection />
        <HighlightsSection />
        <AboutSection />
        <AdvantagesSection />
        <ContactsSection />
      </main>

      <SiteFooter />
      <ScrollToTopButton />
      <FloatingContact />
    </div>
  )
}
