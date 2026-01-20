-- Fix overfunded escrow accounts by adjusting to match contractor bid amounts

-- Fix KIAMBU HOSPITAL UPGRADE: bid is 5,000,000, held is 9,000,000 (already released 1,000,000)
-- Correct held_amount should be: 5,000,000 - 1,000,000 = 4,000,000 remaining
UPDATE escrow_accounts 
SET 
  held_amount = 4000000,
  total_amount = 5000000,
  updated_at = now()
WHERE id = '7856388b-56f2-4616-8260-9a2eb11cb061';

-- Fix Blocked Drainage project: bid is 700,000, held is 1,400,000
UPDATE escrow_accounts 
SET 
  held_amount = 700000,
  total_amount = 700000,
  updated_at = now()
WHERE id = '2d34d1b3-4af2-4a5d-bc59-0910e6a78893';

-- Create a function to validate escrow funding and prevent overfunding
CREATE OR REPLACE FUNCTION public.validate_escrow_funding()
RETURNS TRIGGER AS $$
DECLARE
  project_budget numeric;
BEGIN
  -- Get the project budget (contractor bid amount)
  SELECT budget INTO project_budget
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Prevent held_amount from exceeding project budget
  IF NEW.held_amount > COALESCE(project_budget, NEW.total_amount) THEN
    RAISE EXCEPTION 'Cannot overfund escrow. Maximum allowed: %, Attempted: %', 
      COALESCE(project_budget, NEW.total_amount), NEW.held_amount;
  END IF;
  
  -- Ensure total_amount matches project budget
  IF project_budget IS NOT NULL AND NEW.total_amount != project_budget THEN
    NEW.total_amount := project_budget;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce validation on insert and update
DROP TRIGGER IF EXISTS enforce_escrow_funding_limit ON escrow_accounts;
CREATE TRIGGER enforce_escrow_funding_limit
  BEFORE INSERT OR UPDATE ON escrow_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_escrow_funding();