import { useThemeStore } from "@/store/themeStore";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/Landing/HeroSection";
import Footer from "@/components/Landing/Footer";
import FeaturesSection from "@/components/Landing/FeaturesSection";
import StatsSection from "@/components/Landing/StatsSection";
import ServicesSection from "@/components/Landing/ServicesSection";
import AboutSection from "@/components/Landing/AboutSection";

const LandingPage = () => {
    const { theme } = useThemeStore();

    return (
        <div
            className={`relative min-h-screen ${theme}`}
            data-theme={theme === "dark" ? "bloodsphere-dark" : "bloodsphere-light"}
        >
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <StatsSection />
            <ServicesSection />
            <AboutSection />
            <Footer />
        </div>
    );
};

export default LandingPage;