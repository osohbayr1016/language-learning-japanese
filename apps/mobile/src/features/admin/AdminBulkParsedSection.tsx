import React from 'react';
import { AdminBulkKanjiPreview } from './AdminBulkKanjiPreview';
import { AdminKanjiExampleFieldsBlock } from './AdminKanjiExampleFieldsBlock';
import type { AdminBulkValidateRow } from '../../lib/api/admin';
import type { ParsedImportLine } from './parseKanjiImportLines';

type Props = {
  preview: ParsedImportLine[];
  okRows: Extract<ParsedImportLine, { ok: true }>[];
  errRows: Extract<ParsedImportLine, { ok: false }>[];
  serverFails: Extract<AdminBulkValidateRow, { ok: false }>[];
  token: boolean;
  bulkExJp: string;
  bulkExRo: string;
  bulkExMn: string;
  onBulkExJp: (v: string) => void;
  onBulkExRo: (v: string) => void;
  onBulkExMn: (v: string) => void;
};

export function AdminBulkParsedSection({
  preview,
  okRows,
  errRows,
  serverFails,
  token,
  bulkExJp,
  bulkExRo,
  bulkExMn,
  onBulkExJp,
  onBulkExRo,
  onBulkExMn,
}: Props) {
  if (!preview.length) return null;
  return (
    <>
      <AdminBulkKanjiPreview
        preview={preview}
        okRows={okRows}
        errRows={errRows}
        serverFails={serverFails}
        sharedExample={{ jp: bulkExJp, ro: bulkExRo, mn: bulkExMn }}
      />
      <AdminKanjiExampleFieldsBlock
        exampleJp={bulkExJp}
        exampleRomaji={bulkExRo}
        exampleMn={bulkExMn}
        onExampleJp={onBulkExJp}
        onExampleRomaji={onBulkExRo}
        onExampleMn={onBulkExMn}
        showBulkHint
        disabled={!token}
      />
    </>
  );
}
