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
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ADMIN_CREATE_URL = `${API_URL}/api/admins`;

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
};

export default function CreateAdministrator({ onSubmit, onCancel }) {
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
      const response = await fetch(`${API_URL}/api/permissions`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load permissions');
      }

      const data = await response.json();
      setPermissions(data.permissions || []);
    } catch (fetchError) {
      console.error(fetchError);
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

  // --------------------------------------------------
  // Form changes
  // --------------------------------------------------

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const categories = useMemo(() => {
    const groupedPermissions = new Map();

    permissions.forEach((permission) => {
      const categoryName = permission.category_name || 'Uncategorized';
      if (!groupedPermissions.has(categoryName)) {
        groupedPermissions.set(categoryName, []);
      }
      groupedPermissions.get(categoryName).push(permission);
    });

    return Array.from(groupedPermissions, ([name, items]) => ({ name, items }));
  }, [permissions]);

  const categoryNames = useMemo(
    () => ['All Categories', ...categories.map(({ name }) => name)],
    [categories]
  );

  const visibleCategories = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return categories
      .filter(({ name }) => categoryFilter === 'All Categories' || name === categoryFilter)
      .map((category) => ({
        ...category,
        permissions: category.items.filter((permission) => {
          if (!searchTerm) return true;
          return permission.name.toLowerCase().includes(searchTerm)
            || category.name.toLowerCase().includes(searchTerm);
        }),
      }))
      .filter(({ permissions: categoryPermissions }) => categoryPermissions.length > 0);
  }, [categories, search, categoryFilter]);

  const togglePermission = (permissionId) => {
    setSelectedIds((previousIds) => {
      const nextIds = new Set(previousIds);
      if (nextIds.has(permissionId)) nextIds.delete(permissionId);
      else nextIds.add(permissionId);
      return nextIds;
    });
  };

  const toggleCategory = (categoryName) => {
    setCollapsedCategories((previousCategories) => {
      const nextCategories = new Set(previousCategories);
      if (nextCategories.has(categoryName)) nextCategories.delete(categoryName);
      else nextCategories.add(categoryName);
      return nextCategories;
    });
  };

  const toggleCategoryPermissions = (categoryPermissions) => {
    const allSelected = categoryPermissions.every(({ id }) => selectedIds.has(id));
    setSelectedIds((previousIds) => {
      const nextIds = new Set(previousIds);
      categoryPermissions.forEach(({ id }) => {
        if (allSelected) nextIds.delete(id);
        else nextIds.add(id);
      });
      return nextIds;
    });
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.role
    ) {
      setError('All fields are required');
      return;
    }

    if (
      formData.password !== formData.confirmPassword
    ) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const payload = {
      ...formData,
      permissionIds: Array.from(selectedIds),
    };

    try {
      setLoading(true);

      // ----------------------------------------------
      // If parent provides onSubmit
      // ----------------------------------------------

      if (onSubmit) {
        await onSubmit(payload);
      }

      // ----------------------------------------------
      // Otherwise call API directly
      // ----------------------------------------------

      else {
        const res = await fetch(ADMIN_CREATE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message ||
              'Failed to create administrator'
          );
        }
      }

      // ----------------------------------------------
      // Reset the form before showing the success message.
      // ----------------------------------------------

      resetForm();
      setSuccess('Administrator created successfully.');

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Cancel
  // --------------------------------------------------

  const handleCancel = () => {
    resetForm();
    setError('');
    setSuccess('');

    // If parent provided onCancel,
    // notify the parent as well.
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-4 sm:py-8">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-[0_10px_40px_-12px_rgba(15,23,42,0.12)]">

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100">

          <img
            src="/manwo.png"
            alt="Man and woman administrators"
            className="mb-4 h-20 w-20 object-contain"
          />

          <div className="text-center">
            <h2 className="text-[#111827] text-[24px] font-bold leading-tight">
              Create Administrator
            </h2>

            <p className="text-slate-500 text-[13px] mt-1">
              Create a new administrator
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Administrator Information */}
          <div className="px-8 py-6 space-y-5">

            <h3 className="text-[12px] font-semibold tracking-wide text-slate-400 uppercase text-center">
              Administrator Information
            </h3>

            {/* Full Name */}
            <div className="relative">
              <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />

              <input
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/40 transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />

              <input
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/40 transition-all"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />

                <input
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/40 transition-all"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400" />

                <input
                  name="confirmPassword"
                  type={
                    showConfirm
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className="w-full pl-12 pr-12 py-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/40 transition-all"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(
                      (value) => !value
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showConfirm
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Role */}
            <h3 className="text-[12px] font-semibold tracking-wide text-slate-400 uppercase pt-2 text-center">
              Role / Office
            </h3>

            <input
              name="role"
              type="text"
              value={formData.role}
              onChange={handleChange}
              placeholder="Enter role"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/40 transition-all"
            />
          </div>

          <div className="px-8 py-6 border-t border-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold tracking-wide text-slate-400 uppercase">
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search permissions"
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-[13px] text-slate-800"
                />
              </label>
              <label>
                <span className="sr-only">Filter permission category</span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-700 sm:w-auto"
                >
                  {categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
            </div>

            {permissionsLoading && <p className="text-[13px] text-slate-400">Loading permissions...</p>}
            {permissionsError && (
              <div className="flex items-center justify-between gap-3">
                <p role="alert" className="text-[13px] text-red-600">{permissionsError}</p>
                <button type="button" onClick={fetchPermissions} className="text-[13px] font-medium text-slate-700 underline">
                  Retry
                </button>
              </div>
            )}
            {!permissionsLoading && !permissionsError && visibleCategories.length === 0 && (
              <p className="text-[13px] text-slate-400">No permissions match your search.</p>
            )}

            <div className="h-[35vh] min-h-[180px] max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {visibleCategories.map(({ name, permissions: categoryPermissions }) => {
                const collapsed = collapsedCategories.has(name);
                const allSelected = categoryPermissions.every(({ id }) => selectedIds.has(id));
                const selectedCount = categoryPermissions.filter(({ id }) => selectedIds.has(id)).length;

                return (
                  <section key={name} className="overflow-hidden rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => toggleCategory(name)}
                      aria-expanded={!collapsed}
                      className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
                    >
                      <span className="flex items-center gap-2 text-[14px] font-medium text-slate-800">
                        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        {name}
                      </span>
                      <span className="text-[12px] text-slate-500">{selectedCount} selected</span>
                    </button>
                    {!collapsed && (
                      <div className="space-y-2 bg-white px-4 py-3">
                        <label className="flex items-center gap-2 border-b border-slate-100 pb-2 text-[13px] font-medium text-slate-600">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => toggleCategoryPermissions(categoryPermissions)}
                          />
                          Select all in {name}
                        </label>
                        {categoryPermissions.map((permission) => (
                          <label key={permission.id} className="flex items-center gap-2 pl-1 text-[13px] text-slate-700">
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
              })}
            </div>
          </div>

          {/* Success */}
          {success && (
            <p
              role="status"
              className="px-8 text-[13px] text-green-600 pb-2"
            >
              {success}
            </p>
          )}

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="px-8 text-[13px] text-red-600 pb-2"
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3">

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-[14px] font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-[14px] font-semibold hover:bg-[#1D4ED8] transition-colors disabled:opacity-60 shadow-md shadow-blue-900/10"
            >
              <ShieldCheck className="w-4 h-4" />

              {loading
                ? 'Creating…'
                : 'Create Administrator'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}