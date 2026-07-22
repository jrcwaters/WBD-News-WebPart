import { INewsItem } from '../models/INewsItem';
import { INewsService, INewsQuery, NewsSource } from './INewsService';

/**
 * Built-in sample content. Mirrors the card treatment in the design spec so the web
 * part renders a faithful preview in the SharePoint workbench (and anywhere the live
 * Search roll-up is turned off). Content is keyed by source so switching the "News
 * source" property changes the stories, exactly as it would in production.
 */
const SAMPLE: Record<NewsSource, INewsItem[]> = {
  // "Growth @ WBD" — strategy, firm and business updates.
  growth: [
    {
      id: 'growth-1',
      title: 'Firm launches AI enablement programme',
      summary:
        'A firm-wide programme to put practical AI tools in the hands of every team — starting with governed Copilot rollout, agent pilots and hands-on training across all offices.',
      category: 'Strategy',
      tone: 'firm',
      author: 'Internal Communications',
      meta: 'Today, 08:00 · 3 min read'
    },
    {
      id: 'growth-2',
      title: 'Responsible business report published',
      summary: 'Our annual review of community, environmental and pro bono commitments is now available to read.',
      category: 'Responsible business',
      tone: 'default',
      author: 'Internal Comms',
      meta: 'Thursday'
    },
    {
      id: 'growth-3',
      title: 'New matter inception process goes live in August',
      summary: 'A streamlined intake and conflicts flow replaces the current forms. Training sessions open next week.',
      category: 'Operations',
      tone: 'firm',
      author: 'Business Services',
      meta: 'Wednesday'
    },
    {
      id: 'growth-4',
      title: 'New consumer duty guidance — what it means for our clients',
      summary: 'The Knowledge team unpacks the latest regulator guidance and the practical steps clients should take now.',
      category: 'Regulatory',
      tone: 'firm',
      author: 'Knowledge Team',
      meta: 'Tuesday'
    },
    {
      id: 'growth-5',
      title: 'Q3 all-hands: register now',
      summary: 'Join the leadership team for the quarterly update. In person in every hub, or online.',
      category: 'Firm-wide',
      tone: 'default',
      author: 'Internal Communications',
      meta: 'Monday'
    },
    {
      id: 'growth-6',
      title: 'Commercial team recognised in latest legal directory rankings',
      summary: 'A strong set of results across our core practice areas, with several individual ranking uplifts.',
      category: 'Win',
      tone: 'default',
      author: 'Marketing',
      meta: 'Last week'
    }
  ],
  // "You & WBD" — people, culture and office life.
  you: [
    {
      id: 'you-1',
      title: 'September trainee cohort — welcome events announced',
      summary: 'Dates, locations and buddy assignments for the incoming trainee intake are now confirmed.',
      category: 'People',
      tone: 'people',
      author: 'Early Careers',
      meta: 'Today'
    },
    {
      id: 'you-2',
      title: 'Wellbeing week returns next month',
      summary: 'A full programme of sessions, walks and talks to support your health at work and at home.',
      category: 'Wellbeing',
      tone: 'people',
      author: 'HR',
      meta: 'Friday'
    },
    {
      id: 'you-3',
      title: 'Summer social — Quayside, Thursday 30 July',
      summary: 'Join the team for drinks and food on the Quayside. All welcome — bring a plus-one.',
      category: 'Social',
      tone: 'office',
      author: 'Office Management',
      meta: 'Thursday'
    },
    {
      id: 'you-4',
      title: 'Bake sale raises £640 for local hospice',
      summary: 'Thank you to everyone who baked, bought and donated. A brilliant turnout for a great cause.',
      category: 'CSR',
      tone: 'people',
      author: 'CSR Committee',
      meta: 'Wednesday'
    },
    {
      id: 'you-5',
      title: 'Welcome to our new starters this month',
      summary: 'Say hello to the colleagues joining us across advisory, disputes and business services.',
      category: 'People',
      tone: 'people',
      author: 'People Team',
      meta: 'Tuesday'
    },
    {
      id: 'you-6',
      title: 'Cycle-to-work scheme reopens for applications',
      summary: 'Spread the cost of a new bike and accessories. The window closes at the end of the month.',
      category: 'Benefits',
      tone: 'office',
      author: 'Facilities',
      meta: 'Monday'
    }
  ],
  // 'all', 'picker' and 'custom' are built below from a blend of the named feeds.
  all: [],
  picker: [],
  custom: []
};

SAMPLE.all = [
  SAMPLE.growth[0],
  SAMPLE.you[0],
  SAMPLE.growth[1],
  SAMPLE.you[2],
  SAMPLE.growth[3],
  SAMPLE.you[1]
];
SAMPLE.custom = SAMPLE.all;
SAMPLE.picker = SAMPLE.all;

export class MockNewsService implements INewsService {
  public getNews(query: INewsQuery): Promise<INewsItem[]> {
    const pool = SAMPLE[query.source] || SAMPLE.all;
    const count = Math.max(1, query.count || pool.length);
    return Promise.resolve(pool.slice(0, count));
  }
}
