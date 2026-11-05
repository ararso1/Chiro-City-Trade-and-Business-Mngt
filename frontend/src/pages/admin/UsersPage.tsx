import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { managementRequest as request } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
type Permission = { id: string; code: string; name: string; module?: string };
type Role = {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  protectedPermissionNames?: string[];
  rolePermissions: { permission: Permission }[];
};
type Staff = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleNames: string[];
  role: { name: string };
  isActive: boolean;
};
const emptyUser = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roleNames: [] as string[],
  isActive: true,
};
export default function UsersPage() {
  const { hasPermission, refreshProfile, user: me } = useAuth();
  const [users, setUsers] = useState<Staff[]>([]),
    [roles, setRoles] = useState<Role[]>([]),
    [assignable, setAssignable] = useState<Role[]>([]),
    [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState("");
  const [userOpen, setUserOpen] = useState(false),
    [editingUser, setEditingUser] = useState<string | null>(null),
    [form, setForm] = useState(emptyUser);
  const [roleOpen, setRoleOpen] = useState(false),
    [editingRole, setEditingRole] = useState<Role | null>(null),
    [roleForm, setRoleForm] = useState({
      name: "",
      description: "",
      permissionIds: [] as string[],
    });
  const canAssign =
    hasPermission("users.create") || hasPermission("users.update");
  async function load() {
    setLoading(true);
    try {
      const [u, r, a, p] = await Promise.all([
        hasPermission("users.read") ? request<Staff[]>("/users") : [],
        hasPermission("roles.read") ? request<Role[]>("/users/roles") : [],
        canAssign ? request<Role[]>("/users/assignable-roles") : [],
        hasPermission("permissions.read") ||
        hasPermission("roles.read") ||
        hasPermission("roles.update") ||
        hasPermission("roles.create")
          ? request<Permission[]>("/users/permissions")
          : [],
      ]);
      setUsers(u);
      setRoles(r);
      setAssignable(a);
      setPermissions(p);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load users and roles.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  function editUser(u?: Staff) {
    setEditingUser(u?.id ?? null);
    setForm(
      u
        ? {
            name: u.name,
            email: u.email,
            phone: u.phone ?? "",
            password: "",
            roleNames: u.roleNames?.length ? u.roleNames : [u.role.name],
            isActive: u.isActive,
          }
        : emptyUser,
    );
    setError("");
    setUserOpen(true);
  }
  async function saveUser() {
    if (
      !form.name.trim() ||
      !form.email ||
      !form.roleNames.length ||
      (!editingUser && form.password.length < 8)
    ) {
      setError(
        "Enter a name, valid email, at least one role and a temporary password of at least 8 characters.",
      );
      return;
    }
    await perform(async () => {
      const { password, ...rest } = form;
      await request(editingUser ? "/users/" + editingUser : "/users", {
        method: editingUser ? "PUT" : "POST",
        body: JSON.stringify(editingUser ? rest : form),
      });
      setUserOpen(false);
    });
  }
  function editRole(role?: Role) {
    setEditingRole(role ?? null);
    setRoleForm({
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionIds: role?.rolePermissions.map((p) => p.permission.id) ?? [],
    });
    setError("");
    setRoleOpen(true);
  }
  const locked = editingRole?.protectedPermissionNames ?? [];
  async function saveRole() {
    if (!roleForm.name.trim()) {
      setError("Enter a role name.");
      return;
    }
    await perform(async () => {
      const payload = {
        ...roleForm,
        permissionIds: [
          ...new Set([
            ...roleForm.permissionIds,
            ...permissions
              .filter((p) => locked.includes(p.code))
              .map((p) => p.id),
          ]),
        ],
      };
      await request(
        editingRole ? "/users/roles/" + editingRole.id : "/users/roles",
        { method: editingRole ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setRoleOpen(false);
      await refreshProfile();
    });
  }
  const errorBox = error && (
    <p
      role="alert"
      className="rounded border border-red-300 bg-red-50 p-3 text-red-700 whitespace-pre-line"
    >
      {error}
    </p>
  );
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage Chiro Auth users and CCTBM roles and permissions.
        </p>
      </div>
      {!userOpen && !roleOpen && errorBox}
      <Tabs defaultValue={hasPermission("users.read") ? "users" : "roles"}>
        <TabsList>
          {hasPermission("users.read") && (
            <TabsTrigger value="users">Users</TabsTrigger>
          )}
          {hasPermission("roles.read") && (
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <div className="flex gap-3">
                <Input
                  aria-label="Search users"
                  placeholder="Search name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {hasPermission("users.create") && (
                  <Button onClick={() => editUser()}>Add User</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading users?</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-3">Name</th>
                        <th>Email</th>
                        <th>Roles</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) =>
                          (u.name + " " + u.email)
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .map((u) => (
                          <tr key={u.id} className="border-b">
                            <td className="p-3">{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              {(u.roleNames?.length
                                ? u.roleNames
                                : [u.role.name]
                              ).join(", ")}
                            </td>
                            <td>{u.isActive ? "Active" : "Inactive"}</td>
                            <td>
                              {hasPermission("users.update") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => editUser(u)}
                                >
                                  Edit user
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <p className="py-6 text-muted-foreground">
                      No users found.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <div className="flex gap-3">
                {hasPermission("roles.create") && (
                  <>
                    <Button onClick={() => editRole()}>Create Role</Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        perform(async () => {
                          await request("/users/roles/sync", {
                            method: "POST",
                          });
                        })
                      }
                    >
                      Sync Chiro Auth roles
                    </Button>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Imported roles start with no permissions. Grant access using
                Edit permissions.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="rounded border p-4 flex flex-wrap justify-between gap-3"
                >
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {r.description}
                    </p>
                    <p className="text-sm">
                      {r.rolePermissions.length} permissions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {hasPermission("roles.update") && (
                      <Button variant="outline" onClick={() => editRole(r)}>
                        Edit permissions
                      </Button>
                    )}
                    {hasPermission("roles.delete") && !r.isSystem && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          if (confirm("Retire this unused role from CCTBM?"))
                            void perform(async () => {
                              await request("/users/roles/" + r.id, {
                                method: "DELETE",
                              });
                            });
                        }}
                      >
                        Retire role
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={userOpen} onOpenChange={setUserOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit user" : "Add User"}</DialogTitle>
            <DialogDescription>
              New accounts have verified email and must change their temporary
              password at first sign-in. Role changes require a fresh sign-in.
            </DialogDescription>
          </DialogHeader>
          {errorBox}
          <Label htmlFor="staff-name">Full name *</Label>
          <Input
            id="staff-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Label htmlFor="staff-email">Email *</Label>
          <Input
            id="staff-email"
            type="email"
            disabled={!!editingUser}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {!editingUser && (
            <>
              <Label htmlFor="staff-password">Temporary password *</Label>
              <Input
                id="staff-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </>
          )}
          <Label htmlFor="staff-phone">Phone</Label>
          <Input
            id="staff-phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Label>Roles *</Label>
          <div className="max-h-48 overflow-auto rounded border p-3 space-y-2">
            {assignable.map((r) => (
              <label key={r.id} className="flex items-center gap-2">
                <Checkbox
                  checked={form.roleNames.includes(r.name)}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      roleNames: checked
                        ? [...form.roleNames, r.name]
                        : form.roleNames.filter((n) => n !== r.name),
                    })
                  }
                />
                {r.name}
              </label>
            ))}
          </div>
          <label className="flex gap-2 items-center">
            <Checkbox
              disabled={editingUser === me?.id}
              checked={form.isActive}
              onCheckedChange={(v) => setForm({ ...form, isActive: !!v })}
            />
            Active in CCTBM
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={saveUser}>
              {busy ? "Saving?" : "Save user"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit permissions" : "Create Role"}
            </DialogTitle>
            <DialogDescription>
              Permissions control access to CCTBM operations. Required
              administrator management permissions stay locked.
            </DialogDescription>
          </DialogHeader>
          {errorBox}
          <Label htmlFor="role-name">Role name *</Label>
          <Input
            id="role-name"
            disabled={!!editingRole}
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
          />
          <Label htmlFor="role-description">Description</Label>
          <Input
            id="role-description"
            value={roleForm.description}
            onChange={(e) =>
              setRoleForm({ ...roleForm, description: e.target.value })
            }
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {permissions.map((p) => (
              <label key={p.id} className="flex gap-2 items-start">
                <Checkbox
                  checked={
                    locked.includes(p.code) ||
                    roleForm.permissionIds.includes(p.id)
                  }
                  disabled={locked.includes(p.code) || !hasPermission(p.code)}
                  onCheckedChange={(checked) =>
                    setRoleForm({
                      ...roleForm,
                      permissionIds: checked
                        ? [...roleForm.permissionIds, p.id]
                        : roleForm.permissionIds.filter((id) => id !== p.id),
                    })
                  }
                />
                <span className="text-sm">
                  {p.code}
                  {locked.includes(p.code) && (
                    <span className="ml-2 text-muted-foreground">Required</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={saveRole}>
              {busy ? "Saving?" : "Save permissions"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
