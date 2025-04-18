import Header from "@/components/layout/Header";
import HeroBanner from "@/components/pages/Visitor/sections/HeroBanner";
import AboutSection from "@/components/pages/Visitor/sections/AboutSection";
import TutorsSection from "@/components/pages/Visitor/sections/TutorsSection";
import CoursesAndUniversitiesSection from "./sections/CoursesAndUniversitiesSection";

export default function Home() {
  return (
    <>
      <Header />
      <HeroBanner />
      <AboutSection/>
      <TutorsSection/>
      <CoursesAndUniversitiesSection/>
    </>
  );
}
