# Types BullMQ

Ce répertoire contient les définitions TypeScript pour les jobs et options BullMQ.

## Objectif

Fournir des types cohérents et réutilisables pour les jobs, options et résultats BullMQ afin d'assurer la sécurité des types.

## Conventions de nommage

- Les fichiers de types doivent suivre le format : `{domaine}-types.ts`
- Exemple : `notification-types.ts`, `processing-types.ts`

## Exemple de structure

```typescript
// notification-job-types.ts
export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface BaseNotificationJobData {
  recipientId: string;
  templateId: string;
  priority: NotificationPriority;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EmailNotificationJobData extends BaseNotificationJobData {
  type: NotificationType.EMAIL;
  recipientEmail: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export interface SmsNotificationJobData extends BaseNotificationJobData {
  type: NotificationType.SMS;
  phoneNumber: string;
}

export type NotificationJobData = EmailNotificationJobData | SmsNotificationJobData;

// notification-result-types.ts
export interface NotificationJobResult {
  status: 'success' | 'failure' | 'partial';
  messageId?: string;
  sentAt: string;
  deliveredTo?: string[];
  failureReason?: string;
  providerResponse?: any;
}
```

## Bonnes pratiques

- Utiliser des interfaces pour les structures de données complexes
- Utiliser des enums pour les valeurs constantes
- Favoriser l'utilisation de types unions et d'héritage pour la réutilisabilité
- Documenter les propriétés avec des commentaires JSDoc