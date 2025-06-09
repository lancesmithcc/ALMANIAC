'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GardenInvitationWithDetails } from '@/types';

export default function GardenInvitations() {
  const { data: session } = useSession();
  const [invitations, setInvitations] = useState<GardenInvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session?.user?.email) {
      fetchInvitations();
    }
  }, [session]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/garden-invitations');
      const data = await response.json();

      if (data.success) {
        setInvitations(data.invitations);
      } else {
        setError(data.error || 'Failed to load invitations');
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setProcessing(invitationId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/garden-invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        // Remove the processed invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        setError(data.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      setError(`Failed to ${action} invitation`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Garden Invitations</h2>
        <p className="text-gray-400">Loading invitations...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show the component if there are no invitations
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Garden Invitations ({invitations.length})</h2>
      
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                                 <h3 className="font-medium text-white mb-1">
                   Invitation to &ldquo;{invitation.garden_name}&rdquo;
                 </h3>
                <p className="text-sm text-gray-300 mb-2">
                  Invited by <span className="font-medium">{invitation.invited_by_username}</span> as{' '}
                  <span className="font-medium capitalize">{invitation.role}</span>
                </p>
                
                                 {invitation.message && (
                   <div className="bg-gray-600 rounded p-3 mb-3">
                     <p className="text-sm text-gray-200">&ldquo;{invitation.message}&rdquo;</p>
                   </div>
                 )}
                
                <p className="text-xs text-gray-400">
                  Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                  Expires {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleInvitation(invitation.id, 'accept')}
                  disabled={processing === invitation.id}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                >
                  {processing === invitation.id ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={() => handleInvitation(invitation.id, 'decline')}
                  disabled={processing === invitation.id}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 