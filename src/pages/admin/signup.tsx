import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminSignup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    nav("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">관리자 회원가입</h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">이메일</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">비밀번호</label>
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              required
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
          </div>
          {msg && <p className="text-sm text-red-600">{msg}</p>}
          <button
            disabled={loading}
            className="w-full bg-teal-600 text-white py-2 rounded"
          >
            {loading ? "처리 중" : "가입하기"}
          </button>
          <button
            type="button"
            onClick={() => nav("/admin")}
            className="w-full border py-2 rounded mt-2"
          >
            로그인으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
}
