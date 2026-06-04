import React , {useEffect} from 'react'
import { useSelector } from 'react-redux';
import { useChats } from '../hooks/useChats';

function Dashboard() {
 const user = useSelector((state) => state.auth.user);
  const chat = useChats();

useEffect(() => {
    chat.initializeSocketConnection();
}, []);

if (!user) {
  return <div>Loading...</div>;
}
    console.log("User in Dashboard:", user);



  return (
    <div>Dashboard</div>
  )
}

export default Dashboard