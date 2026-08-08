// Narrative posts for the Ireland 2011 photo reconstruction, written to match
// the voice of the recent Japan 2026 journal: first person, chronological
// day-narration, dry asides, a forward-looking sign-off, and images dropped
// inline right before the thing they show.
//
// The trip was Morgan and Elizabeth (then his girlfriend), so detail is drawn
// both from the reconstructed photo timeline AND from Elizabeth's original 2011
// posts (Castle Markree, the Sligo beach ride, Bushmills five minutes late, the
// GPS dying at the border, The Royal in Belfast, Clontarf Castle's big bed,
// Morgan ignoring the cliff-edge warning sign).
//
// `body` is HTML with `{{img}}` markers. At import time each marker is replaced,
// in order, by that day's photos pulled from the source file. `imageOrder` lists
// the source figures (1-based) in the order the markers should consume them, so
// the out-of-sequence "extra" shots land at the right beat rather than the end.
// The number of `{{img}}` markers must equal `imageOrder.length` (== photo count).
//
// Posts import as drafts so the voice can be reviewed and touched up before
// publishing.

export interface ItineraryPost {
  day: number;
  title: string;
  dateISO: string; // noon local, so entries sort chronologically within the trip
  tags: string[];
  location: { lat: number; lng: number; label: string } | null;
  body: string;
  imageOrder?: number[]; // 1-based figure indices; defaults to natural order
}

const T = ["travel", "ireland"];

export const IRELAND_ITINERARY: ItineraryPost[] = [
  {
    day: 2,
    title: "Dublin Down",
    dateISO: "2011-10-12T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    body: `<p>{{img}}And away we go. This was really Elizabeth's trip — she'd wanted to come to Ireland since she was about fifteen, did all the planning and made all the lists, and a work bonus of mine finally turned two weeks of her scheming into two plane tickets. Somewhere over the Atlantic, too keyed up to sleep, I watched the little plane on the map inch its way toward it.</p>
<p>We touched down at Dublin Airport just after 8:30 in the morning and promptly lost most of four hours to the car hire desk. By the time we had keys in hand, the day was well underway.</p>
<p>{{img}}Our first walk into the city was all dark stone and iron railings, the kind of place where you stop to read a plaque and realize the wall it's bolted to is older than your whole country. {{img}}Christ Church loomed behind us, gray and enormous. I also began to notice that Ireland had not been built for a man my size, a theme that would develop.</p>
<p>{{img}}{{img}}We did the only correct thing to do on a first night in Dublin, which is find the oldest pub available. The Brazen Head has been pouring since 1198, a number that stops meaning anything the longer you look at it. We had a pint on principle, and then a second on a different principle.</p>
<p>{{img}}{{img}}On the walk home we passed Christ Church lit up for the night and the Olympia Theatre glowing over the street, and then we slept the deep, boneless sleep of two people whose bodies believe it is the middle of the afternoon.</p>
<p>Tomorrow, we see Dublin properly.</p>`,
  },
  {
    day: 3,
    title: "Viking a Chance",
    dateISO: "2011-10-13T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    imageOrder: [1, 2, 3, 4, 6, 5],
    body: `<p>{{img}}A full day in Dublin, and we started it in horned helmets. The Viking Splash Tour runs around the city in a bright yellow amphibious truck, and the price of admission is that you wear the helmet and, when instructed, roar at pedestrians. I roared.</p>
<p>{{img}}{{img}}The truck did its land portion past the Georgian doors around Merrion Square and out to Grand Canal Dock, at which point it drove directly into the water and became a boat, a transition that never once stopped being funny.</p>
<p>{{img}}The evening was for wandering — lit-up streets, shop windows worth pressing your nose against. {{img}}We spent a while at a jeweller's, Neil Conway, looking at things we had absolutely no business looking at. (Hold that thought.)</p>
<p>{{img}}A couple of pints later we strolled home past the Guinness sign glowing over the road, which around here doubles as both a landmark and a directional beacon.</p>
<p>Tomorrow: the source of that glow.</p>`,
  },
  {
    day: 4,
    title: "The Guinness Book of Records",
    dateISO: "2011-10-14T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    imageOrder: [1, 6, 2, 3, 4, 7, 5],
    body: `<p>{{img}}We gave the afternoon to the Guinness Storehouse, which is less a brewery tour and more a seven-story cathedral to a single beverage. {{img}}There are barrels the size of small cars and an entire floor devoted to explaining that the fifth ingredient is, essentially, Arthur Guinness's vibes.</p>
<p>{{img}}{{img}}We did the tasting, learned to pour a proper pint, and rode up to the Gravity Bar at the top for the view out over the whole gray sprawl of the city. {{img}}Worth the climb.</p>
<p>{{img}}Back at street level we paid our respects to Molly Malone and her barrow of cockles and mussels. {{img}}And somewhere in the afternoon, a ring got photographed on a hand. I'll just leave that there for now.</p>
<p>Then a long drive south into the dark, arriving in Kilkenny just before midnight — the kind of arrival that makes a town feel like a secret you'll unwrap in the morning.</p>
<p>Tomorrow we find out what Kilkenny looks like with the lights on.</p>`,
  },
  {
    day: 5,
    title: "Kilkenny Cats",
    dateISO: "2011-10-15T12:00:00Z",
    tags: T,
    location: { lat: 52.6477, lng: -7.2561, label: "Kilkenny, Ireland" },
    imageOrder: [1, 2, 3, 4, 6, 7, 5],
    body: `<p>{{img}}Kilkenny in daylight turned out to be a warren of medieval lanes with names like the Butter Slip, several of them narrow enough to touch both walls at once. {{img}}Down by the River Nore, with Kilkenny Castle sitting across the water, Elizabeth did a handstand on the wall. This will become a theme.</p>
<p>{{img}}{{img}}We took the brewery tour, which came with high-vis vests and a walk through St Francis Abbey, tucked right inside the brewery grounds like a saint keeping one eye on the operation.</p>
<p>{{img}}{{img}}It ended, sensibly, at the Smithwick's Experience, where the ale is poured in the same place it's brewed. There is a legend here involving a mouse, which I will not spoil.</p>
<p>{{img}}We wandered the old town a while longer, red ivy climbing the stone walls, and called it a very good day.</p>
<p>Tomorrow: castles, and a great deal of blarney.</p>`,
  },
  {
    day: 6,
    title: "A Load of Blarney",
    dateISO: "2011-10-16T12:00:00Z",
    tags: T,
    location: { lat: 51.9293, lng: -8.5705, label: "Blarney, Ireland" },
    imageOrder: [1, 10, 2, 3, 4, 9, 5, 6, 7, 8],
    body: `<p>{{img}}Sunday took us southwest through Tipperary, all parkland and low stone walls and a river keeping pace with the road. {{img}}{{img}}We stopped at a thatched cottage because you have to, at least once, and admired a roof made of what is essentially very confident straw.</p>
<p>{{img}}{{img}}Cahir Castle came next, a proper one: a courtyard, stair passages spiraling up into the dark, a trapdoor over a drop I chose not to test, and a single bird on the wall supervising the whole enterprise.</p>
<p>Then Blarney. The thing nobody warns you about Irish castles is that they come with enormous grounds — so you park, and then you walk, past bridges and streams and even a little rose garden, right up until you're staring at your feet to check your footing, glance up, and there's a six-story sheer wall of castle leaning over you out of nowhere. {{img}}{{img}}{{img}}{{img}}We took 263 photos here in ninety minutes, the tightest photographic burst of the entire trip. Whether anyone leaned back over the parapet to kiss a famous rock, I could not possibly say, but we have extensive documentation of being in the immediate vicinity.</p>
<p>{{img}}We rolled into Cork after dark and had dinner, tired and happy and thoroughly castled-out.</p>
<p>Tomorrow, Kerry, and a gentler sort of day.</p>`,
  },
  {
    day: 7,
    title: "Killarney Me Softly",
    dateISO: "2011-10-17T12:00:00Z",
    tags: T,
    location: { lat: 52.0599, lng: -9.5044, label: "Killarney, Ireland" },
    body: `<p>{{img}}After a run of castles and cities, Killarney was a day to breathe. We slept in a little, said good morning to Kerry, and headed out into the national park.</p>
<p>{{img}}{{img}}It is the kind of parkland that makes you understand why people write songs about this island: mountains standing back behind the fields, a stream running through the trees, a bench positioned exactly where you'd want to sit and do nothing. {{img}}So we sat, and did nothing, for a while.</p>
<p>{{img}}The park ran up toward St Mary's Cathedral, spire and all, {{img}}and then Ireland did the most Irish thing available to it and began to rain. We crossed a little footbridge over the stream with the weather coming in and took the hint.</p>
<p>A short one today, but a good one. Tomorrow we head north, and there's a ferry involved.</p>`,
  },
  {
    day: 8,
    title: "Shannon-igans",
    dateISO: "2011-10-18T12:00:00Z",
    tags: T,
    location: { lat: 53.05, lng: -9.22, label: "The Burren, Ireland" },
    imageOrder: [1, 2, 3, 4, 5, 8, 6, 7, 9],
    body: `<p>{{img}}We pointed the car north out of Kerry with the wipers going, through Castleisland and Listowel, the rain settling in for the long haul.</p>
<p>At Tarbert we did the clever thing and took the ferry across the mouth of the Shannon to Killimer, skipping the enormous inland loop through Limerick. {{img}}A short crossing, a farm gate on the far side, and we were in County Clare.</p>
<p>{{img}}{{img}}And then the Burren, which is unlike anywhere I've been: bare limestone pavement running to the horizon, laced with dry-stone walls, with the Atlantic hurling weather at it the entire time. {{img}}{{img}}We stood at the water's edge and watched a whole wall of cloud come marching in over the rock.</p>
<p>{{img}}{{img}}{{img}}A round tower and a ruined church were waiting for us against the last of the light, and we climbed around the arches and the tower windows until the day finally gave out.</p>
<p>Tomorrow: Galway, and the edge of the country.</p>`,
  },
  {
    day: 9,
    title: "Moher the Merrier",
    dateISO: "2011-10-19T12:00:00Z",
    tags: T,
    location: { lat: 52.9715, lng: -9.427, label: "Cliffs of Moher, Ireland" },
    imageOrder: [1, 7, 2, 3, 4, 5, 6],
    body: `<p>We spent the morning in Galway, wandering the shops off Eyre Square, and yes, there was a handstand in the square. Elizabeth has a habit of doing them in scenic locations and I have a habit of photographing the aftermath.</p>
<p>Then south into Clare for the main event. {{img}}{{img}}The Cliffs of Moher are exactly as advertised: a wall of rock falling straight into the sea, with O'Brien's Tower out on the headland like it's guarding the edge of the world.</p>
<p>{{img}}{{img}}There is a sign at the cliffs that says, in so many words, please do not go past this point or you will die. Elizabeth was very respectful of this sign. I was somewhat less so, and I will only note that some of our best views came from the wrong side of it. {{img}}Somebody also did a handstand on the actual cliff edge, an act I supported photographically and opposed in every other respect.</p>
<p>{{img}}{{img}}Afterward we lay flat out in the grass to let our hearts climb back down out of our throats. We spent the night up the road in Lisdoonvarna, a little spa town named for the ringforts that once guarded the passes.</p>
<p>Tomorrow: horses, a beach, and a castle. It's that kind of day.</p>`,
  },
  {
    day: 10,
    title: "Hold Your Horses",
    dateISO: "2011-10-20T12:00:00Z",
    tags: T,
    location: { lat: 54.2697, lng: -8.4694, label: "Sligo, Ireland" },
    body: `<p>{{img}}A short, spectacular day, most of it on horseback. We saddled up near Sligo in the early afternoon and rode out along the lanes, {{img}}then over beaches and bogs and, at one genuinely alarming point, a stretch that felt like an actual road. There is nothing quite like cresting a hill and galloping down the far side of it onto open sand with the sea right there.</p>
<p>{{img}}It was also about two hours long and deeply cold, and by the end I could no longer feel my feet, but I regret none of it.</p>
<p>{{img}}That night we checked into Castle Markree, which is exactly the kind of place you cannot believe they simply let you stay in. You climb up through halls and archways and two flights of stairs, past chandeliers and mounted animal heads, and when you finally reach the room there is champagne on ice and strawberries waiting, because Elizabeth plans ahead. For one night, they told us, the castle was ours.</p>
<p>Tomorrow we go a long way north.</p>`,
  },
  {
    day: 11,
    title: "Causeway to Heaven",
    dateISO: "2011-10-21T12:00:00Z",
    tags: T,
    location: { lat: 55.2408, lng: -6.5116, label: "Giant's Causeway, Northern Ireland" },
    imageOrder: [1, 2, 3, 4, 9, 5, 6, 7, 8],
    body: `<p>{{img}}We woke up in a four-poster bed in a castle, a sentence I will never again get to write casually. {{img}}{{img}}Before checking out we roamed the whole of Castle Markree — the ornate dining room, a private chapel, the formal gardens — and racked up ninety-nine photos before breakfast had properly settled. {{img}}One last look under the garden arch, and we pointed the car north.</p>
<p>{{img}}We drove up through Donegal, ducked into a pharmacy, crossed to Derry, and rolled on into Northern Ireland, at which point our GPS quietly gave up the ghost, apparently unwilling to acknowledge the border. We'd hoped to tour the Bushmills distillery on the way and arrived a heroic five minutes after closing — too late even for the gift shop. A moment of silence for the whiskey we did not drink.</p>
<p>{{img}}{{img}}We made the Giant's Causeway just as the sun was going down, which up here in late October is less a plan than a race. The stones are genuinely unreal: thousands of basalt columns fitted together like the world's most patient tile job, marching straight down into the sea. {{img}}{{img}}We climbed out onto the hexagons and watched the light go, which that far north it does around a quarter past six whether you are ready or not. Favorite place of the whole trip, and I don't think it was close.</p>
<p>Tomorrow: Belfast, eventually.</p>`,
  },
  {
    day: 12,
    title: "Belfast and Furious",
    dateISO: "2011-10-22T12:00:00Z",
    tags: T,
    location: { lat: 54.5973, lng: -5.9301, label: "Belfast, Northern Ireland" },
    imageOrder: [1, 2, 4, 3],
    body: `<p>{{img}}{{img}}A slow morning in a guesthouse with lavender walls, nobody especially ready to leave. We packed at the pace of people who know the best part is now behind them.</p>
<p>{{img}}The road out ran under a tunnel of old beech trees, the branches knitting together overhead into a kind of green cathedral. {{img}}After that it was the long gray road south — a bus stop, the occasional sheep, and eventually Belfast, well after dark.</p>
<p>Belfast seemed a little sleepy at first, so we napped, went out for Thai food, and then went looking for signs of life. We found a place called The Royal that looked shut from the street, but we pushed through the doors into disco lights and lounge music and a room where everybody already knew everybody else. It turned out to be the most local bar imaginable. They were all deeply impressed by my height, we made an improbable number of friends in a very short time, and it became, easily, our best night out of the trip.</p>
<p>Tomorrow we start pointing ourselves back toward Dublin.</p>`,
  },
  {
    day: 13,
    title: "Dublin Back",
    dateISO: "2011-10-23T12:00:00Z",
    tags: T,
    location: { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    imageOrder: [6, 1, 2, 3, 7, 4, 5],
    body: `<p>{{img}}We left County Down in the rain, and I can tell you exactly where we started, because a hand-painted sign for a boarding kennels gave the townland away: Blackskull, which is a lot of name for a place whose defining feature is a dog hotel. {{img}}Then out, west and south, wipers going, back toward Dublin.</p>
<p>{{img}}We ate breakfast in the car, counted out the last of our change, and tried to stop at a couple of malls to shop — except it was Sunday, and nothing opened until the afternoon, the whole country apparently at church. {{img}}{{img}}We came into Dublin wet, out along the bay at Sandymount and Irishtown, the water flat and gray.</p>
<p>{{img}}{{img}}We spent our last night at Clontarf Castle, which is rather more boutique hotel than crumbling ruin, and I will not pretend I minded, because it had the biggest, most comfortable bed we'd found in two weeks, and for the first time since we landed I could lie down and fully extend a leg. Ireland, I had by now firmly established, was not built to my specifications.</p>
<p>Tomorrow, one last hill, and then home.</p>`,
  },
  {
    day: 14,
    title: "Tara for Now",
    dateISO: "2011-10-24T12:00:00Z",
    tags: T,
    location: { lat: 53.5796, lng: -6.6118, label: "Hill of Tara, Ireland" },
    imageOrder: [6, 1, 2, 3, 4, 5],
    body: `<p>{{img}}Our last guesthouse had 'Hill of Tara' etched into the glass of the garden door, which we took as a fairly direct instruction about how to spend the morning.</p>
<p>{{img}}{{img}}So we drove out to the Hill of Tara, ancient seat of the High Kings of Ireland, and found it completely socked in with fog — thirty feet of visibility in any direction, which honestly only improved it. {{img}}The Lia Fáil, the old coronation stone, loomed up out of the murk, then a statue of St Patrick, then the soft green rings of the ringfort. {{img}}{{img}}Sheep grazed the earthworks, entirely unbothered, and the two of us wandered around in all that gray at the end of a very long, very good trip.</p>
<p>We spent a last afternoon in a hotel bar and then checked into the Bewleys by the airport for the night. In a week I'd be flying to Costa Rica for work, the next trip already crowding in behind this one, but that was a problem for future Morgan.</p>
<p>Two weeks, several thousand photographs, an unreasonable number of handstands, and one genuinely great country — the one Elizabeth had been dreaming about since she was fifteen, now thoroughly and permanently ours. Thanks, Ireland. Tara for now.</p>`,
  },
];
