import { Terminal as TerminalIcon, Wrench } from 'lucide-react';

export default function DashboardTerminal() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <TerminalIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">SSH Terminal</h2>
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium mb-4">
        <Wrench className="w-4 h-4" />
        Coming Soon
      </div>
      <p className="text-gray-500 max-w-md mx-auto">
        Browser-based SSH terminal is currently in development. In the meantime, you can use the desktop console to access your terminal.
      </p>
    </div>
  );
}
