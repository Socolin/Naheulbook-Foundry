import {Job, JobDictionary} from './models/job.model';
import {NaheulbookHttpApi} from './naheulbook-http-api';
import {JobResponse, OriginResponse, SkillResponse} from './api/responses';
import {Origin} from './models/origin.model';
import {Skill, SkillDictionary} from './models/skill.model';

export class NaheulbookDataApi {
    private origins?: Origin[];
    private jobs?: Job[];
    private jobsById?: JobDictionary;
    private skillsById?: SkillDictionary;

    constructor(
        private readonly naheulbookHttpApi: NaheulbookHttpApi
    ) {
    }

    async getOrigins(): Promise<Origin[]> {
        if (this.origins !== undefined)
            return this.origins;
        const originsResponses = await this.naheulbookHttpApi.get<OriginResponse[]>('/api/v2/origins');
        const skillsById = await this.getSkillsById();
        this.origins = originsResponses.map(response => Origin.fromResponse(response, skillsById));
        return this.origins;
    }

    async getJobsById(): Promise<JobDictionary> {
        if (this.jobsById !== undefined)
            return this.jobsById;
        let jobs = await this.getJobs();
        this.jobsById = jobs.reduce((dict, job) => {
            dict[job.id] = job;
            return dict
        }, {} as JobDictionary);
    }

    async getJobs(): Promise<Job[]> {
        if (this.jobs !== undefined)
            return this.jobs;
        const jobsResponses = await this.naheulbookHttpApi.get<JobResponse[]>('/api/v2/jobs');
        const skillsById = await this.getSkillsById();
        this.jobs = jobsResponses.map(response => Job.fromResponse(response, skillsById));
        return this.jobs;
    }

    async getSkillsById(): Promise<SkillDictionary> {
        if (this.skillsById !== undefined)
            return this.skillsById;
        const skillsResponses = await this.naheulbookHttpApi.get<SkillResponse[]>('/api/v2/skills');
        this.skillsById = skillsResponses.reduce((dict, response) => {
            dict[response.id] = Skill.fromResponse(response);
            return dict
        }, {} as SkillDictionary);
        return this.skillsById;
    }
}
