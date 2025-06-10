'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Share2, Mail, Copy, Check } from 'lucide-react';

interface ShareGardenButtonProps {
  gardenId: string;
  gardenName: string;
}

export default function ShareGardenButton({ gardenId, gardenName }: ShareGardenButtonProps) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const defaultMessage = `${session?.user?.username || session?.user?.name} has invited you to collaborate on their garden ${gardenName}. This garden includes all locations and plants within it.`;
      
      const response = await fetch('/api/garden-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gardenId,
          email,
          role,
          message: message || defaultMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Garden invitation sent successfully!');
        setEmail('');
        setMessage('');
        setTimeout(() => {
          setShowModal(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Share garden error:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/garden/${gardenId}`;
    setShareLink(link);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleModalOpen = () => {
    setShowModal(true);
    generateShareLink();
    setError('');
    setSuccess('');
  };

  return (
    <>
      <button
        onClick={handleModalOpen}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share my Garden
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Share &ldquo;{gardenName}&rdquo;</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-blue-200 text-sm mb-2">
                <strong>How garden sharing works:</strong>
              </p>
              <ul className="text-blue-200 text-xs space-y-1 list-disc list-inside">
                <li>Share the link below for public viewing</li>
                <li>Send email invitations for collaboration access</li>
                <li>Recipients must create an account to collaborate</li>
                <li>Check your dashboard for invitation responses</li>
              </ul>
            </div>

            {/* Share Link Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Direct Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center gap-1"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Anyone with this link can view your garden publicly. To collaborate, they need to create an account and you can send them an invitation below.
              </p>
            </div>

            {/* Email Invitation Section */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Invitation
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Send an email invitation with instructions for joining your garden. They&apos;ll need to sign up/log in to accept.
              </p>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded-lg mb-3 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-900/50 border border-green-500 text-green-200 px-3 py-2 rounded-lg mb-3 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleShare} className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                    placeholder="friend@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
                    Permission Level *
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                    disabled={loading}
                  >
                    <option value="viewer">Viewer - View only access</option>
                    <option value="member">Member - Can add/edit plants</option>
                    <option value="admin">Admin - Full garden management</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                    Personal Message (optional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                    placeholder="Add a personal message to your invitation..."
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 