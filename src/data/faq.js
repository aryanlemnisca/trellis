/*
 * Questions people (and answer engines) ask, answered first-sentence-first.
 * Every answer restates only what the page already says; nothing new is claimed.
 * Rendered visibly in sections/Faq.astro and as FAQPage JSON-LD in seo/Seo.astro.
 */
export const faq = [
  {
    q: 'What is Trellis?',
    a: 'Trellis is a suite of bioprocessing tools that recommends the design of experiment (DoE), builds protocols, ingests your experimental data and recommends the next design space. It helps you reach a controllable bioprocess and scale up faster, with fewer runs.',
  },
  {
    q: 'How does Trellis work?',
    a: 'Trellis works as a loop. It recommends a design of experiment and builds the protocols, you run the experiments in your lab, and Trellis ingests the results and recommends the next design space. Trellis combines scientific reasoning with machine learning: AI orchestrates a set of agents that build your models, and those models account for bioprocess mechanics that most dry-lab tools leave out.',
  },
  {
    q: 'How many parameters can Trellis handle?',
    a: 'Trellis handles design spaces with up to 50 parameters. It explores the entire space with every parameter in play at the same time, until it reaches the true global optimum.',
  },
  {
    q: 'How does Trellis compare with OFAT and standard DoE?',
    a: 'In a benchmark on the same virtual 12-factor CHO fed-batch process, Trellis reached effectively the full known optimum, while DoE plateaued near 77% and OFAT near 50%. OFAT searches locally and DoE spreads broadly, wasting runs far from the optimum. Trellis explores uncertain regions and concentrates where better performance is most likely.',
  },
  {
    q: 'Why is bioprocess design so hard for scientists?',
    a: 'Bioprocessing has more possibilities than any one mind can hold. A process with 12 factors at three levels already has 531,441 combinations, and scientists are still left with trial and error, experience and heaps of data.',
  },
  {
    q: 'Is Trellis ready for regulators?',
    a: 'Trellis makes its reasoning explicit, explainable, computable and testable, which makes its recommendations easier to defend before regulators.',
  },
  {
    q: 'How do I get started with Trellis?',
    a: 'Book a demo using the form at the bottom of this page. Tell Trellis your target response, your run budget and your setup, and it selects the sampling methodology and objective and recommends the DoE across the entire design space.',
  },
];
