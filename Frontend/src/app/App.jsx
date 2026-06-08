import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useEffect } from "react";

function App() {
  const { handleGetMe } = useAuth();

  useEffect(() => {
   handleGetMe()
   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  
  return <RouterProvider router={router} />;
}

export default App;
