'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Garden, GardenMembershipWithUser, GardenInvitationFormData, GardenInvitationWithDetails } from '@/types';
import { Send, UserX, Trash2, Shield, Crown, User, Eye, Check, X, Mail } from 'lucide-react';

interface GardenSettingsProps {
  gardenId: string;
}

export default function GardenSettings({ gardenId }: GardenSettingsProps) {
  const { data: session } = useSession();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [members, setMembers] = useState<GardenMembershipWithUser[]>([]);
  const [invitations, setInvitations] = useState<GardenInvitationWithDetails[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member' | 'viewer' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState<GardenInvitationFormData>({
    email: '',
    role: 'member',
    message: '',
  });

  const canManage = userRole === 'owner' || userRole === 'admin';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch garden details
      const gardenRes = await fetch(`/api/gardens/${gardenId}`);
      if (!gardenRes.ok) throw new Error('Failed to fetch garden details');
      const gardenData = await gardenRes.json();
      setGarden(gardenData);

      // Fetch members
      const membersRes = await fetch(`/api/garden-members?gardenId=${gardenId}`);
      if (!membersRes.ok) throw new Error('Failed to fetch garden members');
      const membersData = await membersRes.json();
      setMembers(membersData.members);

      // Determine current user's role
      const currentUserMembership = membersData.members.find((m: GardenMembershipWithUser) => m.user_id === session?.user?.id);
      setUserRole(currentUserMembership?.role || null);
      
      // Fetch pending invitations (only if user can manage)
      if(currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin') {
        const invitationsRes = await fetch(`/api/garden-invitations?gardenId=${gardenId}`);
        if(invitationsRes.ok) {
          const invitationsData = await invitationsRes.json();
          setInvitations(invitationsData.invitations);
        }
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gardenId && session?.user?.id) {
      fetchData();
    }
  }, [gardenId, session]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      const response = await fetch('/api/garden-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteFormData, gardenId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
      setShowInviteModal(false);
      setInviteFormData({ email: '', role: 'member', message: '' });
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleRoleChange = async (membershipId: string, role: 'admin' | 'member' | 'viewer') => {
    if (!canManage) return;
    try {
      const res = await fetch(`/api/garden-members/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if(!res.ok) throw new Error("Failed to update role");
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!canManage) return;
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const res = await fetch(`/api/garden-members/${membershipId}`, { method: 'DELETE' });
        if(!res.ok) throw new Error("Failed to remove member");
        fetchData(); // Refresh data
      } catch (err: any) {
        setError(err.message);
      }
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!garden) return <div>Garden not found.</div>;

  const RoleIcon = ({ role }: { role: string }) => {
    const icons = {
      owner: <Crown className="h-5 w-5 text-yellow-400" />,
      admin: <Shield className="h-5 w-5 text-blue-400" />,
      member: <User className="h-5 w-5 text-green-400" />,
      viewer: <Eye className="h-5 w-5 text-gray-400" />,
    };
    return icons[role as keyof typeof icons] || null;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Share Settings for "{garden.name}"</h1>
      
      {/* Members Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Members</h2>
          {canManage && (
            <button onClick={() => setShowInviteModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              <Send className="h-4 w-4"/> Invite
            </button>
          )}
        </div>
        <ul className="space-y-3">
          {members.map(member => (
            <li key={member.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
              <div className="flex items-center gap-3">
                <RoleIcon role={member.role} />
                <div>
                  <p className="font-medium text-white">{member.username}</p>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canManage && member.role !== 'owner' ? (
                  <>
                    <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value as any)} className="bg-gray-800 border-gray-600 rounded-md text-white text-sm p-1">
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-gray-400 hover:text-red-500"><UserX className="h-4 w-4"/></button>
                  </>
                ) : (
                  <span className="text-sm text-gray-400 capitalize">{member.role}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pending Invitations Section */}
      {canManage && invitations.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Pending Invitations</h2>
          <ul className="space-y-3">
            {invitations.map(invite => (
              <li key={invite.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <div className="flex items-center gap-3">
                   <Mail className="h-5 w-5 text-gray-400" />
                   <div>
                     <p className="font-medium text-white">{invite.invited_user_email}</p>
                     <p className="text-sm text-gray-400">Invited as <span className="capitalize">{invite.role}</span></p>
                   </div>
                </div>
                {/* Add cancel invitation button here if needed */}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Invite a new member</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                <select
                  id="role"
                  value={inviteFormData.role}
                  onChange={(e) => setInviteFormData({...inviteFormData, role: e.target.value as 'admin' | 'member' | 'viewer'})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
               <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Message (optional)</label>
                <textarea
                  id="message"
                  rows={3}
                  value={inviteFormData.message}
                  onChange={(e) => setInviteFormData({...inviteFormData, message: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="Include a personal message with your invitation..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowInviteModal(false)} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 