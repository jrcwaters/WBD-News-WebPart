import { INewsItem } from '../models/INewsItem';
import { INewsService, INewsQuery, NewsSource } from './INewsService';

/**
 * Built-in sample content. Mirrors the stories in the design spec so the web part
 * renders a faithful preview in the SharePoint workbench (and anywhere the live
 * Search roll-up is turned off). Content is keyed by source so switching the
 * "News source" property changes the stories, exactly as it would in production.
 */
const SAMPLE: Record<NewsSource, INewsItem[]> = {
  firmwide: [
    {
      id: 'firm-1',
      title: 'Firm launches AI enablement programme',
      summary:
        'A firm-wide programme to put practical AI tools in the hands of every team — starting with governed Copilot rollout, agent pilots and hands-on training across all offices.',
      category: 'Firm-wide',
      tone: 'firm',
      author: 'Internal Communications',
      meta: 'Today, 08:00 · 3 min read'
    },
    {
      id: 'firm-2',
      title: 'September trainee cohort — welcome events announced',
      summary: 'Dates, locations and buddy assignments for the incoming trainee intake are now confirmed.',
      category: 'People',
      tone: 'people',
      author: 'Early Careers',
      meta: 'Friday'
    },
    {
      id: 'firm-3',
      title: 'Responsible business report published',
      summary: 'Our annual review of community, environmental and pro bono commitments is now available to read.',
      category: 'Responsible business',
      tone: 'default',
      author: 'Internal Comms',
      meta: 'Thursday'
    },
    {
      id: 'firm-4',
      title: 'New matter inception process goes live in August',
      summary: 'A streamlined intake and conflicts flow replaces the current forms. Training sessions open next week.',
      category: 'Operations',
      tone: 'firm',
      author: 'Business Services',
      meta: 'Wednesday'
    },
    {
      id: 'firm-5',
      title: 'Q3 all-hands: register now',
      summary: 'Join the leadership team for the quarterly update. In person in every hub, or online.',
      category: 'Firm-wide',
      tone: 'default',
      author: 'Internal Communications',
      meta: 'Tuesday'
    },
    {
      id: 'firm-6',
      title: 'Wellbeing week returns next month',
      summary: 'A full programme of sessions, walks and talks to support your health at work and at home.',
      category: 'People',
      tone: 'people',
      author: 'HR',
      meta: 'Monday'
    }
  ],
  office: [
    {
      id: 'office-1',
      title: 'Summer social — Quayside, Thursday 30 July',
      summary: 'Join the Newcastle team for drinks and food on the Quayside. All welcome — bring a plus-one.',
      category: 'Social',
      tone: 'office',
      author: 'Office Management',
      meta: 'Today'
    },
    {
      id: 'office-2',
      title: 'Floor 3 refurbishment starts next month',
      summary: 'Phased works begin in August. Affected teams will be relocated to Floor 5 — details to follow.',
      category: 'Facilities',
      tone: 'office',
      author: 'Facilities',
      meta: 'Friday'
    },
    {
      id: 'office-3',
      title: 'Bake sale raises £640 for local hospice',
      summary: 'Thank you to everyone who baked, bought and donated. A brilliant turnout for a great cause.',
      category: 'CSR',
      tone: 'people',
      author: 'CSR Committee',
      meta: 'Thursday'
    },
    {
      id: 'office-4',
      title: 'New starters: welcome to the Newcastle team',
      summary: 'Say hello to the six colleagues joining us across advisory, disputes and business services this month.',
      category: 'People',
      tone: 'people',
      author: 'Office Management',
      meta: 'Wednesday'
    },
    {
      id: 'office-5',
      title: 'Cycle-to-work scheme reopens for applications',
      summary: 'Spread the cost of a new bike and accessories. The window closes at the end of the month.',
      category: 'Facilities',
      tone: 'office',
      author: 'Facilities',
      meta: 'Tuesday'
    },
    {
      id: 'office-6',
      title: 'Parking changes from August',
      summary: 'A new booking system goes live for the basement car park. Register your vehicle before the switchover.',
      category: 'Facilities',
      tone: 'office',
      author: 'Facilities',
      meta: 'Monday'
    }
  ],
  practice: [
    {
      id: 'prac-1',
      title: 'New consumer duty guidance — what it means for our clients',
      summary: 'The Knowledge team unpacks the latest regulator guidance and the practical steps clients should take now.',
      category: 'Regulatory',
      tone: 'firm',
      author: 'Knowledge Team',
      meta: 'Today'
    },
    {
      id: 'prac-2',
      title: 'Commercial team recognised in latest legal directory rankings',
      summary: 'A strong set of results across our core practice areas, with several individual ranking uplifts.',
      category: 'Win',
      tone: 'default',
      author: 'Marketing',
      meta: 'Yesterday'
    },
    {
      id: 'prac-3',
      title: 'Welcome to three new associates joining the group',
      summary: 'Our commercial practice grows again with three associate hires across contracts and technology.',
      category: 'Team',
      tone: 'people',
      author: 'Practice Management',
      meta: 'Monday'
    },
    {
      id: 'prac-4',
      title: 'Lunch & learn: drafting under the new framework',
      summary: 'A practical session on drafting and negotiating under the updated framework. Lunch provided.',
      category: 'Training',
      tone: 'firm',
      author: 'L&D',
      meta: 'Last week'
    },
    {
      id: 'prac-5',
      title: 'Client alert: changes to reporting thresholds',
      summary: 'What the revised thresholds mean in practice, and the template client note you can reuse.',
      category: 'Regulatory',
      tone: 'firm',
      author: 'Knowledge Team',
      meta: 'Last week'
    },
    {
      id: 'prac-6',
      title: 'Precedent bank refresh now live',
      summary: 'Updated precedents and checklists are now published to the group workspace.',
      category: 'Knowledge',
      tone: 'default',
      author: 'Knowledge Team',
      meta: 'Last week'
    }
  ],
  // 'custom' has no fixed roll-up; show a firm-wide blend as a stand-in preview.
  custom: []
};

// Build the 'custom' preview from a blend of the other sources.
SAMPLE.custom = [SAMPLE.firmwide[0], SAMPLE.practice[0], SAMPLE.office[0], SAMPLE.firmwide[1], SAMPLE.practice[2], SAMPLE.office[2]];

export class MockNewsService implements INewsService {
  public getNews(query: INewsQuery): Promise<INewsItem[]> {
    const pool = SAMPLE[query.source] || SAMPLE.firmwide;
    const count = Math.max(1, query.count || pool.length);
    return Promise.resolve(pool.slice(0, count));
  }
}
