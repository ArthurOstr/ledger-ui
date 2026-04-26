import { useEffect, useState } from 'react';
import { getTransactions, Transaction } from '../api/client';
import TransactionTable from '../components/TransactionTable';
import FileUpload from '../components/FileUpload';


export default function Dashboard() {
  const [transactions, getTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        const data = await getTransactions();
        setTransactions(data);
      } catch (err) {
        setError('Failed to breach the vault. Is the Back-End server running?')
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVaultData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Financial Overview</h2>
          <p className="text-gray-500 text-sm mt-1">Live data feed from the PostgreSQL engine.</p>
        </div>
        <FileUpload onUploadSuccess={() => window.location.reload()} />      </div>

      {loading && (
        <div className="text-gray-500 animate-pulse font-mono text-sm">
          Establishing secure connection...
        </div>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded-md text-sm font-mono">
          {error}
        </div>
      )}

      {!loading && !error && <TransactionTable transactions={transactions} />}
    </div>
  );
}
