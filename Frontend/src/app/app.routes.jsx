import { createBrowserRouter } from "react-router-dom";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import Dashboard from "../features/chat/pages/Dashboard";
import Protected from "../features/auth/component/Protected";
import Gallery from "../features/gallery/pages/Gallery";
import Pricing from "../features/payment/pages/Pricing";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: <Protected>
      <Dashboard />
      </Protected>,
  },
  {
  path: "/gallery",
  element: <Gallery />
},
{
  path: "/pricing",
  element: <Pricing />,
},
]);