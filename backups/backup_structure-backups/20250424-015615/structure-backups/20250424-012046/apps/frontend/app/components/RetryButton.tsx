import { useState } from reactstructure-agent";
import { Form } from @remix-run/reactstructure-agent";

interface RetryButtonProps {
  jobId: string;
  filename: string;
  dryRun?: boolean;
}

/**
 * Bouton pour relancer un job MCP avec confirmation
 */
export default function RetryButton({ jobId, filename, dryRun = false }: RetryButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  // Gestion de la confirmation
  const handleClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
  };

  // Annulation de la confirmation
  const handleCancel = () => {
    setIsConfirming(false);
  };

  return (
    <>
      {isConfirming ? (
        <div className="flex items-center space-x-2">
          <Form method="post" action={`/admin/retry`}>
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="dryRun" value={dryRun ? "true" : "false"} />
            <button
              type="submit"
              className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Confirmer
            </button>
          </Form>
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          className={`inline-flex items-center px-3 py-1 border ${
            dryRun 
              ? "border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 focus:ring-purple-500" 
              : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500"
          } text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          {dryRun ? "🧪 Dry Run" : "🔁 Relancer"}
        </button>
      )}
    </>
  );
}