import Navbar from '@/scenes/navbar';
import './App.css'
import { useEffect, useState } from 'react';
import { SelectedPage } from './shared/types';
import Home from '@/scenes/home';
import Benefits from './scenes/benefits';
import OurClasses from './scenes/ourClasses';
import ContactUs from './scenes/contactUs';
import Footer from './scenes/footer';
import Auth from './scenes/auth';
import { useNavigate } from 'react-router-dom';
function App() {
  const navigate = useNavigate();
  const [selectedPage, setSelectedPage] = useState<SelectedPage>(SelectedPage.Home );
  const[isTopOfPage,setIsTopOfPage]=useState<boolean>(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const isLoggedIn = Boolean(localStorage.getItem("auth_token"));
    setIsAuthModalOpen(!isLoggedIn);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setIsTopOfPage(true);
        setSelectedPage(SelectedPage.Home);
      }
      if (window.scrollY !== 0) setIsTopOfPage(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

   return (
    <>
    <div className='app bg-gray-20'>
      <Navbar isTopOfPage={isTopOfPage} selectedPage={selectedPage} setSelectedPage={setSelectedPage}/>
     <Home setSelectedPage={setSelectedPage}/>
     <Benefits setSelectedPage={setSelectedPage}/>
     <OurClasses setSelectedPage={setSelectedPage}/>
     <ContactUs setSelectedPage={setSelectedPage}/>
     <Footer/>
     {isAuthModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="relative w-full max-w-[560px]">
          <button
            type="button"
            className="absolute right-4 top-4 z-10 rounded bg-gray-100 px-3 py-1 text-sm font-semibold"
            onClick={() => setIsAuthModalOpen(false)}
          >
            Skip
          </button>
          <Auth
            isModal
            onLoginSuccess={() => {
              setIsAuthModalOpen(false);
              navigate("/dashboard");
            }}
          />
        </div>
      </div>
     )}
    </div>
     
    </>
  )
}

export default App
