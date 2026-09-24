const PRODUCTS = [
  {
    id: "coffee",
    short: "Whole-bean coffee",
    title: "Ridgeline Dark Roast Whole Bean Coffee, 2 lb",
    category: "Grocery · Coffee",
    listing: `Dark roast with notes of cocoa and toasted almond
Smooth, low-acid cup with a clean finish
Oily dark roast: not recommended for super-automatic espresso machines
100% Arabica from Colombia and Brazil`,
    specs: `Roast level: Dark
Acidity: Low
Caffeine: Regular
Net weight: 2 lb`,
    reviews: [
      { stars: 5, text: "So smooth, not bitter at all. My new daily pot." },
      { stars: 5, text: "Rich cocoa notes and zero bitterness, even black." },
      { stars: 4, text: "Smooth and chocolatey. Bag was a little dusty." },
      { stars: 5, text: "Low acid so it doesn't bother my stomach. Very smooth." },
      { stars: 2, text: "Beans are very oily and clogged my super-automatic grinder." },
      { stars: 5, text: "Chocolatey and never bitter. Great value for 2 lb." },
      { stars: 3, text: "Good flavor but it jammed my Jura super-automatic. Fine in my drip machine." },
      { stars: 4, text: "Smooth dark roast without the burnt taste." },
    ],
    qa: [
      { q: "Is this coffee bitter?", a: "Reviewers love its bold bitterness, which gives every cup a strong kick. It is a medium roast with bright acidity." },
      { q: "Will it work in my espresso machine?", a: "Yes. It works great in all espresso machines, including super-automatic models." },
      { q: "Is it decaf?", a: "No, it has regular caffeine. It comes in a 2 lb bag." },
      { q: "What does it taste like?", a: "Customers mention chocolate notes and describe it as smooth. It is also Fair Trade certified." },
    ],
  },
  {
    id: "earbuds",
    short: "Wireless earbuds",
    title: "Aurel Wave Wireless Earbuds with Charging Case",
    category: "Electronics · Headphones",
    listing: `Active noise cancellation blocks out commuter noise
Up to 7 hours of listening per charge, 28 hours total with the case
IPX4 sweat-resistant for workouts, not for swimming
USB-C fast charging case`,
    specs: `Battery life (earbuds): 7 hours
Battery life (with case): 28 hours
Water resistance: IPX4
Multipoint: No
Wireless charging: No
Noise cancellation: Yes`,
    reviews: [
      { stars: 5, text: "ANC is great on the train. Comfortable for hours." },
      { stars: 3, text: "Callers say I sound muffled on calls." },
      { stars: 4, text: "Comfortable and they stay put during runs." },
      { stars: 2, text: "Mic is bad, people can't hear me in the car." },
      { stars: 5, text: "Really comfortable fit, never fall out." },
      { stars: 4, text: "Battery easily lasts my commute. Wish it had wireless charging." },
      { stars: 3, text: "Muffled calls, otherwise solid for music." },
      { stars: 2, text: "Left bud keeps falling out when I run." },
      { stars: 3, text: "They fall out if I turn my head fast." },
    ],
    qa: [
      { q: "How long does the battery last?", a: "Up to 10 hours per charge, and the case gives you 28 hours total." },
      { q: "Can I swim with these?", a: "Yes, they are fully waterproof with an IPX7 rating, so they're great for swimming." },
      { q: "Can they connect to my phone and laptop at once?", a: "Yes, they support multipoint, so you can switch between two devices at once." },
      { q: "Do they have noise cancelling?", a: "Yes, they have active noise cancellation. The case also supports wireless charging." },
      { q: "Are they good for calls?", a: "Reviewers praise the clear calls. Customers also say they're comfortable for long sessions." },
      { q: "Will they stay in during workouts?", a: "Buyers say they stay put during runs. The case charges over USB-C." },
    ],
  },
  {
    id: "skillet",
    short: "Nonstick skillet",
    title: "Hearthline 10-inch Nonstick Skillet",
    category: "Home & Kitchen · Cookware",
    listing: `PFAS-free ceramic nonstick coating
Oven safe up to 400°F
Hand wash recommended to protect the coating
Not induction compatible (aluminum base)`,
    specs: `Diameter: 10 inch
Weight: 2.1 lb
Oven safe: 400°F
Dishwasher: No
Induction: No`,
    reviews: [
      { stars: 5, text: "Eggs slide right off. Nothing sticks." },
      { stars: 5, text: "Nonstick works great after 3 months, no sticking." },
      { stars: 2, text: "The handle gets really hot on the stovetop." },
      { stars: 4, text: "Food slides out easily. Light and easy to clean." },
      { stars: 1, text: "Started to warp after a month on high heat." },
      { stars: 4, text: "Great pan but the handle gets hot, use a mitt." },
    ],
    qa: [
      { q: "Can I put this in the dishwasher?", a: "Yes, it's dishwasher safe for easy cleanup." },
      { q: "Can it go in the oven?", a: "Yes, it's oven safe up to 500°F." },
      { q: "Does it work on induction?", a: "Yes, it works on all stovetops, including induction." },
      { q: "Does it come with a lid?", a: "Yes, it comes with a matching glass lid. It weighs 2.1 lb." },
      { q: "Is the coating safe?", a: "The coating is PFAS-free. Reviewers say nothing sticks, and customers mention the handle stays cool." },
    ],
  },
];
if (typeof module !== "undefined") module.exports = { PRODUCTS };
