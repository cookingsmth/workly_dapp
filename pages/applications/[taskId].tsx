import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Wallet, Link2, Clock } from 'lucide-react';

interface Application {
  id: string;
  taskId: string;
  applicantId: string;
  applicantName: string;
  message: string;
  proposedPrice?: number;
  estimatedDays?: number;
  portfolio?: string;
  wallet?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface TaskInfo {
  id: string;
  title: string;
  status: string;
}

export default function TaskApplicationsPage() {
  const router = useRouter();
  const { taskId } = router.query;
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (taskId && typeof taskId === 'string') {
      loadApplications(taskId);
    }
  }, [taskId]);

  const loadApplications = async (taskId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return router.push('/');

      const response = await fetch(`/api/tasks/${taskId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setApplications(data.applications);
        setTask(data.task);
      } else {
        setError(data.message || 'Failed to load applications');
        if (response.status === 403) router.push(`/task/${taskId}`);
      }
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      setActionLoading(applicationId);
      const token = localStorage.getItem('token');
      if (!token) return router.push('/');

      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action === 'accept' ? 'accepted' : 'rejected' }),
      });

      const data = await response.json();
      if (response.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, status: action === 'accept' ? 'accepted' : 'rejected' }
              : action === 'accept' && app.status === 'pending' && app.id !== applicationId
              ? { ...app, status: 'rejected' }
              : app
          )
        );
        if (action === 'accept' && task) setTask({ ...task, status: 'in_progress' });
        showNotification(`Application ${action}ed successfully!`, 'success');
      } else {
        throw new Error(data.message || `Failed to ${action} application`);
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = (applicantId: string) => router.push(`/chat/${taskId}/${applicantId}`);

  const showNotification = (message: string, type: 'success' | 'error') => {
    const el = document.createElement('div');
    el.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();
  const getStatusColor = (status: string) => ({
    pending: 'bg-yellow-500/20 text-yellow-300',
    accepted: 'bg-green-500/20 text-green-300',
    rejected: 'bg-red-500/20 text-red-300',
  }[status] || 'bg-gray-500/20 text-gray-300');
  const shorten = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <>
      <Head><title>Applications — Workly</title></Head>
      <div className="min-h-screen bg-gradient-to-b from-[#0b0f1a] via-[#1e2140] to-[#0d0d26] text-white">
        <div className="sticky top-0 z-40 backdrop-blur bg-[#0b0f1a]/70 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href={`/task/${taskId}`} className="text-gray-400 hover:text-white">← Back</Link>
            <div className="text-right">
              <h1 className="text-xl font-bold">Applications</h1>
              <p className="text-sm text-gray-400">{applications.length} total</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {task && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 shadow-md">
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>{task.status}</p>
            </motion.div>
          )}

          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-2">📝</div>
              <p className="text-xl font-medium mb-1">No applications yet</p>
              <p className="text-sm">Freelancer applications will appear here.</p>
            </div>
          ) : (
            applications.map((app) => (
              <motion.div key={app.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg hover:shadow-purple-500/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
                    {app.applicantName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{app.applicantName}</h3>
                    <p className="text-sm text-gray-400">Applied: {formatDate(app.createdAt)}</p>
                    {app.wallet && (
                      <p className="text-xs flex items-center gap-1 text-purple-400">
                        <Wallet className="w-3 h-3" /> {shorten(app.wallet)}
                      </p>
                    )}
                  </div>
                  <span className={`ml-auto px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(app.status)}`}>{app.status}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  {app.proposedPrice && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Price</div>
                      <div className="text-green-400 font-semibold flex items-center gap-1">💰 {app.proposedPrice} USDT</div>
                    </div>
                  )}
                  {app.estimatedDays && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Estimated Time</div>
                      <div className="text-blue-400 font-semibold flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {app.estimatedDays} days
                      </div>
                    </div>
                  )}
                  {app.portfolio && (
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-gray-400 text-xs mb-1">Portfolio</div>
                      <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center gap-1">
                        <Link2 className="w-4 h-4" /> View
                      </a>
                    </div>
                  )}
                </div>

                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-400 mb-2">Message</div>
                  <div className="text-gray-300 whitespace-pre-line">{app.message}</div>
                </div>

                {app.status === 'pending' ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => handleApplicationAction(app.id, 'accept')} disabled={actionLoading === app.id} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg">
                      {actionLoading === app.id ? 'Processing...' : <><CheckCircle2 className="inline w-4 h-4 mr-1" /> Accept</>}
                    </button>
                    <button onClick={() => handleApplicationAction(app.id, 'reject')} disabled={actionLoading === app.id} className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg">
                      {actionLoading === app.id ? 'Processing...' : <><XCircle className="inline w-4 h-4 mr-1" /> Reject</>}
                    </button>
                    <button onClick={() => handleMessage(app.applicantId)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg">💬 Message</button>
                  </div>
                ) : (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`mt-4 py-3 text-center rounded-lg ${app.status === 'accepted' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    Application has been {app.status}
                    {app.status === 'accepted' && (
                      <div className="mt-2">
                        <button onClick={() => handleMessage(app.applicantId)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm">💬 Start Discussion</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
