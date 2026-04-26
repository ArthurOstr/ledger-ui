import { Transaction } from '../api/client'

interface Props {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return <div className="text-gray-500 py-4 italic">No transactions found in the vault.</div>;
  }
  return (
    <div className="overflow-x-auto bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300 text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 font-semibold text-gray-900">Date</th>
            <th className="px-3 py-3.5 font-semibold text-gray-900">Description</th>
            <th className="px-3 py-3.5 font-semibold text-gray-900">Category</th>
            <th className="px-3 py-3.5 font-semibold text-gray-900">Amount</th>
            <th className="px-3 py-3.5 font-semibold text-gray-900">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-gray-900">
                {new Date(tx.date).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-gray-600">{tx.description}</td>
              <td className="whitespace-nowrap px-3 py-4 text-gray-500">{tx.category || '-'}</td>
              <td className={`whitespace-nowrap px-3 py-4 font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {tx.amount} {tx.currency}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-gray-500">
                {tx.balance_after} {tx.balance_currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
