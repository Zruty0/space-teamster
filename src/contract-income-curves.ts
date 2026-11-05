import type { IncomeCurve } from './contract-income';

/** Reference median workload of all CHR premium offers, including the authored trust-2 pool. */
export const CERBERUS_PREMIUM_CURVE: readonly [number, number] = [914612, 915040];
export const DAEDALUS_PREMIUM_CURVE: readonly [number, number] = [424700, 424700];

/** Provider-wide fallback and retained programme/entrusted references; fits exclude important work.
 * Current ordinary local-market quotes use contract-income-origin-curves.ts instead.
 * Reproduce with tests/run-rollout-calibration.mjs; Covenant and GOV/Sahra use broader references.
 * Ordinary: median-low/high, cut, median-low/high, cut, median-low/high. Single band: median-low/high.
 * Median plateaus preserve the median of discrete/even samples; equal workloads never get random fees.
 * Each provider remains independent, even where targets or reputation recognition are shared.
 */
export const CONTRACT_INCOME_CURVES: Readonly<Record<string, IncomeCurve>> = {
  'balor-advanced-materials': [322436, 322585, 378047.5, 593538, 593538, 825592.5, 916344, 916630],
  'bruckner-field-services': [42075, 42075, 48796.5, 185772, 186200, 352346.5, 476800, 476800],
  'cerberus-human-resources': [253002, 253002, 258172, 478200, 478350, 895195.5, 1028497, 1030234],
  'cinderhook-refining-houses': [402264, 402264, 406260, 474192, 474192, 521616, 562950, 562950],
  'covenant-remnants': [353892, 353892, 419510.5, 474628, 474628, 571195, 616770, 616770],
  'daedalus-systems': [122460, 124020, 220734.5, 383326, 383326, 830567.5, 874692, 874692],
  'estella-defence-force': [54780, 54780, 165760, 473060, 473200, 532726, 805286, 805286],
  'estella-government': [98905, 98905, 232872, 535396, 535396, 843030, 971040, 971040],
  'estella-institute-of-planetology': [169905, 169905, 226113, 469140, 469140, 697174.5, 789659, 789659],
  'glitterfield-miners': [17205, 17205, 17716.5, 163831, 163831, 352425, 367225, 367350],
  'halloran-smelting-house': [93160, 93160, 95215, 209024, 209024, 513730, 520998, 520998],
  'hartwell-labor-exchange': [95940, 95940, 104690.5, 187200, 188632, 409351.5, 470250, 470250],
  'hartwell-machinery-brokers': [139564, 139564, 246015, 371644, 371700, 493145, 554264, 554320],
  'hartwell-shipping-companies': [163254, 163254, 262371, 372052, 372052, 508869, 617760, 617760],
  'house-alvares': [153527, 155112, 208034, 395760, 395760, 505847, 583488, 586527],
  'house-mendes': [68228, 68689, 70302.5, 83441, 83441, 107217, 111375, 113920],
  'house-nunes': [59496, 59496, 63553.5, 106860, 106860, 299367, 325707, 328338],
  'kisaragi-harmony-yards': [300672, 300672],
  'kisaragi-yards-estella': [206890, 206890, 260970, 320132, 320295, 415148.5, 719151, 721452],
  'merren-conservatory': [61912, 61912, 96314, 363457, 363457, 554674.5, 655424, 655424],
  'new-canaan-miners-mutual': [12699, 12699, 13557, 116034, 116034, 306741, 339099, 340452],
  'oathmark-accord-authority': [66411, 68766, 71744, 159850, 159850, 297824.5, 327031, 327031],
  'pike-mining-companies': [81780, 81780, 86448, 92308, 92308, 334176, 492752, 492752],
  'roadstead-export-brokers': [150773, 150773, 235966.5, 342596, 342596, 408538.5, 441945, 441945],
  'steel-combine': [238810, 238810],
  'svarog-yard-company': [77423, 77423, 81336.5, 106737, 107865, 344871, 353064, 358380],
  'voss-heinkel-metricwerke': [251826, 252531],
  'wells-noble-houses': [101530, 101530, 153753, 264792, 265221, 407852, 495824, 496617],
  'gaia-civilian-bookings': [195017, 195017, 206150, 503180, 503180, 726623.5, 808480, 809814],
  'dahai-civilian-bookings': [152740, 152740, 169252.5, 448140, 448140, 674582, 775520, 775557],
  'camps-civilian-bookings': [128940, 128940, 181688, 329392, 329392, 448096, 515120, 515120],
  'sahra-civilian-bookings': [76840, 76840, 122250.5, 199092, 199092, 352706.5, 469542, 469542],
  'weymark-independent-operators': [165528, 165528, 165621.5, 167244, 167244, 198462, 231420, 231420],
  'teamsters-guild': [13861, 13861, 58421.5, 194878, 194878, 348439, 500261, 500261],
};
