export type MigratedModule = {
  id: string;
  name: string;
  source: string;
  destinationPath: string;
  migratedAt: string;
  status: 'success' | 'partial' | 'failed' | 'in_review';
  testCoverage: number;
  qualityScore: number;
  hasAudit: boolean;
  auditPath?: string;
};

export async function getMigratedModules(): Promise<MigratedModule[]> {
  // Dans une implémentation réelle, cette fonction récupérerait les données
  // depuis une base de données ou une API
  
  // Simuler des données pour l'exemple
  return [
    {
      id: "mod1",
      name: "UserAuthentication",
      source: "auth/UserAuthModule.php",
      destinationPath: "src/modules/auth/UserAuth.ts",
      migratedAt: new Date(Date.now() - 3600000).toISOString(),
      status: "success",
      testCoverage: 87,
      qualityScore: 92,
      hasAudit: true,
      auditPath: "src/modules/auth/UserAuth.audit.md"
    },
    {
      id: "mod2",
      name: "PaymentProcessor",
      source: "billing/PaymentProcessor.php",
      destinationPath: "src/modules/billing/PaymentProcessor.ts",
      migratedAt: new Date(Date.now() - 7200000).toISOString(),
      status: "in_review",
      testCoverage: 72,
      qualityScore: 85,
      hasAudit: true,
      auditPath: "src/modules/billing/PaymentProcessor.audit.md"
    },
    {
      id: "mod3",
      name: "InventoryManager",
      source: "inventory/InventoryMgr.php",
      destinationPath: "src/modules/inventory/InventoryManager.ts",
      migratedAt: new Date(Date.now() - 86400000).toISOString(),
      status: "partial",
      testCoverage: 65,
      qualityScore: 78,
      hasAudit: true,
      auditPath: "src/modules/inventory/InventoryManager.audit.md"
    }
  ];
}

export async function getMigratedModuleById(id: string): Promise<MigratedModule | null> {
  const modules = await getMigratedModules();
  return modules.find(module => module.id === id) || null;
}
