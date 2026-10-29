// Copyright Ayers Electronics Inc. All rights reserved.
import { equal, exactKeys, requireValue } from "./ci-execution-inputs-schema.mjs";

const names = (value) =>
  Array.isArray(value) &&
  value.every((name) => typeof name === "string" && name.length > 0 && name.length <= 200) &&
  new Set(value).size === value.length;

export function validateMainTopology(topology, freshJobs) {
  requireValue(
    exactKeys(topology, ["aggregateJob", "reusedJobs", "controlJobs"]) &&
      names(freshJobs) &&
      freshJobs.length > 0 &&
      names(topology.reusedJobs) &&
      topology.reusedJobs.length > 0 &&
      names(topology.controlJobs) &&
      names([topology.aggregateJob]) &&
      names([...freshJobs, ...topology.reusedJobs, ...topology.controlJobs, topology.aggregateJob]),
    "Missing exact fresh-main job topology",
  );
}

export function checkMainRun(run) {
  requireValue(
    run.head_branch === "main" && run.status === "in_progress" && run.conclusion === null,
    "Fresh-main run is not the active ordinary-main workflow",
  );
}

export function checkMainJobs(jobs, freshJobs, topology) {
  validateMainTopology(topology, freshJobs);
  requireValue(
    equal(
      jobs.map((job) => job.name).sort(),
      [...freshJobs, ...topology.reusedJobs, ...topology.controlJobs, topology.aggregateJob].sort(),
    ) &&
      jobs.every((job) => {
        if (job.name === topology.aggregateJob)
          return ["queued", "in_progress"].includes(job.status) && job.conclusion === null;
        return job.status === "completed" && job.conclusion === (freshJobs.includes(job.name) ? "success" : "skipped");
      }),
    "Fresh-main roles are incomplete, changed or unsuccessful",
  );
}
