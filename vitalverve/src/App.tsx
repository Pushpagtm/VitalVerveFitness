import Navbar from '@/scenes/navbar';
import './App.css'
import { useState } from 'react';

function App() {
  const [selectedPage, setSelectedPage] = useState('Home');
   return (
    <>
    <div className='app bg-gray-20'>
      <Navbar  selectedPage={selectedPage} setSelectedPage={setSelectedPage}/>
    </div>
     
    </>
  )
}

export default App
