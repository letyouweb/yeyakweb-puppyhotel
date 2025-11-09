import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../lib/supabase';

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const navigate = useNavigate();

  const getRecoveryTargetEmail = () => (recoveryEmail || email).trim();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await adminService.login(email, password);
      if (user) {
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminEmail', email);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setRecoveryStep(1);
    setSecurityQuestion('');
    setSecurityAnswer('');
    setRecoveryEmail('');
    setError('');
  };

  const handleSecurityLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const targetEmail = getRecoveryTargetEmail();

    if (!targetEmail) {
      setError('관리자 이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const question = await adminService.getSecurityQuestion(targetEmail);
      setSecurityQuestion(question);
      setRecoveryStep(2);
    } catch (err: any) {
      setError('등록된 계정을 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const targetEmail = getRecoveryTargetEmail();

    if (!targetEmail) {
      setError('관리자 이메일을 입력해주세요.');
      return;
    }

    if (!securityAnswer.trim()) {
      setError('보안 질문 답변을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await adminService.verifySecurityAnswer(targetEmail, securityAnswer);
      await adminService.triggerPasswordReset(targetEmail);
      setSecurityAnswer('');
      setRecoveryStep(3);
    } catch (err: any) {
      setError('보안 답변이 일치하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setRecoveryStep(1);
    setSecurityQuestion('');
    setSecurityAnswer('');
    setRecoveryEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-shield-user-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
          <p className="text-gray-600 mt-2">보호자 관리 시스템</p>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-mail-line mr-2"></i>관리자 이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="이메일을 입력하세요"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-lock-line mr-2"></i>비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="비밀번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm flex items-center">
                  <i className="ri-error-warning-line mr-2"></i>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line mr-2 animate-spin"></i>로그인 중...
                </>
              ) : (
                <>
                  <i className="ri-login-box-line mr-2"></i>로그인
                </>
              )}
            </button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium block w-full"
                disabled={loading}
              >
                <i className="ri-question-line mr-1"></i>비밀번호를 잊으셨나요?
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/signup')}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium block w-full"
                disabled={loading}
              >
                <i className="ri-user-add-line mr-1"></i>처음이신가요? 회원가입
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {recoveryStep === 1 && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">계정 확인</h2>
                  <p className="text-gray-600 text-sm">등록된 관리자 이메일을 입력하면 보안 질문을 안내해 드립니다.</p>
                </div>

                <form onSubmit={handleSecurityLookup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                    <input
                      type="email"
                      value={recoveryEmail || email}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="관리자 이메일을 입력하세요"
                      required
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm flex items-center">
                        <i className="ri-error-warning-line mr-2"></i>
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? '확인 중...' : '보안 질문 확인'}
                  </button>
                </form>
              </div>
            )}

            {recoveryStep === 2 && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">보안 질문</h2>
                  <p className="text-gray-600 text-sm">등록된 답변을 입력해 주세요. 일치하면 비밀번호 재설정 메일을 보내드립니다.</p>
                </div>

                <form onSubmit={handleSecurityAnswer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">질문</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-800">{securityQuestion || '등록된 보안 질문이 없습니다.'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">답변</label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="보안 질문 답변을 입력하세요"
                      required
                      disabled={loading}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-600 text-sm flex items-center">
                        <i className="ri-error-warning-line mr-2"></i>
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? '확인 중...' : '답변 제출'}
                  </button>
                </form>
              </div>
            )}

            {recoveryStep === 3 && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <i className="ri-mail-send-line text-xl text-green-600"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">재설정 메일을 전송했습니다.</h2>
                <p className="text-gray-600 text-sm">이메일의 안내를 따라 새 비밀번호를 설정해 주세요.</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleBackToLogin}
                className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                disabled={loading}
              >
                <i className="ri-arrow-left-line mr-1"></i>로그인으로 돌아가기
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <p>© 2025 yeyakweb All rights reserved.</p>
            <p className="mt-1">문의: 010-8241-1619</p>
          </div>
        </div>
      </div>
    </div>
  );
}

