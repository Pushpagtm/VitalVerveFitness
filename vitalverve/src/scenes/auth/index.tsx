import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "signup";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const getResponseData = async (response: Response) => {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response. Please try again.");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const payload =
        mode === "signup" ? { name, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await getResponseData(response);
      if (!response.ok) {
        throw new Error(data?.message || "Authentication failed.");
      }

      if (!data?.token || !data?.user?.name) {
        throw new Error("Authentication response is incomplete. Please try again.");
      }

      localStorage.setItem("auth_token", data.token);
      setMessage(
        `${mode === "signup" ? "Signup" : "Login"} successful. Welcome ${data.user.name}!`
      );
      setName("");
      setEmail("");
      setPassword("");

      if (mode === "login") {
        setTimeout(() => {
          navigate("/");
        }, 600);
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="auth" className="w-full bg-primary-100 py-20">
      <div className="mx-auto w-5/6 max-w-[480px] rounded-2xl bg-white px-8 py-10 shadow-lg">
        <h2 className="mb-2 text-3xl font-bold text-primary-500">
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          {mode === "signup"
            ? "Sign up to access your personalized fitness journey."
            : "Log in to continue training with VitalVerve."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Name"
              className="rounded-md border border-gray-300 px-4 py-3 outline-none transition focus:border-primary-500"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="rounded-md border border-gray-300 px-4 py-3 outline-none transition focus:border-primary-500"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="rounded-md border border-gray-300 px-4 py-3 outline-none transition focus:border-primary-500"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-secondary-500 px-4 py-3 font-semibold text-white transition hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Please wait..." : mode === "signup" ? "Sign Up" : "Log In"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>{message}</p>
        )}

        <button
          type="button"
          className="mt-6 text-sm font-semibold text-primary-500 underline"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setMessage("");
            setIsError(false);
          }}
        >
          {mode === "signup"
            ? "Already have an account? Log in"
            : "No account yet? Sign up"}
        </button>
      </div>
    </section>
  );
};

export default Auth;
