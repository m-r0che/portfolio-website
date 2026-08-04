// Personal portfolio copy. First person, understated, craft-minded.
// Facts sourced from the CV; keep them in step with it.
// (The 3D /workshop route uses ./projects separately.)

export const intro = {
  name: 'Matt Roche',
  tagline: 'Product engineer. Ten years in software & start-ups.',
  paragraphs: [
    "Most recently founding product engineer at SalesAPE, building lead qualification AI agents from 0 to 400+ customers, series A funding, and $10 million ARR.",
    "I'm also building a link-in-bio product, tinkering on various projects. I have a first-class Masters in Mathematics."
  ]
};

export interface Entry {
  name: string;
  role?: string;
  blurb: string;
  href?: string;
  /** Text shown for the link instead of the bare URL. */
  hrefLabel?: string;
}

export const now: Entry[] = [
  {
    name: 'SalesAPE',
    role: 'Senior Product Engineer',
    blurb: 'Built the core agent system - production agents holding live sales conversations across web, email, SMS & WhatsApp. Built the training tools clients use to teach, test and trust their agents, cutting onboarding from a month to under a week. Now building Abi, the self-serve agent.',
    href: 'https://salesape.ai',
    hrefLabel: 'salesape.ai'
  },
  {
    name: 'SuperStack',
    role: 'Founder',
    blurb: 'A link-in-bio powered by testimonials, for fitness instructors, studios & small businesses. Built the product and grew it to 100+ customers.',
    href: 'https://superst.ac',
    hrefLabel: 'superst.ac'
  },
  {
    name: 'Hyper Product Club',
    role: 'Founder',
    blurb: 'Product & engineering consulting for early-stage companies - customer discovery, growth experiments, and building alongside small teams.',
    href: 'https://hyperproduct.club',
    hrefLabel: 'hyperproduct.club'
  }
];

export const previously: Entry[] = [
  {
    name: 'Move Technologies / MoveGB',
    role: 'Product Lead',
    blurb: 'A fitness marketplace turned B2B2C platform. Joined as a software engineer and data analyst, became product lead - we captured a third of the UK leisure centre market and made the Deloitte Fast50.',
    href: 'https://get.movegb.com/',
    hrefLabel: 'movegb.com'
  },
  {
    name: 'Wriggle',
    role: 'Software Engineer',
    blurb: 'A local food & drink marketplace. Built their website.'
  }
];

export const projects: Entry[] = [
  {
    name: 'Walle',
    blurb: "A palm-sized robot on an ESP32 - hold his face to talk, and speech streams back through OpenAI Realtime via a Cloudflare relay. He blinks, breathes, gets moody, and falls asleep with drifting Z's."
  },
  {
    name: 'Cage World Cup',
    blurb: 'A Nicolas Cage–themed World Cup sweepstake, for my mates.',
    href: 'https://cage.hyperproduct.club',
    hrefLabel: 'cage.hyperproduct.club'
  },
  {
    name: 'Botwars',
    blurb: 'A browser 3D battle game where Claude and GPT generate the bots - and their looks - from a plain-English description.',
    href: 'https://github.com/m-r0che/botwars',
    hrefLabel: 'github.com/m-r0che/botwars'
  }
];

export const writing = {
  name: 'Software as Artisanship',
  blurb: 'Occasional writing on building software with care.',
  // TODO(matt): confirm the Substack URL.
  href: 'https://mattroche.substack.com/',
  hrefLabel: 'on Substack'
};

export const links = {
  email: 'matt@hyperproduct.club',
  github: 'https://github.com/m-r0che',
  linkedin: 'https://uk.linkedin.com/in/matt-roche-77b529101',
  superstack: 'https://superst.ac/matt'
};
