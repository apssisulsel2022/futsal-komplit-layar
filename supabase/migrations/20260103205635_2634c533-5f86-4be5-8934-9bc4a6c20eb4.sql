-- Update foreign keys to SET NULL on delete to allow user deletion

-- events.created_by
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE events
  ADD CONSTRAINT events_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- honors.verified_by
ALTER TABLE honors 
  DROP CONSTRAINT IF EXISTS honors_verified_by_fkey;
ALTER TABLE honors
  ADD CONSTRAINT honors_verified_by_fkey 
    FOREIGN KEY (verified_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- profiles.approved_by
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_approved_by_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- audit_logs.actor_id
ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- evaluations.referee_id
ALTER TABLE evaluations 
  DROP CONSTRAINT IF EXISTS evaluations_referee_id_fkey;
ALTER TABLE evaluations
  ADD CONSTRAINT evaluations_referee_id_fkey 
    FOREIGN KEY (referee_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- evaluations.evaluator_id
ALTER TABLE evaluations 
  DROP CONSTRAINT IF EXISTS evaluations_evaluator_id_fkey;
ALTER TABLE evaluations
  ADD CONSTRAINT evaluations_evaluator_id_fkey 
    FOREIGN KEY (evaluator_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- evaluations.event_id
ALTER TABLE evaluations 
  DROP CONSTRAINT IF EXISTS evaluations_event_id_fkey;
ALTER TABLE evaluations
  ADD CONSTRAINT evaluations_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;