import "server-only";

// Hand-written journal entries from the tail end of the 2017 New Zealand trip
// (Oct 19–26), turned into posts from Morgan's notes. Text only; photos get
// added later in the editor.
export interface NoteLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface NotePost {
  title: string;
  slug: string;
  dateISO: string;
  location: NoteLocation | null;
  paragraphs: string[];
}

export const NZ_NOTES_POSTS: NotePost[] = [
  {
    title: "Wellington and Paraparaumu",
    slug: "wellington-and-paraparaumu",
    dateISO: "2017-10-19T12:00:00.000Z",
    location: { lat: -40.9186, lng: 175.0103, label: "Paraparaumu, New Zealand" },
    paragraphs: [
      "We awoke to the distant noises of the city waking up. Spending so many nights in rural New Zealand made normal city noises seem pretty strange. I still found the waking up in a parking lot in the touristy area of Wellington to be pretty surreal. I walked out and got coffee for Eli from the same cake cafe from the day before, got the kids up and dressed, and then we headed out to explore more of Wellington before we had to leave.",
      "We found a huge park on the coast of the city that had grass, swings, typical monkey bar style things, and a slide almost 4 stories high. It was shaped like a lighthouse, and Charlie spent most of the morning climbing up by himself and sliding down over and over again. Henry enjoyed walking in the grass, Malcolm occasionally went to the smaller slides and the swings, and we enjoyed the warm sunshine the early summer provided.",
      "We made a quick pit stop for chai and smoothies from a street vendor, and walked to the Museum of New Zealand Te Papa Tongarewa, one of the largest museums in the country. They had amazing trees, birds, and interactive exhibits. We saw a replica of a blue whale's heart as well as microscopes the kids could use to see things around them close up.",
      "After a quick (and pretty expensive) lunch at the museum cafe, we headed back to the RV, got everyone buckled in, and began the drive to Jared's, a friend of Eli's who happened to live in NZ. The drive to Paraparaumu was uneventful, though making our way through the city in a huge RV was definitely an experience.",
      "We arrived in Jared's town early and played in a local park until he was done with work. When he got home, we headed over, and played in his enormous backyard, met his chickens (Malcolm got to feed them), tried out roller skates and ate delicious barbecued chicken and drank local white wine. We camped out in his driveway.",
    ],
  },
  {
    title: "Waitarere Beach and the Army Museum at Waiouru",
    slug: "waitarere-beach-and-the-army-museum-at-waiouru",
    dateISO: "2017-10-20T12:00:00.000Z",
    location: { lat: -39.4787, lng: 175.6636, label: "Waiouru, New Zealand" },
    paragraphs: [
      "We woke up at Jared's. I made coffee and he made us breakfast, pancakes. We took real showers in a real shower, and the kids jumped on the trampoline a little more.",
      "Then we headed out toward Mt. Doom and Auckland, hoping to maybe stay a couple days in one place if we found somewhere cool. We tried to dump our unmentionables but ended up at Waitarere Beach instead, where I took Charlie and Malcolm to the beach while the baby slept.",
      "We stopped by Victoria Park in Foxton to actually empty our horribles, took a brief rest stop at the Viaduct memorial, and then stopped for the night at the National Army Museum in Waiouru. We can see the mountain in the background.",
    ],
  },
  {
    title: "Mt. Doom and the Oasis Hot Pools",
    slug: "mt-doom-and-the-oasis-hot-pools",
    dateISO: "2017-10-21T12:00:00.000Z",
    location: { lat: -39.1568, lng: 175.632, label: "Mt. Ngauruhoe (Mt. Doom), New Zealand" },
    paragraphs: [
      "We woke up at the Army Museum, got coffee from a gas station, and ate cereal. Then we drove north toward Auckland and decided to look for Mt. Doom. We went to the top, saw the ski lodge, and drove back down, missing the waterfall turnout on the way.",
      "We got lunch at a bar and gaming lounge, which seemed like the first real view of modern Maori culture. After that we called it an early driving day at the Oasis hot mineral pools campground. We fed the horses some apples, relaxed in the pools, and watched the rest of Totoro until bedtime. Tomorrow I get to see a kiwi.",
    ],
  },
  {
    title: "Kiwi Birds at Otorohanga and Raglan",
    slug: "kiwi-birds-at-otorohanga-and-raglan",
    dateISO: "2017-10-22T12:00:00.000Z",
    location: { lat: -37.7963, lng: 174.873, label: "Raglan, New Zealand" },
    paragraphs: [
      "We woke up at the Oasis. I tried to buy coffee but we were up too early, so I made it myself and cooked cereal for everyone. Then we headed to Otorohanga to see the kiwi birds. We stopped at a picnic spot with a sheep skull on the table and ate pasta with weird tomato sauce (is everything sugary in NZ?).",
      "We got to the bird sanctuary and saw a kiwi, along with a lot of other birds, like the one with horns on its wings that yelled at us, and the kakapo (I always think of the sneaky dickgrabber comic).",
      "We drove through Hamilton to Raglan, where the park was super busy for NZ Labour Day. We did laundry, ate Indian food from a pouch, played programming iPad games, and went to sleep under a sliver of a moon shrouded in haze.",
    ],
  },
  {
    title: "Bridal Veil Falls and the Hamilton Gardens",
    slug: "bridal-veil-falls-and-the-hamilton-gardens",
    dateISO: "2017-10-23T12:00:00.000Z",
    location: { lat: -37.787, lng: 175.2793, label: "Hamilton, New Zealand" },
    paragraphs: [
      "We woke up at Raglan, made coffee, and emptied the RV. Then we headed toward Hamilton. We saw a sign for Bridal Veil Falls, hiked down in the rain, and hiked back up in the rain. We went to Hamilton and saw the gardens, then slept in the parking lot of the Te Kauwhata rugby field.",
    ],
  },
  {
    title: "Clark's Beach",
    slug: "clarks-beach",
    dateISO: "2017-10-24T12:00:00.000Z",
    location: { lat: -37.0833, lng: 174.7333, label: "Clark's Beach, New Zealand" },
    paragraphs: [
      "We woke up at the rugby field and tried to go to the trains, but they only run on Sundays. We went to a cafe, then stayed at Clark's Beach, where we played at the playground with the big bouncy thing, did laundry, and saw the sunset.",
    ],
  },
  {
    title: "Returning the Van",
    slug: "returning-the-van",
    dateISO: "2017-10-25T12:00:00.000Z",
    location: { lat: -36.8485, lng: 174.7633, label: "Auckland, New Zealand" },
    paragraphs: [
      "We woke up at Clark's Beach, cleaned the van, and played on the playground. Then we returned the van, 2161 km later. We hung out in the hotel, took showers, and slept.",
    ],
  },
  {
    title: "Butterfly Creek and the Flight Home",
    slug: "butterfly-creek-and-the-flight-home",
    dateISO: "2017-10-26T12:00:00.000Z",
    location: { lat: -37.0007, lng: 174.7997, label: "Auckland Airport, New Zealand" },
    paragraphs: [
      "We woke up near the airport and had coffee and a crappy continental breakfast. We stowed our luggage, went to the mall, got sweets, ate sushi, and saw a Maori exercise plan in the mall.",
      "Then we went to the airport and took a shuttle to Butterfly Creek, where we saw butterflies, a farm, dinosaurs, crocodiles, and more. Then we got on the plane home, where the baby barfed for hours.",
    ],
  },
];
