import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Search,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Phone,
  Users,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const emptyForm = {
  // users table
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phoneNumber: '',
  role: '',
  // groups table
  groupName: '',
  groupType: '',
  location: '',
  description: '',
};

export default function CreateGroupLeader({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError('');
    try {
      const response = await fetch(`${API_URL}/api/user-permissions/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load permissions');
      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      console.error(err);
      setPermissionsError('Could not load permissions. Try refreshing.');
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedIds(new Set());
    setShowPassword(false);
    setShowConfirm(false);
    setSearch('');
    setCategoryFilter('All Categories');
    setCollapsedCategories(new Set());
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const categories = useMemo(() => {
    const grouped = new Map();
    permissions.forEach((permission) => {
      const key = permission.category_name || 'Uncategorized';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(permission);
    });
    return Array.from(grouped, ([name, items]) => ({ name, items }));
  }, [permissions]);

  const categoryNames = useMemo(
    () => ['All Categories', ...categories.map(({ name }) => name)],
    [categories]
  );

  const visibleCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .filter(
        ({ name }) =>
          categoryFilter === 'All Categories' || name === categoryFilter
      )
      .map((category) => ({
        ...category,
        permissions: category.items.filter((permission) => {
          if (!term) return true;
          return (
            permission.name.toLowerCase().includes(term) ||
            category.name.toLowerCase().includes(term)
          );
        }),
      }))
      .filter(({ permissions: items }) => items.length > 0);
  }, [categories, search, categoryFilter]);

  const togglePermission = (permissionId) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      next.has(permissionId) ? next.delete(permissionId) : next.add(permissionId);
      return next;
    });
  };

  const toggleCategory = (categoryName) => {
    setCollapsedCategories((previous) => {
      const next = new Set(previous);
      next.has(categoryName) ? next.delete(categoryName) : next.add(categoryName);
      return next;
    });
  };

  const toggleCategoryPermissions = (categoryPermissions) => {
    const allSelected = categoryPermissions.every(({ id }) => selectedIds.has(id));
    setSelectedIds((previous) => {
      const next = new Set(previous);
      categoryPermissions.forEach(({ id }) => {
        allSelected ? next.delete(id) : next.add(id);
      });
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.role ||
      !formData.groupName ||
      !formData.groupType
    ) {
      setError('All required fields must be filled');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const normalizedRole = String(formData.role).trim().toLowerCase().replace(/\s+/g, '_');
    const allowedRoles = ['group_leader', 'assistant_leader', 'member'];

    if (!allowedRoles.includes(normalizedRole)) {
      setError('Role must be one of: group_leader, assistant_leader, member');
      return;
    }

    const payload = {
      fullName: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phoneNumber: formData.phoneNumber || null,
      role: normalizedRole,
      groupName: formData.groupName,
      type: String(formData.groupType).trim().toLowerCase(),
      location: formData.location || null,
      description: formData.description || null,
      parentGroupId: null,
      permissionIds: Array.from(selectedIds),
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/groups/with-leader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create group leader');
      }

      setSuccess(
        data.warning
          ? `Group leader created. ${data.warning}`
          : 'Group leader created successfully.'
      );
      resetForm();

      if (onSubmit) {
        await onSubmit({ ...payload, user: data.user, group: data.group });
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setError('');
    setSuccess('');
    if (onCancel) onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-4 sm:py-8">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-[0_10px_40px_-12px_rgba(15,23,42,0.12)]">
        <div className="border-b border-slate-100 px-8 py-6">
          <img
            src="/manwo.png"
            alt="Group leader"
            className="mb-4 h-20 w-20 object-contain"
          />
          <div className="text-center">
            <h2 className="text-[#111827] text-[24px] font-bold leading-tight">
              Create Group Leader
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Creates the leader, the group, and links them together
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ---------------- USER INFORMATION ---------------- */}
          <div className="space-y-5 px-8 py-6">
            <h3 className="text-center text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              User Information
            </h3>

            <div className="relative">
              <UserPlus className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter group leader"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-12 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-12 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>

            {/* ROLE INPUT — admin types the role */}
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="role"
                type="text"
                value={formData.role}
                onChange={handleChange}
                placeholder="Enter role (e.g. Group Leader)"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>
          </div>

          {/* ---------------- GROUP INFORMATION ---------------- */}
          <div className="border-t border-slate-100 px-8 py-6 space-y-5">
            <h3 className="text-center text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              Group Information
            </h3>

            <div className="relative">
              <Users className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                name="groupName"
                type="text"
                value={formData.groupName}
                onChange={handleChange}
                placeholder="Group name (e.g. North Cell)"
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-12 pr-4 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              />
            </div>

            {/* GROUP TYPE SELECT — this is what maps to groups.type */}
            <div className="relative">
              <select
                name="groupType"
                value={formData.groupType}
                onChange={handleChange}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-[14px] text-slate-800 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
              >
                <option value="">Select group type</option>
                <option value="fellowship">Fellowship</option>
                <option value="cell">Cell</option>
                <option value="ministry">Ministry</option>
                <option value="department">Department</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <input
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location (optional)"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
            />

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description (optional)"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800 placeholder-slate-400 transition-all focus:border-[#2563EB]/40 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10"
            />
          </div>

          {/* ---------------- PERMISSIONS ---------------- */}
          <div className="border-t border-slate-100 px-8 py-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                Permissions
              </h3>
              <span className="text-[13px] font-medium text-[#111827]">
                Selected: {selectedIds.size}
              </span>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search permissions</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search permissions"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-[13px] text-slate-800"
                />
              </label>

              <label>
                <span className="sr-only">Filter permission category</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 sm:w-auto"
                >
                  {categoryNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {permissionsLoading && (
              <p className="text-[13px] text-slate-400">Loading permissions...</p>
            )}

            {permissionsError && (
              <div className="flex items-center justify-between gap-3">
                <p role="alert" className="text-[13px] text-red-600">
                  {permissionsError}
                </p>
                <button
                  type="button"
                  onClick={fetchPermissions}
                  className="text-[13px] font-medium text-slate-700 underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!permissionsLoading &&
              !permissionsError &&
              visibleCategories.length === 0 && (
                <p className="text-[13px] text-slate-400">
                  No permissions match your search.
                </p>
              )}

            <div className="h-[35vh] min-h-[180px] max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {visibleCategories.map(
                ({ name, permissions: categoryPermissions }) => {
                  const collapsed = collapsedCategories.has(name);
                  const allSelected = categoryPermissions.every(({ id }) =>
                    selectedIds.has(id)
                  );
                  const selectedCount = categoryPermissions.filter(({ id }) =>
                    selectedIds.has(id)
                  ).length;

                  return (
                    <section
                      key={name}
                      className="overflow-hidden rounded-lg border border-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(name)}
                        aria-expanded={!collapsed}
                        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                      >
                        <span className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
                          {collapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                          {name}
                        </span>
                        <span className="text-[12px] text-slate-500">
                          {selectedCount} selected
                        </span>
                      </button>

                      {!collapsed && (
                        <div className="space-y-2 bg-white px-4 py-3">
                          <label className="flex items-center gap-2 border-b border-slate-100 pb-2 text-[13px] font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() =>
                                toggleCategoryPermissions(categoryPermissions)
                              }
                            />
                            Select all in {name}
                          </label>

                          {categoryPermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-center gap-2 pl-1 text-[13px] text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.has(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                              />
                              {permission.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }
              )}
            </div>
          </div>

          {success && (
            <p role="status" className="px-8 pb-2 text-[13px] text-green-600">
              {success}
            </p>
          )}
          {error && (
            <p role="alert" className="px-8 pb-2 text-[13px] text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-8 py-5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg px-5 py-2.5 text-[14px] font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-[14px] font-semibold text-white shadow-md shadow-blue-900/10 transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Creating…' : 'Create Group Leader'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}