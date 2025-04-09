import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, Link } from "@remix-run/react";
import { useState } from "react";
import { getMigrationPatches } from "~/services/migration.server";

type MigrationPatch = {
  migration_batch: string;
  generated_at: string;
  files: Array<{
    source_file: string;
    status: 'pending_review' | 'in_progress' | 'validated' | 'completed';
    reviewer: string | null;
    last_update: string;
    mappings: Array<{
      sql_column: string;
      legacy_php_var: string;
      prisma_model: string;
      prisma_field: string;
      change_type: 'keep' | 'rename' | 'add' | 'remove';
      reason: string;
      confidence: number;
      verified: boolean;
    }>;
  }>;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const migrationPatches = await getMigrationPatches();
  return json({ migrationPatches });
}

export default function MigrationPatchesPage() {
  const { migrationPatches } = useLoaderData<typeof loader>();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const navigate = useNavigate();

  const patch = migrationPatches[0]; // We'll just use the first patch for this example
  
  const selectedFileData = patch.files.find(f => f.source_file === selectedFile);
  
  // Stats
  const totalMappings = patch.files.reduce(
    (sum, file) => sum + file.mappings.length, 
    0
  );
  
  const verifiedMappings = patch.files.reduce(
    (sum, file) => sum + file.mappings.filter(m => m.verified).length, 
    0
  );
  
  const verificationProgress = totalMappings > 0
    ? Math.round((verifiedMappings / totalMappings) * 100)
    : 0;
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Migration Patches</h1>
        <div className="flex space-x-2">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => navigate("/dashboard/generate-patch")}
          >
            Generate New Patch
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded">
            Export JSON
          </button>
        </div>
      </div>
      
      <div className="mb-6 flex space-x-4">
        <div className="p-4 bg-white rounded shadow flex-1">
          <h3 className="font-medium text-gray-700">Batch</h3>
          <p className="text-xl">{patch.migration_batch}</p>
        </div>
        <div className="p-4 bg-white rounded shadow flex-1">
          <h3 className="font-medium text-gray-700">Files</h3>
          <p className="text-xl">{patch.files.length}</p>
        </div>
        <div className="p-4 bg-white rounded shadow flex-1">
          <h3 className="font-medium text-gray-700">Mappings</h3>
          <p className="text-xl">{totalMappings}</p>
        </div>
        <div className="p-4 bg-white rounded shadow flex-1">
          <h3 className="font-medium text-gray-700">Verification</h3>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
              <div 
                className="bg-green-600 h-4 rounded-full" 
                style={{ width: `${verificationProgress}%` }}
              ></div>
            </div>
            <span>{verificationProgress}%</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-4">PHP Files</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {patch.files.map(file => (
              <div 
                key={file.source_file}
                className={`p-3 rounded cursor-pointer ${
                  selectedFile === file.source_file 
                    ? 'bg-blue-100 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedFile(file.source_file)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">
                    {file.source_file.split('/').pop()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    file.status === 'validated' ? 'bg-green-100 text-green-800' :
                    file.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    file.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {file.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {file.source_file}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>{file.mappings.length} mappings</span>
                  <span>
                    {file.mappings.filter(m => m.verified).length} verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="col-span-8 bg-white rounded shadow p-4">
          {selectedFileData ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Mappings: {selectedFileData.source_file}
                </h2>
                <div className="flex space-x-2">
                  <select 
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedFileData.status}
                  >
                    <option value="pending_review">Pending Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="validated">Validated</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Reviewer" 
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedFileData.reviewer || ''}
                  />
                  <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                    Save
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-4 text-left">SQL Column</th>
                      <th className="py-3 px-4 text-left">PHP Variable</th>
                      <th className="py-3 px-4 text-left">Prisma Model</th>
                      <th className="py-3 px-4 text-left">Prisma Field</th>
                      <th className="py-3 px-4 text-left">Change</th>
                      <th className="py-3 px-4 text-left">Reason</th>
                      <th className="py-3 px-4 text-left">Confidence</th>
                      <th className="py-3 px-4 text-left">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {selectedFileData.mappings.map((mapping, index) => (
                      <tr 
                        key={`${mapping.sql_column}-${mapping.prisma_field}-${index}`}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">{mapping.sql_column}</td>
                        <td className="py-3 px-4">{mapping.legacy_php_var}</td>
                        <td className="py-3 px-4">{mapping.prisma_model}</td>
                        <td className="py-3 px-4">{mapping.prisma_field}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            mapping.change_type === 'keep' ? 'bg-green-100 text-green-800' :
                            mapping.change_type === 'rename' ? 'bg-yellow-100 text-yellow-800' :
                            mapping.change_type === 'add' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {mapping.change_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">{mapping.reason}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  mapping.confidence > 0.9 ? 'bg-green-500' :
                                  mapping.confidence > 0.8 ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${mapping.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(mapping.confidence * 100)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="checkbox" 
                            checked={mapping.verified}
                            className="form-checkbox h-5 w-5 text-blue-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a file to view its mappings
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
