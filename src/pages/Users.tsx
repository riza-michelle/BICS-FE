import React, { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { User } from '../types';
import { UserPlus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X, LockOpen, Lock, Power, PowerOff } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

function businessDaysElapsed(referenceDate: string | Date): number {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start >= today) return 0;

  let count = 0;
  const current = new Date(start);
  current.setDate(current.getDate() + 1);

  while (current <= today) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getLockCountdown(user: User): { label: string; className: string } | null {
  if (user.role === 'Super Admin') return null;
  if (user.is_locked) return null;

  const ref = user.last_login_at || user.created_at;
  if (!ref) return null;

  const elapsed = businessDaysElapsed(ref);
  const remaining = 30 - elapsed;

  if (remaining <= 0) {
    return { label: 'Locking soon', className: 'bg-red-100 text-red-700' };
  } else if (remaining <= 5) {
    return { label: `${remaining} day${remaining === 1 ? '' : 's'} left`, className: 'bg-orange-100 text-orange-700' };
  } else if (remaining <= 10) {
    return { label: `${remaining} days left`, className: 'bg-yellow-100 text-yellow-700' };
  } else {
    return { label: `${remaining} days left`, className: 'bg-gray-100 text-gray-600' };
  }
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<User | null>(null);
  const [lockConfirmRecord, setLockConfirmRecord] = useState<User | null>(null);
  const [unlockConfirmRecord, setUnlockConfirmRecord] = useState<User | null>(null);
  const [activateConfirmRecord, setActivateConfirmRecord] = useState<User | null>(null);
  const [deactivateConfirmRecord, setDeactivateConfirmRecord] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullname: '',
    role: 'User - SAQ' as 'Super Admin' | 'Admin' | 'User - SAQ' | 'User - FCO'
  });
  const { showNotification } = useNotification();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getList({
        page: currentPage,
        limit: 10,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.total_pages);
        setTotalRecords(response.data.pagination.total_records);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showNotification('error', 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        email: user.email || '',
        fullname: user.fullname || '',
        role: (user.role || 'User - SAQ') as 'Super Admin' | 'Admin' | 'User - SAQ' | 'User - FCO'
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        email: '',
        fullname: '',
        role: 'User - SAQ'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      email: '',
      fullname: '',
      role: 'User - SAQ'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      showNotification('error', 'Username is required');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      showNotification('error', 'Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const updateData: any = {
          username: formData.username,
          email: formData.email || undefined,
          fullname: formData.fullname || undefined,
          role: formData.role
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await usersAPI.update(editingUser.id, updateData);
        if (response.success) {
          showNotification('success', 'User updated successfully');
          handleCloseModal();
          fetchUsers();
        } else {
          showNotification('error', response.message || 'Failed to update user');
        }
      } else {
        // Create new user
        const response = await usersAPI.create({
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          fullname: formData.fullname || undefined,
          role: formData.role
        });

        if (response.success) {
          showNotification('success', 'User created successfully');
          handleCloseModal();
          fetchUsers();
        } else {
          showNotification('error', response.message || 'Failed to create user');
        }
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error saving user');
    }
  };

  const handleConfirmLock = async () => {
    if (!lockConfirmRecord?.id) return;
    try {
      const response = await usersAPI.lock(lockConfirmRecord.id);
      if (response.success) {
        showNotification('success', response.message || 'Account locked successfully!');
        setLockConfirmRecord(null);
        fetchUsers();
      } else {
        showNotification('error', response.message || 'Failed to lock account');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error locking account');
    }
  };

  const handleConfirmActivate = async () => {
    if (!activateConfirmRecord?.id) return;
    try {
      const response = await usersAPI.activate(activateConfirmRecord.id);
      if (response.success) {
        showNotification('success', response.message || 'Account activated successfully!');
        setActivateConfirmRecord(null);
        fetchUsers();
      } else {
        showNotification('error', response.message || 'Failed to activate account');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error activating account');
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateConfirmRecord?.id) return;
    try {
      const response = await usersAPI.deactivate(deactivateConfirmRecord.id);
      if (response.success) {
        showNotification('success', response.message || 'Account deactivated successfully!');
        setDeactivateConfirmRecord(null);
        fetchUsers();
      } else {
        showNotification('error', response.message || 'Failed to deactivate account');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deactivating account');
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeleteConfirmRecord(user);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmRecord(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord || !deleteConfirmRecord.id) return;

    try {
      const response = await usersAPI.delete(deleteConfirmRecord.id);
      if (response.success) {
        showNotification('success', 'User deleted successfully!');
        setDeleteConfirmRecord(null);
        fetchUsers();
      } else {
        showNotification('error', response.message || 'Failed to delete user');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleUnlockClick = (user: User) => {
    setUnlockConfirmRecord(user);
  };

  const handleConfirmUnlock = async () => {
    if (!unlockConfirmRecord || !unlockConfirmRecord.id) return;

    try {
      const response = await usersAPI.unlock(unlockConfirmRecord.id);
      if (response.success) {
        showNotification('success', response.message || 'Account unlocked successfully!');
        setUnlockConfirmRecord(null);
        fetchUsers();
      } else {
        showNotification('error', response.message || 'Failed to unlock account');
      }
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Error unlocking account');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">Create and manage system users</p>
        </div>

        {/* Search and Add Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by username, fullname, or email..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[10%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="w-[11%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="w-[11%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="w-[13%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="w-[10%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-[13%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="w-[9%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="w-[9%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locks In
                  </th>
                  <th className="w-[14%] px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-3 text-center text-xs text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-1.5 text-sm font-medium text-gray-900 truncate overflow-hidden">
                        {user.username}
                      </td>
                      <td className="px-2 py-1.5 text-sm text-gray-500 truncate overflow-hidden">
                        {user.fullname || '-'}
                      </td>
                      <td className="px-2 py-1.5 text-sm text-gray-500 truncate overflow-hidden">
                        {user.email || '-'}
                      </td>
                      <td className="px-2 py-1.5 text-sm">
                        <span className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          user.role === 'Super Admin'
                            ? 'bg-yellow-100 text-yellow-800'
                            : user.role === 'Admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role || 'User - SAQ'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-sm">
                        {user.is_active === false ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                            <PowerOff className="h-3 w-3 mr-0.5" />
                            Deactivated
                          </span>
                        ) : user.is_locked ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            <Lock className="h-3 w-3 mr-0.5" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <Power className="h-3 w-3 mr-0.5" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-sm text-gray-500 truncate overflow-hidden">
                        {user.last_login_at
                          ? new Date(user.last_login_at).toLocaleString()
                          : <span className="text-gray-400 italic">Never</span>}
                      </td>
                      <td className="px-2 py-1.5 text-sm text-gray-500 truncate overflow-hidden">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-2 py-1.5 text-sm">
                        {(() => {
                          const cd = getLockCountdown(user);
                          if (!cd) return <span className="text-gray-400">-</span>;
                          return (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${cd.className}`}>
                              {cd.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-1.5 text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(user)}
                            title="Edit"
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {currentUser?.role === 'Super Admin' && user.role !== 'Super Admin' && !user.is_locked && user.is_active !== false && (
                            <button
                              onClick={() => setLockConfirmRecord(user)}
                              title="Lock"
                              className="p-1 rounded text-amber-600 hover:bg-amber-50 hover:text-amber-900"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {currentUser?.role === 'Super Admin' && user.is_locked && (
                            <button
                              onClick={() => handleUnlockClick(user)}
                              title="Unlock"
                              className="p-1 rounded text-green-600 hover:bg-green-50 hover:text-green-900"
                            >
                              <LockOpen className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {currentUser?.role === 'Super Admin' && user.role !== 'Super Admin' && (
                            user.is_active === false ? (
                              <button
                                onClick={() => setActivateConfirmRecord(user)}
                                title="Activate"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 hover:text-emerald-900"
                              >
                                <Power className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setDeactivateConfirmRecord(user)}
                                title="Deactivate"
                                className="p-1 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                              >
                                <PowerOff className="h-3.5 w-3.5" />
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleDeleteClick(user)}
                            title="Delete"
                            className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-900"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="bg-white px-4 py-2 flex items-center justify-between border-t border-gray-200 sm:px-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalRecords)}</span> of{' '}
                    <span className="font-medium">{totalRecords}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!editingUser && <span className="text-red-500">*</span>}
                  {editingUser && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value.toUpperCase() })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Super Admin' | 'Admin' | 'User - SAQ' | 'User - FCO' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="User - SAQ">User - SAQ</option>
                  <option value="User - FCO">User - FCO</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlock Confirmation Modal */}
      {unlockConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">Unlock Account</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-green-100 rounded-full p-3">
                    <LockOpen className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to unlock this account?
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Username:</strong> {unlockConfirmRecord.username}
                  </p>
                  {unlockConfirmRecord.fullname && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Full Name:</strong> {unlockConfirmRecord.fullname}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Role:</strong> {unlockConfirmRecord.role}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    The user will be able to log in again after unlocking.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setUnlockConfirmRecord(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUnlock}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Unlock Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock Confirmation Modal */}
      {lockConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">Lock Account</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-amber-100 rounded-full p-3">
                    <Lock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to lock this account?
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Username:</strong> {lockConfirmRecord.username}
                  </p>
                  {lockConfirmRecord.fullname && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Full Name:</strong> {lockConfirmRecord.fullname}
                    </p>
                  )}
                  <p className="text-sm text-amber-700 font-medium">
                    The user will not be able to log in until the account is unlocked.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setLockConfirmRecord(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLock}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                >
                  Lock Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">Deactivate Account</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-gray-100 rounded-full p-3">
                    <PowerOff className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to deactivate this account?
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Username:</strong> {deactivateConfirmRecord.username}
                  </p>
                  {deactivateConfirmRecord.fullname && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Full Name:</strong> {deactivateConfirmRecord.fullname}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 font-medium">
                    The user will not be able to log in until the account is reactivated.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setDeactivateConfirmRecord(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeactivate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {activateConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">Activate Account</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-emerald-100 rounded-full p-3">
                    <Power className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to activate this account?
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Username:</strong> {activateConfirmRecord.username}
                  </p>
                  {activateConfirmRecord.fullname && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Full Name:</strong> {activateConfirmRecord.fullname}
                    </p>
                  )}
                  <p className="text-sm text-emerald-600 font-medium">
                    The user will be able to log in again after activation.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setActivateConfirmRecord(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmActivate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Activate Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="bg-red-100 rounded-full p-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-2">
                    Are you sure you want to delete this user?
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Username:</strong> {deleteConfirmRecord.username || 'N/A'}
                    <br />
                    <strong>Full Name:</strong> {deleteConfirmRecord.fullname || 'N/A'}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
