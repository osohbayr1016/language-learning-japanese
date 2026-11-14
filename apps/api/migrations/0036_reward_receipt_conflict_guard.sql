-- A concurrent retry with an altered payload must not mutate SRS or game
-- data even when both requests pass their initial application-level read.
-- D1 batches are transactions: aborting this insert rolls back earlier writes.
CREATE TRIGGER IF NOT EXISTS reward_receipt_payload_guard
BEFORE INSERT ON reward_receipts
WHEN EXISTS (
  SELECT 1 FROM reward_receipts
  WHERE user_id = NEW.user_id AND kind = NEW.kind
    AND session_id = NEW.session_id
    AND request_hash <> NEW.request_hash
)
BEGIN
  SELECT RAISE(ABORT, 'reward_receipt_payload_conflict');
END;
