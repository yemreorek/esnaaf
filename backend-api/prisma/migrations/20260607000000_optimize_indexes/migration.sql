-- CreateIndex
CREATE INDEX "service_providers_city_idx" ON "service_providers"("city");

-- CreateIndex
CREATE INDEX "service_providers_is_approved_idx" ON "service_providers"("is_approved");

-- CreateIndex
CREATE INDEX "phone_reveal_logs_job_id_idx" ON "phone_reveal_logs"("job_id");

-- CreateIndex
CREATE INDEX "phone_reveal_logs_requester_id_idx" ON "phone_reveal_logs"("requester_id");

-- CreateIndex
CREATE INDEX "job_completions_job_id_idx" ON "job_completions"("job_id");

-- CreateIndex
CREATE INDEX "job_completions_provider_id_idx" ON "job_completions"("provider_id");

-- CreateIndex
CREATE INDEX "job_completions_seeker_id_idx" ON "job_completions"("seeker_id");

-- CreateIndex
CREATE INDEX "job_completions_status_idx" ON "job_completions"("status");

-- CreateIndex
CREATE INDEX "call_tasks_status_priority_created_at_idx" ON "call_tasks"("status", "priority", "created_at");

-- CreateIndex
CREATE INDEX "call_tasks_assigned_to_idx" ON "call_tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "call_tasks_job_completion_id_idx" ON "call_tasks"("job_completion_id");

-- CreateIndex
CREATE INDEX "call_tasks_due_at_idx" ON "call_tasks"("due_at");
