export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'id_copy', label: 'ID copy' },
  { value: 'photo', label: 'Photo' },
  { value: 'license', label: 'License' },
  { value: 'contract', label: 'Contract' },
  { value: 'tax_document', label: 'Tax document' },
  { value: 'annual_tax_payment', label: 'Annual tax payment' },
  { value: 'penalty_payment', label: 'Penalty payment' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'other', label: 'Other' },
] as const;

export type DocumentTypeValue = (typeof DOCUMENT_TYPE_OPTIONS)[number]['value'];

export function documentTypeLabel(type?: string | null) {
  if (!type) return 'Other';
  const match = DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type);
  return match?.label ?? type.replace(/_/g, ' ');
}

export function formatFileSize(sizeBytes?: number | null) {
  if (!sizeBytes || sizeBytes <= 0) return '—';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(0)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
