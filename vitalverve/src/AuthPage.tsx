import { Link } from "react-router-dom";
import Auth from "@/scenes/auth";

const AuthPage = () => {
  return (
    <div className="min-h-screen bg-gray-20">
      <div className="mx-auto w-5/6 pt-10">
        <Link to="/" className="text-sm font-semibold text-primary-500 underline">
          Back to Home
        </Link>
      </div>
      <Auth />
    </div>
  );
};

export default AuthPage;
