import type { MaintenanceShopCopy } from './shops';

/** Stage 5 landmarks: existing branches and operators, not new dealerships. */
export const ELITE_COPY: Readonly<Record<string, MaintenanceShopCopy & { directorySummary: string }>> = {
  'estella-iii-high-tech-city': {
    directorySummary: 'Precision diagnostics, the most demanding rig repairs and Grade A–D equipment at Rochefort.',
    profileBlurb: 'Atelier du Méridien occupies a low inspection hall between the city’s assembly buildings. Behind its glazed partition, reference bars rest in fitted drawers and a stripped converter waits beside a carefully supported section of rig frame. Chief metrologist [person]Lucile Masson[/person] is comparing two measurements taken by different hands. She finishes the comparison, signs both sheets and brings a chair to your side of the drawing table.',
    levelBlurb: 'Complete rig diagnosis and repair capability, precision structural and core work, and Grade A–D replacement stock',
    diagnosisBlurb: '“A useful measurement is one another person can reproduce.” [person]Lucile[/person] turns the paired sheets toward you. “We’ll examine every installed system, including the structure and core assemblies, and trace the findings back to their reference checks. You receive the diagnosis and the available work before authorizing a repair.”',
    serviceBlurb: '“Choose the systems and we’ll restore their protection and working adjustments.” [person]Lucile[/person] lays a service schedule over the assembly drawing. “The final readings are taken after everything is fitted and settled. That is the condition in which you will fly it.”',
    repairsBlurb: '“Our structural and core teams can undertake the most demanding repairs on your rig.” [person]Lucile[/person] separates a reconstruction drawing from an exchange specification. “For a repair, we restore and verify the assembly. For a replacement, we fit the quoted grade and check its interfaces. A Total failure calls for replacement; the estimate makes that distinction.”',
  },
  'estella-via-drydock': {
    directorySummary: 'SSC reconstruction specialists: complete repair capability and Grade A–D equipment at Svarog Shipyard.',
    profileBlurb: 'SSC Reconstruction Works occupies a through-berth on SSC’s shared service spine. Numbered lifting beams hang above the work positions; along the far wall, the tenant builders’ separate signs overlook their own entrances. Repair superintendent [person]Iryna Sokol[/person] follows a suspended frame with two fingers raised, then closes her hand as it reaches its supports. Only when the slings slacken does she come down to the intake rail.',
    levelBlurb: 'Complete rig diagnosis and repair capability with heavy structural fixtures, specialist core work and Grade A–D stock',
    diagnosisBlurb: '“We start with the rig as it arrived, then test the assemblies in their working positions.” [person]Iryna[/person] marks the occupied berth on the service plan. “Structures, powertrain, controls and installed equipment all go through the inspection. You get one report and the work choices for the whole job.”',
    serviceBlurb: '“The berth stays assigned to your rig while the service teams work through it.” [person]Iryna[/person] clips the selected systems to the berth board. “They renew the protection, set the clearances and hand each system over with its checks complete.”',
    repairsBlurb: '“We can support the frame through reconstruction and carry out the most demanding core and electrical repairs.” [person]Iryna[/person] indicates the lifting beams and the enclosed workrooms beyond them. “The authorized repair determines the fixtures and specialists we bring in. If an assembly has failed completely, we fit the quoted replacement instead. The release checks cover the finished rig.”',
  },
};
