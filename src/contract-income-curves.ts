import type { IncomeCurve } from './contract-income';

/** Reference median workload of all CHR premium offers, including the authored trust-2 pool. */
export const CERBERUS_PREMIUM_CURVE: readonly [number, number] = [914612, 915040];

/** Fixed day-0–15 public-board workload reference; regenerate with tests/run-income-audit.mjs --fit.
 * Ordinary: median-low/high, cut, median-low/high, cut, median-low/high. Single band: median-low/high.
 * Median plateaus preserve the median of discrete/even samples; equal workloads never get random fees.
 * Each provider remains independent, even where targets or reputation recognition are shared.
 */
export const CONTRACT_INCOME_CURVES: Readonly<Record<string, IncomeCurve>> = {
  'balor-advanced-materials': [310310, 310310, 367851.5, 557776, 561412, 775769.5, 898535, 898535],
  'bruckner-field-services': [40326, 40326, 58928, 192848, 192848, 371308.5, 502520, 502520],
  'cerberus-human-resources': [253002, 253002, 258172, 478200, 478350, 895195.5, 1028497, 1030234],
  'cinderhook-refining-houses': [402264, 402264, 406260, 474192, 474192, 521616, 562950, 562950],
  'covenant-remnants': [234000, 236751, 251692, 308907, 308907, 485050, 571266, 595404],
  'daedalus-systems': [116369, 116369, 209702, 307017, 307291, 449665, 624393, 624470],
  'estella-defence-force': [54780, 54780, 192142.5, 388806, 388806, 568424, 754491, 761720],
  'estella-government': [193476, 193476, 199415, 503860, 503860, 716099, 936806, 936806],
  'estella-institute-of-planetology': [173600, 173600, 232667, 471120, 471120, 698705, 792258, 792258],
  'glitterfield-miners': [17205, 17205, 17716.5, 163831, 163831, 352425, 367225, 367350],
  'halloran-smelting-house': [93160, 93160, 95215, 209024, 209024, 513730, 520998, 520998],
  'hartwell-labor-exchange': [95940, 95940, 104690.5, 187200, 188632, 409351.5, 470250, 470250],
  'hartwell-machinery-brokers': [139564, 139564, 246015, 371644, 371700, 493145, 554264, 554320],
  'hartwell-shipping-companies': [163254, 163254, 262371, 372052, 372052, 508869, 617760, 617760],
  'house-alvares': [159468, 161460, 253054, 395760, 396336, 505847, 568293, 573852],
  'house-mendes': [71916, 71916, 87743.5, 105570, 105570, 221175, 234366, 234366],
  'house-nunes': [61506, 61506, 65047.5, 182022, 182022, 239967, 277992, 280953],
  'kisaragi-harmony-yards': [300672, 300672],
  'kisaragi-yards-estella': [206890, 206890, 260814, 318716, 318716, 413553, 684536, 684536],
  'merren-conservatory': [62196, 62196, 135423.5, 360149, 360149, 587340, 758801, 758801],
  'new-canaan-miners-mutual': [12699, 12699, 13557, 116034, 116034, 306741, 339099, 340452],
  'oathmark-accord-authority': [66411, 68766, 71744, 159850, 159850, 297824.5, 327031, 327031],
  'pike-mining-companies': [81780, 81780, 86448, 92308, 92308, 334176, 492752, 492752],
  'roadstead-export-brokers': [150773, 150773, 235966.5, 342596, 342596, 408538.5, 441945, 441945],
  'steel-combine': [238810, 238810],
  'svarog-yard-company': [77423, 77423, 81336.5, 106737, 107865, 344871, 353064, 358380],
  'voss-heinkel-metricwerke': [251826, 252531],
  'wells-noble-houses': [101530, 101530, 153753, 264792, 265221, 407852, 495824, 496617],
};
