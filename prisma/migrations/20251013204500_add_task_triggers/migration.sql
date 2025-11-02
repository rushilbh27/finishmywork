-- Create trigger function to notify task events
CREATE OR REPLACE FUNCTION notify_task_event() RETURNS trigger AS $$
DECLARE
  payload json;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    payload = json_build_object('type', 'task:created', 'task', row_to_json(NEW));
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
      IF (NEW.status = 'IN_PROGRESS') THEN
        payload = json_build_object('type', 'task:accepted', 'task', row_to_json(NEW));
      ELSIF (NEW.status = 'CANCELLED') THEN
        payload = json_build_object('type', 'task:cancelled', 'task', row_to_json(NEW));
      ELSIF (NEW.status = 'COMPLETED') THEN
        payload = json_build_object('type', 'task:completed', 'task', row_to_json(NEW));
      ELSE
        payload = json_build_object('type', 'task:updated', 'task', row_to_json(NEW));
      END IF;
    ELSE
      payload = json_build_object('type', 'task:updated', 'task', row_to_json(NEW));
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    payload = json_build_object('type', 'task:deleted', 'task', row_to_json(OLD));
  END IF;

  PERFORM pg_notify('task_events', payload::text);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tasks table
DROP TRIGGER IF EXISTS task_events_trigger ON tasks;
CREATE TRIGGER task_events_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION notify_task_event();
