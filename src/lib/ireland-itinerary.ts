// Post metadata for the Ireland 2011 photo reconstruction. The photos
// themselves live in the source HTML the user assembled and are pulled out in
// the browser at import time (they're far too large to commit); this module
// only carries the small, authored parts: which day maps to which post, the
// title/date/location, and a short factual lead built from that day's beats.
//
// `day` matches the "Day N" label in the source file. Leads are deliberately
// spare — drawn from the day's timeline, with nothing invented — and the posts
// are imported as drafts so the voice can be reviewed before publishing.

export interface ItineraryPost {
  day: number;
  title: string;
  dateISO: string; // noon local, so entries sort chronologically within the trip
  tags: string[];
  location: { lat: number; lng: number; label: string } | null;
  lead: string[]; // paragraphs
}

const T = ["travel", "ireland"];

export const IRELAND_ITINERARY: ItineraryPost[] = [
  {
    day: 2,
    title: "Landing in Dublin",
    dateISO: "2011-10-12T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    lead: [
      "We landed at Dublin Airport just after half eight in the morning and spent the better part of four hours sorting out the car. The first walk into the city was all dark stone and iron railings, with a plaque or two worth stopping for.",
      "That night we found the Brazen Head, pouring since 1198, then wandered past Christ Church Cathedral and the Olympia Theatre lit up for the evening.",
    ],
  },
  {
    day: 3,
    title: "A Day in Dublin",
    dateISO: "2011-10-13T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    lead: [
      "A full day in Dublin. We took the Viking Splash Tour in the amphibious yellow truck, horned helmets and all, out to Grand Canal Dock and around the Georgian doors of Merrion Square.",
      "The evening went to jeweller's windows, a Fabergé counter, and a few pints, with a floodlit church tower on the walk back.",
    ],
  },
  {
    day: 4,
    title: "Guinness, then South to Kilkenny",
    dateISO: "2011-10-14T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    lead: [
      "The Guinness Storehouse took the afternoon, from the atrium and the cooperage up to the Gravity Bar for the view over the city. Downstairs, Molly Malone and her barrow, and a Celtic ring photographed on the hand.",
      "Then a long drive south in the dark, into Kilkenny just before midnight.",
    ],
  },
  {
    day: 5,
    title: "Kilkenny on Foot",
    dateISO: "2011-10-15T12:00:00Z",
    tags: T,
    location: { lat: 52.6477, lng: -7.2561, label: "Kilkenny, Ireland" },
    lead: [
      "Kilkenny on foot. The Tholsel clock tower on the High Street, Kilkenny Castle across the River Nore, and a handstand on the river wall.",
      "We wound through the medieval lanes to St Francis Abbey inside the brewery grounds, and finished at the Smithwick's Experience, where the ale is poured where it's brewed.",
    ],
  },
  {
    day: 6,
    title: "Cahir, Blarney, and on to Cork",
    dateISO: "2011-10-16T12:00:00Z",
    tags: T,
    location: { lat: 51.9293, lng: -8.5705, label: "Blarney, Ireland" },
    lead: [
      "Southwest through Tipperary, past parkland and a thatched cottage. Cahir Castle gave us a courtyard, stair passages, a trapdoor, and a bird sitting on the wall.",
      "Then Blarney, where we shot 263 photos in ninety minutes, the tightest burst of the trip. Cork by night.",
    ],
  },
  {
    day: 7,
    title: "Killarney in the Rain",
    dateISO: "2011-10-17T12:00:00Z",
    tags: T,
    location: { lat: 52.0599, lng: -9.5044, label: "Killarney, Ireland" },
    lead: [
      "A gentler day in Killarney: parkland with the mountains behind, a wooded lane and a footbridge over a stream deep in the national park, and St Mary's Cathedral in the rain.",
    ],
  },
  {
    day: 8,
    title: "Across the Shannon to the Burren",
    dateISO: "2011-10-18T12:00:00Z",
    tags: T,
    location: { lat: 53.05, lng: -9.22, label: "The Burren, Ireland" },
    lead: [
      "North out of Kerry through Castleisland and Listowel with the wipers going. At Tarbert we took the ferry across to Killimer and skipped the long way round through Limerick.",
      "The Burren met us with limestone pavement, dry-stone walls, and a great deal of Atlantic weather. A round tower and a ruined church stood against the last of the light.",
    ],
  },
  {
    day: 9,
    title: "Galway and the Cliffs of Moher",
    dateISO: "2011-10-19T12:00:00Z",
    tags: T,
    location: { lat: 52.9715, lng: -9.427, label: "Cliffs of Moher, Ireland" },
    lead: [
      "A morning in Galway, the shops and a handstand in the square, then south into Clare.",
      "The Cliffs of Moher had O'Brien's Tower out on the headland. There was another handstand, this one on the cliff edge, and then the warning sign.",
    ],
  },
  {
    day: 10,
    title: "Horses on the Beach",
    dateISO: "2011-10-20T12:00:00Z",
    tags: T,
    location: null,
    lead: [
      "We tacked up at the yard and rode out along the lanes, through wet fields and down onto the sand.",
      "Home past a castellated gate arch, to champagne on ice and strawberries back at the castle.",
    ],
  },
  {
    day: 11,
    title: "North to the Giant's Causeway",
    dateISO: "2011-10-21T12:00:00Z",
    tags: T,
    location: { lat: 55.2408, lng: -6.5116, label: "Giant's Causeway, Northern Ireland" },
    lead: [
      "A four-poster morning at the castle hotel: a gothic door, the blue dining room, a private chapel, and the formal gardens, 99 photos before we checked out.",
      "North through Donegal and Derry, and out to the Giant's Causeway straight into the sunset. That far north the light is gone by quarter past six.",
    ],
  },
  {
    day: 12,
    title: "The Road to Belfast",
    dateISO: "2011-10-22T12:00:00Z",
    tags: T,
    location: { lat: 54.5973, lng: -5.9301, label: "Belfast, Northern Ireland" },
    lead: [
      "A slow start in a lilac-walled guesthouse, then out under an arch of beech trees and south. A bus stop somewhere on the road, and Belfast after dark, up at the top of Botanic Avenue.",
    ],
  },
  {
    day: 13,
    title: "Back to Dublin",
    dateISO: "2011-10-23T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    lead: [
      "Out of County Down in the rain, past a hand-painted sign for the boarding kennels at Blackskull. We counted out the change and drove back to Dublin.",
      "Out along the bay at Sandymount and Irishtown, then settled into a hotel lounge for the last night.",
    ],
  },
  {
    day: 14,
    title: "The Hill of Tara",
    dateISO: "2011-10-24T12:00:00Z",
    tags: T,
    location: { lat: 53.5796, lng: -6.6118, label: "Hill of Tara, Ireland" },
    lead: [
      "Our guesthouse had 'Hill of Tara' etched into the garden door, which is where we went. Tara came in thick fog: the Lia Fáil, the statue of St Patrick, the ring-fort earthworks, sheep, and the graveyard.",
      "A last afternoon in a hotel bar, then out to the airport hotel.",
    ],
  },
];
