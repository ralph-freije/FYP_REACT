import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMe } from "../api/authApi";

export default function OAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");

    const finishLogin = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      localStorage.setItem("token", token);

      try {
        const response = await getMe();
        localStorage.setItem("user", JSON.stringify(response.data));
        localStorage.setItem(
          "ecotrack_sidebar_user",
          JSON.stringify(response.data)
        );
      } finally {
        navigate("/dashboard");
      }
    };

    finishLogin();
  }, []);

  return <div>Signing you in...</div>;
}
