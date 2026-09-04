'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Check,
  Lock,
  RotateCcw,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TeamMemberRole,
  PermissionAction,
  RolePermissionsConfig,
  DEFAULT_ROLE_PERMISSIONS,
} from '@/types/database.types';
import { PERMISSION_DEFINITIONS } from '@/lib/auth/permissions';
import { updateRolePermissionsConfig } from '@/app/settings/team-actions';

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialConfig: RolePermissionsConfig;
  onConfigUpdated?: (newConfig: RolePermissionsConfig) => void;
}

const ACTION_KEYS: PermissionAction[] = [
  'manage_billing',
  'manage_team',
  'edit_brand_kit',
  'manage_prompts',
  'trigger_audits',
  'content_studio_pitches',
  'export_reports',
  'view_telemetry',
];

export function RolePermissionsDialog({
  open,
  onOpenChange,
  projectId,
  initialConfig,
  onConfigUpdated,
}: RolePermissionsDialogProps) {
  const [config, setConfig] = useState<RolePermissionsConfig>(initialConfig);
  const [isPending, startTransition] = useTransition();

  const togglePermission = (role: 'admin' | 'editor' | 'viewer', action: PermissionAction) => {
    setConfig((prev) => {
      const currentList = prev[role] || [];
      const hasIt = currentList.includes(action);
      const updatedList = hasIt
        ? currentList.filter((a) => a !== action)
        : [...currentList, action];

      return {
        ...prev,
        [role]: updatedList,
      };
    });
  };

  const handleResetDefaults = () => {
    setConfig({ ...DEFAULT_ROLE_PERMISSIONS });
    toast.info('Permissions reset to system defaults.');
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await updateRolePermissionsConfig(projectId, config);
        if (res.success) {
          toast.success('Role-Based Access Control matrix successfully updated.');
          if (onConfigUpdated) onConfigUpdated(res.config);
          onOpenChange(false);
        }
      } catch (err) {
        toast.error('Failed to update permission matrix.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Configure Role-Based Access Controls (RBAC)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Specify which platform actions and capabilities are permitted for each security role level.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 min-w-[220px]">Capability / Feature</th>
                    <th className="py-3 px-3 text-center min-w-[90px]">
                      <span className="text-purple-700 font-bold block">Owner</span>
                      <span className="text-[10px] text-slate-400 font-normal">Root</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[90px]">
                      <span className="text-blue-700 font-bold block">Admin</span>
                      <span className="text-[10px] text-slate-400 font-normal">Manage</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[90px]">
                      <span className="text-emerald-700 font-bold block">Editor</span>
                      <span className="text-[10px] text-slate-400 font-normal">Create</span>
                    </th>
                    <th className="py-3 px-3 text-center min-w-[90px]">
                      <span className="text-slate-700 font-bold block">Viewer</span>
                      <span className="text-[10px] text-slate-400 font-normal">Read-only</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ACTION_KEYS.map((action) => {
                    const meta = PERMISSION_DEFINITIONS[action];
                    const ownerHas = true;
                    const adminHas = (config.admin || []).includes(action);
                    const editorHas = (config.editor || []).includes(action);
                    const viewerHas = (config.viewer || []).includes(action);

                    return (
                      <tr key={action} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block text-xs">
                            {meta.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            {meta.description}
                          </span>
                        </td>

                        {/* Owner Column (Always true / Locked) */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <span className="h-5 w-5 rounded bg-purple-100 text-purple-700 flex items-center justify-center cursor-not-allowed">
                              <Lock className="h-3 w-3" />
                            </span>
                          </div>
                        </td>

                        {/* Admin Column */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={adminHas}
                              onChange={() => togglePermission('admin', action)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* Editor Column */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={editorHas}
                              onChange={() => togglePermission('editor', action)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* Viewer Column */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={viewerHas}
                              onChange={() => togglePermission('viewer', action)}
                              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 cursor-pointer"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between w-full pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Restore Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Save Permission Matrix
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
