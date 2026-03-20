-- Add unique constraint on ai_tasks.task_code
CREATE UNIQUE INDEX IF NOT EXISTS ai_tasks_task_code_unique ON ai_tasks (task_code);

-- Add unique constraint on ai_function_config.function_name
CREATE UNIQUE INDEX IF NOT EXISTS ai_function_config_function_name_unique ON ai_function_config (function_name);