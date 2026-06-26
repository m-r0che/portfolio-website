// Personal portfolio copy. First person, understated, craft-minded.
// (The 3D /workshop route uses ./projects separately.)

export const intro = {
  name: 'Matt Roche',
  tagline: 'A product builder in London.',
  paragraphs: [
    "I make software the way I'd make anything worth keeping — by hand, in the open, and built to outlast the hype around it.",
    'Right now that means AI products at SalesAPE. Before that, fitness and property tech. Mostly I turn fuzzy ideas into things people actually use, and I tend to show up wherever there is a hard product problem and a small team to solve it with.'
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
    role: 'Head of Product Prototyping',
    blurb: 'AI sales agents that can hold a real conversation — and the tooling to prototype and ship them fast.',
    href: 'https://salesape.ai',
    hrefLabel: 'salesape.ai'
  },
  {
    name: 'SuperStack',
    role: 'Co-founder, with Tom Teague',
    blurb: 'A link-in-bio for businesses, powered by testimonials — proof right where people decide.',
    href: 'https://superst.ac',
    hrefLabel: 'superst.ac'
  },
  {
    name: 'Hyper Product Club',
    role: 'Product lead',
    blurb: 'Teaching 0→1 product building, and taking on a few hands-on engagements a year.',
    href: 'https://hyperproduct.club',
    hrefLabel: 'hyperproduct.club'
  }
];

export const previously: Entry[] = [
  {
    name: 'Move Technologies',
    role: 'Product advisor & builder',
    blurb: 'Helped shape product for the team behind the UK fitness marketplace.'
  },
  {
    name: 'MoveGB',
    role: 'Product manager',
    blurb: "The UK's largest fitness marketplace — a few good years spent getting people off the sofa."
  }
];

export const projects: Entry[] = [
  {
    name: 'Botwars',
    blurb: 'A browser 3D battle game where Claude and GPT generate the bots — and their looks — from a plain-English description.',
    href: 'https://github.com/m-r0che/botwars',
    hrefLabel: 'github.com/m-r0che/botwars'
  },
  {
    name: 'Cage World Cup',
    blurb: 'A Nicolas Cage–themed World Cup sweepstake, lovingly over-engineered on a weekend.',
    href: 'https://cage.hyperproduct.club',
    hrefLabel: 'cage.hyperproduct.club'
  }
];

export const writing = {
  name: 'Software as Artisanship',
  blurb: 'Occasional notes on building software like a craft.',
  // TODO(matt): confirm the Substack URL.
  href: 'https://substack.com',
  hrefLabel: 'on Substack'
};

export const links = {
  email: 'matt.roche@salesape.ai',
  github: 'https://github.com/m-r0che',
  linkedin: 'https://uk.linkedin.com/in/matt-roche-77b529101',
  superstack: 'https://superst.ac/matt'
};
