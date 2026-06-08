import { useDispatch } from "react-redux";
import { Login, Register, getMe } from "../services/auth.api";
import { setUser, setLoading, setError } from "../auth.slice";

export function useAuth() {
  const dispatch = useDispatch();

  async function handleRegister({ username, email, password }) {
    try {
      dispatch(setLoading(true));
      const data = await Register(username, email, password);
      return data;
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }

 async function handleLogin({ email, password }) {
  try {
    dispatch(setLoading(true));

    const data = await Login(email, password);

    if (!data || data.error) {
      throw new Error(data?.message || "Invalid credentials");
    }

    dispatch(setUser(data));
    return data;
  } catch (error) {
    dispatch(setError(error.message));
    throw error;
  } finally {
    dispatch(setLoading(false));
  }
}
async function handleGetMe() {
  try {
    dispatch(setLoading(true));

    const data = await getMe();

    console.log("GET ME RESPONSE:", data);

    dispatch(setUser(data.user)); // 🔥 IMPORTANT FIX
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
}

  return {
    handleRegister,
    handleLogin,
    handleGetMe,
  };
}
