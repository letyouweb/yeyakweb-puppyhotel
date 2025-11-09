import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../lib/supabase';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const admin = await adminService.login(username, password);
      
      if (admin) {
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminUsername', username);
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setRecoveryStep(1);
    setError('');
  };

  const handleSecurityAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const admin = await adminService.verifySecurityAnswer(
        recoveryUsername || username || 'admin',
        securityAnswer
      );
      
      if (admin) {
        setSecurityQuestion(admin.security_question);
        setRecoveryStep(2);
      }
    } catch (err: any) {
      setError('보안 답변이 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      await adminService.resetPassword(
        recoveryUsername || username || 'admin',
        newPassword
      );

      alert('비밀번호가 성공적으로 변경되었습니다.');
      setShowForgotPassword(false);
      setRecoveryStep(1);
      setSecurityAnswer('');
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryUsername('');
    } catch (err: any) {
      setError('비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setRecoveryStep(1);
    setError('');
    setSecurityAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryUsername('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-shield-user-line text-2xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
          <p className="text-gray-600 mt-2">펫호텔 관리 시스템</p>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="ri-user-line mr-2"></i>관리자 아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="아이디를 입력하세요"
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
                <><i className="ri-loader-4-line mr-2 animate-spin"></i>로그인 중...</>
              ) : (
                <><i className="ri-login-box-line mr-2"></i>로그인</>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                disabled={loading}
              >
                <i className="ri-question-line mr-1"></i>아이디/비밀번호를 잊으셨나요?
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {recoveryStep === 1 && (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">계정 찾기</h2>
                  <p className="text-gray-600 text-sm">아이디와 보안 질문에 답변해 주세요</p>
                </div>

                <form onSubmit={handleSecurityAnswer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
                    <input
                      type="text"
                      value={recoveryUsername}
                      onChange={(e) => setRecoveryUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="아이디를 입력하세요"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">보안 질문</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-800">가장 좋아하는 반려동물의 이름은?</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">답변</label>
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="보안 질문에 대한 답변을 입력하세요"
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
                    {loading ? '확인 중...' : '확인'}
                  </button>
                </form>
              </div>
            )}

            {recoveryStep === 2 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="ri-check-line text-xl text-green-600"></i>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">새 비밀번호 설정</h2>
                  <p className="text-gray-600 text-sm">새로운 비밀번호를 입력해 주세요</p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                      required
                      minLength={6}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="비밀번호를 다시 입력하세요"
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
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <i className="ri-save-line mr-2"></i>{loading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </form>
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
            <p>© 2024 펫호텔 관리 시스템. All rights reserved.</p>
            <p className="mt-1">보안 문의: admin@pethotel.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
