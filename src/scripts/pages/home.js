/* Scenes and behaviour that belong to the home page only. */
import { initHero } from '../sections/hero.js';
import { initBioprocess } from '../sections/bioprocess.js';
import { initScientist } from '../sections/scientist.js';
import { initWhat } from '../sections/what.js';
import { initColorFields } from '../sections/color-fields.js';
import { initWhy } from '../sections/why.js';
import { initCaseConvergence } from '../sections/case-convergence.js';
import { initScience } from '../sections/science.js';
import { initDemoForm } from '../sections/demo-form.js';

/* Order matches the original page: scenes first, then the colour washes, then the form. */
initHero();
initBioprocess();
initScientist();
initWhat();
initColorFields();
initWhy();
initCaseConvergence();
initScience();
initDemoForm();
