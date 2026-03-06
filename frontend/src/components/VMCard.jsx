import { useState } from 'react';
import { Play, Square, RotateCcw, Trash2, Monitor, ExternalLink, ChevronDown, ChevronUp, Copy, Users, User } from 'lucide-react';
import RemoteAccessPanel from './RemoteAccessPanel';
import { useAuth } from '../hooks/useAuth';

const statusColors = {
  PROVISIONING: 'bg-yellow-100 text-yellow-800',
  RUNNING: 'bg-green-100 text-green-800',
  STOPPED: 'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  ERROR: 'bg-red-100 text-red-800',
  DELETED: 'bg-gray-100 text-gray-400',
};

const userAccessColors = {
  PROVISIONING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  DISABLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function VMCard({ vm, onAction }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      await onAction(vm.id, action);
    } finally {
      setActionLoading(null);
    }
  };

  const subdomain = `${vm.subdomain}.cloudcode.space`;
  const isShared = vm.isShared;
  const userAccess = vm.userAccess;
  const canManage = !isShared || user?.orgRole === 'OWNER';

  return (
    <div className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${isShared ? 'border-cyan-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isShared ? 'bg-cyan-100' : 'bg-brand-100'}`}>
            {isShared ? <Users className="w-5 h-5 text-cyan-600" /> : <Monitor className="w-5 h-5 text-brand-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Ubuntu Desktop</h3>
              {isShared && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-medium border border-cyan-200">
                  Team
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">VM {vm.vmid}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[vm.status]}`}>
                {vm.status === 'PROVISIONING' && <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1" />}
                {vm.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User access status for shared VMs */}
      {isShared && userAccess && (
        <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-lg border ${userAccessColors[userAccess.status] || 'bg-gray-50'}`}>
          <User className="w-4 h-4" />
          <span className="text-sm">
            {userAccess.status === 'ACTIVE' && `Your account: ${userAccess.linuxUsername}`}
            {userAccess.status === 'PROVISIONING' && 'Setting up your access...'}
            {userAccess.status === 'DISABLED' && 'Access disabled'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
        <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">{subdomain}</span>
        <button
          onClick={() => navigator.clipboard.writeText(subdomain)}
          className="text-gray-400 hover:text-gray-600"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {vm.status === 'RUNNING' && (
          <a
            href={`/console/${vm.vmid}`}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Launch Browser
          </a>
        )}
        {vm.status === 'STOPPED' && canManage && (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading === 'start'}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            Start
          </button>
        )}
        {vm.status === 'RUNNING' && canManage && (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          </>
        )}
        {canManage && (
          <button
            onClick={() => handleAction('delete')}
            disabled={actionLoading === 'delete'}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>

      {/* Remote Access Panel Toggle */}
      {vm.status === 'RUNNING' && (!isShared || userAccess?.status === 'ACTIVE') && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Remote Access
          </button>
          {expanded && <RemoteAccessPanel vmId={vm.id} subdomain={vm.subdomain} />}
        </div>
      )}

      {/* Waiting for access message */}
      {isShared && userAccess?.status === 'PROVISIONING' && vm.status === 'RUNNING' && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Setting up your access credentials...
          </div>
        </div>
      )}
    </div>
  );
}
