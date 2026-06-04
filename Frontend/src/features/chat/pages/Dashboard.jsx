import React from 'react'
import { useSelector } from 'react-redux';

function Dashboard() {
 const user = useSelector((state) => state.auth.user);

if (!user) {
  return <div>Loading...</div>;
}
    console.log("User in Dashboard:", user);
  return (
    <div>Dashboard</div>
  )
}

export default Dashboard