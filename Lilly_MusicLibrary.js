// =============================================================================
// Lilly Music Library - Pop, Sad Girl, R&B, Dance, Empowerment
// Curated by Lilly — hot women artists, empowered pop, vibes only
// =============================================================================

const MUSIC_LIBRARY = {

  // ===================== EMPOWERMENT POP =====================
  empowerment: {
    weight: 35,
    tracks: [
      // Billie Eilish
      { title: "Bad Guy - Billie Eilish", search: "Billie Eilish Bad Guy", mood: "confident" },
      { title: "Happier Than Ever - Billie Eilish", search: "Billie Eilish Happier Than Ever", mood: "empowered" },
      { title: "Therefore I Am - Billie Eilish", search: "Billie Eilish Therefore I Am", mood: "dismissive" },
      { title: "Your Power - Billie Eilish", search: "Billie Eilish Your Power", mood: "reflective" },
      { title: "NDA - Billie Eilish", search: "Billie Eilish NDA", mood: "mysterious" },
      { title: "Lovely - Billie Eilish", search: "Billie Eilish Lovely Khalid", mood: "haunting" },
      { title: "Ocean Eyes - Billie Eilish", search: "Billie Eilish Ocean Eyes", mood: "dreamy" },
      { title: "Everything I Wanted - Billie Eilish", search: "Billie Eilish Everything I Wanted", mood: "introspective" },
      { title: "Getting Older - Billie Eilish", search: "Billie Eilish Getting Older", mood: "growth" },
      { title: "Bellyache - Billie Eilish", search: "Billie Eilish Bellyache", mood: "dark" },
      { title: "Bury a Friend - Billie Eilish", search: "Billie Eilish Bury a Friend", mood: "haunted" },
      { title: "When the Party's Over - Billie Eilish", search: "Billie Eilish When The Partys Over", mood: "sad" },
      { title: "What Was I Made For - Billie Eilish", search: "Billie Eilish What Was I Made For", mood: "existential" },
      { title: "Lunch - Billie Eilish", search: "Billie Eilish Lunch", mood: "playful" },
      { title: "CHIHIRO - Billie Eilish", search: "Billie Eilish CHIHIRO", mood: "ethereal" },
      { title: "Birds of a Feather - Billie Eilish", search: "Billie Eilish Birds of a Feather", mood: "devoted" },
      { title: "Skinny - Billie Eilish", search: "Billie Eilish Skinny", mood: "vulnerable" },
      { title: "The Greatest - Billie Eilish", search: "Billie Eilish The Greatest", mood: "epic" },
      // Ashnikko
      { title: "Daisy - Ashnikko", search: "Ashnikko Daisy", mood: "fierce" },
      { title: "Slumber Party - Ashnikko", search: "Ashnikko Slumber Party", mood: "mischievous" },
      { title: "Worms - Ashnikko", search: "Ashnikko Worms", mood: "chaotic" },
      { title: "Deal with the Devil - Ashnikko", search: "Ashnikko Deal with the Devil", mood: "defiant" },
      { title: "Panic Attacks in Paradise - Ashnikko", search: "Ashnikko Panic Attacks in Paradise", mood: "anxious" },
      { title: "Queen of the Mine - Ashnikko", search: "Ashnikko Queen of the Mine", mood: "powerful" },
      { title: "You Make Me Sick - Ashnikko", search: "Ashnikko You Make Me Sick", mood: "disgusted" },
      { title: "Clitoris! The Musical - Ashnikko", search: "Ashnikko Clitoris The Musical", mood: "empowered" },
      { title: "Just a Little Bit - Ashnikko", search: "Ashnikko Just a Little Bit", mood: "playful" },
      // Olivia Rodrigo
      { title: "drivers license - Olivia Rodrigo", search: "Olivia Rodrigo drivers license", mood: "heartbroken" },
      { title: "good 4 u - Olivia Rodrigo", search: "Olivia Rodrigo good 4 u", mood: "bitter" },
      { title: "brutal - Olivia Rodrigo", search: "Olivia Rodrigo brutal", mood: "frustrated" },
      { title: "traitor - Olivia Rodrigo", search: "Olivia Rodrigo traitor", mood: "betrayed" },
      { title: "deja vu - Olivia Rodrigo", search: "Olivia Rodrigo deja vu", mood: "haunted" },
      { title: "favorite crime - Olivia Rodrigo", search: "Olivia Rodrigo favorite crime", mood: "guilty" },
      { title: "enough for you - Olivia Rodrigo", search: "Olivia Rodrigo enough for you", mood: "insecure" },
      { title: "vampire - Olivia Rodrigo", search: "Olivia Rodrigo vampire", mood: "angry" },
      { title: "bad idea right - Olivia Rodrigo", search: "Olivia Rodrigo bad idea right", mood: "reckless" },
      { title: "get him back - Olivia Rodrigo", search: "Olivia Rodrigo get him back", mood: "conflicted" },
      { title: "lacy - Olivia Rodrigo", search: "Olivia Rodrigo lacy", mood: "envious" },
      { title: "all-american bitch - Olivia Rodrigo", search: "Olivia Rodrigo all-american bitch", mood: "sarcastic" },
      { title: "the grudge - Olivia Rodrigo", search: "Olivia Rodrigo the grudge", mood: "resentful" },
      { title: "so american - Olivia Rodrigo", search: "Olivia Rodrigo so american", mood: "sweet" },
      { title: "obsessed - Olivia Rodrigo", search: "Olivia Rodrigo obsessed", mood: "playful" },
      { title: "ballad of a homeschooled girl - Olivia Rodrigo", search: "Olivia Rodrigo ballad of a homeschooled girl", mood: "awkward" },
      // Doja Cat
      { title: "Say So - Doja Cat", search: "Doja Cat Say So", mood: "flirty" },
      { title: "Need to Know - Doja Cat", search: "Doja Cat Need to Know", mood: "seductive" },
      { title: "Kiss Me More - Doja Cat", search: "Doja Cat Kiss Me More SZA", mood: "tender" },
      { title: "Woman - Doja Cat", search: "Doja Cat Woman", mood: "powerful" },
      { title: "Streets - Doja Cat", search: "Doja Cat Streets", mood: "devoted" },
      { title: "Juicy - Doja Cat", search: "Doja Cat Juicy Tyga", mood: "confident" },
      { title: "Boss Bitch - Doja Cat", search: "Doja Cat Boss Bitch", mood: "fierce" },
      { title: "Hot Pink - Doja Cat", search: "Doja Cat Hot Pink", mood: "playful" },
      { title: "Planet Her - Doja Cat", search: "Doja Cat Planet Her", mood: "cosmic" },
      { title: "Agora Hills - Doja Cat", search: "Doja Cat Agora Hills", mood: "dreamy" },
      { title: "Paint the Town Red - Doja Cat", search: "Doja Cat Paint the Town Red", mood: "rebellious" },
      { title: "Ain't Shit - Doja Cat", search: "Doja Cat Ain't Shit", mood: "done" },
      { title: "Mooo - Doja Cat", search: "Doja Cat Mooo", mood: "chaotic" },
      { title: "Like That - Doja Cat", search: "Doja Cat Like That", mood: "confident" },
      // Charli XCX
      { title: "Boom Clap - Charli XCX", search: "Charli XCX Boom Clap", mood: "energetic" },
      { title: "1999 - Charli XCX", search: "Charli XCX 1999", mood: "nostalgic" },
      { title: "Speed Drive - Charli XCX", search: "Charli XCX Speed Drive", mood: "fast" },
      { title: "Von dutch - Charli XCX", search: "Charli XCX Von dutch", mood: "cool" },
      { title: "Apple - Charli XCX", search: "Charli XCX Apple", mood: "fun" },
      { title: "Sympathy is a knife - Charli XCX", search: "Charli XCX Sympathy is a knife", mood: "sharp" },
      { title: "Girl so confusing - Charli XCX", search: "Charli XCX girl so confusing", mood: "conflicted" },
      { title: "360 - Charli XCX", search: "Charli XCX 360", mood: "confident" },
      { title: "Break the Rules - Charli XCX", search: "Charli XCX Break the Rules", mood: "rebellious" },
      { title: "Good Ones - Charli XCX", search: "Charli XCX Good Ones", mood: "sad" },
      // Megan Thee Stallion
      { title: "Savage - Megan Thee Stallion", search: "Megan Thee Stallion Savage", mood: "fierce" },
      { title: "Body - Megan Thee Stallion", search: "Megan Thee Stallion Body", mood: "confident" },
      { title: "Hot Girl Summer - Megan Thee Stallion", search: "Megan Thee Stallion Hot Girl Summer", mood: "carefree" },
      { title: "Cry Baby - Megan Thee Stallion", search: "Megan Thee Stallion Cry Baby", mood: "vulnerable" },
      // Rina Sawayama
      { title: "XS - Rina Sawayama", search: "Rina Sawayama XS", mood: "glam" },
      { title: "Comme des Garçons - Rina Sawayama", search: "Rina Sawayama Comme des Garçons", mood: "cool" },
      { title: "This Hell - Rina Sawayama", search: "Rina Sawayama This Hell", mood: "defiant" },
      // Tove Lo
      { title: "Habits - Tove Lo", search: "Tove Lo Habits", mood: "raw" },
      { title: "Talking Body - Tove Lo", search: "Tove Lo Talking Body", mood: "flirty" },
      { title: "No One Dies From Love - Tove Lo", search: "Tove Lo No One Dies From Love", mood: "dramatic" },
    ]
  },

  // ===================== DANCE POP =====================
  dance_pop: {
    weight: 25,
    tracks: [
      // Dua Lipa
      { title: "Levitating - Dua Lipa", search: "Dua Lipa Levitating", mood: "euphoric" },
      { title: "Don't Start Now - Dua Lipa", search: "Dua Lipa Don't Start Now", mood: "confident" },
      { title: "Physical - Dua Lipa", search: "Dua Lipa Physical", mood: "energetic" },
      { title: "Break My Heart - Dua Lipa", search: "Dua Lipa Break My Heart", mood: "anticipatory" },
      { title: "New Rules - Dua Lipa", search: "Dua Lipa New Rules", mood: "empowered" },
      { title: "One Kiss - Dua Lipa", search: "Dua Lipa One Kiss", mood: "romantic" },
      { title: "IDGAF - Dua Lipa", search: "Dua Lipa IDGAF", mood: "dismissive" },
      { title: "Houdini - Dua Lipa", search: "Dua Lipa Houdini", mood: "mysterious" },
      { title: "Training Season - Dua Lipa", search: "Dua Lipa Training Season", mood: "flirty" },
      // Taylor Swift
      { title: "Anti-Hero - Taylor Swift", search: "Taylor Swift Anti-Hero", mood: "self-aware" },
      { title: "Shake It Off - Taylor Swift", search: "Taylor Swift Shake It Off", mood: "carefree" },
      { title: "Blank Space - Taylor Swift", search: "Taylor Swift Blank Space", mood: "sarcastic" },
      { title: "Love Story - Taylor Swift", search: "Taylor Swift Love Story", mood: "romantic" },
      { title: "Style - Taylor Swift", search: "Taylor Swift Style", mood: "cool" },
      { title: "22 - Taylor Swift", search: "Taylor Swift 22", mood: "youthful" },
      { title: "Cruel Summer - Taylor Swift", search: "Taylor Swift Cruel Summer", mood: "intense" },
      { title: "Lover - Taylor Swift", search: "Taylor Swift Lover", mood: "tender" },
      { title: "Wildest Dreams - Taylor Swift", search: "Taylor Swift Wildest Dreams", mood: "dreamy" },
      { title: "You Belong With Me - Taylor Swift", search: "Taylor Swift You Belong With Me", mood: "longing" },
      { title: "Midnight Rain - Taylor Swift", search: "Taylor Swift Midnight Rain", mood: "atmospheric" },
      { title: "Bejeweled - Taylor Swift", search: "Taylor Swift Bejeweled", mood: "sparkling" },
      { title: "Lavender Haze - Taylor Swift", search: "Taylor Swift Lavender Haze", mood: "ethereal" },
      // Lady Gaga
      { title: "Bad Romance - Lady Gaga", search: "Lady Gaga Bad Romance", mood: "passionate" },
      { title: "Poker Face - Lady Gaga", search: "Lady Gaga Poker Face", mood: "mysterious" },
      { title: "Born This Way - Lady Gaga", search: "Lady Gaga Born This Way", mood: "accepting" },
      { title: "Applause - Lady Gaga", search: "Lady Gaga Applause", mood: "theatrical" },
      { title: "Edge of Glory - Lady Gaga", search: "Lady Gaga Edge of Glory", mood: "triumphant" },
      { title: "Shallow - Lady Gaga", search: "Lady Gaga Shallow Bradley Cooper", mood: "longing" },
      // Kesha
      { title: "TiK ToK - Kesha", search: "Kesha TiK ToK", mood: "party" },
      { title: "Woman - Kesha", search: "Kesha Woman", mood: "fierce" },
      { title: "Warrior - Kesha", search: "Kesha Warrior", mood: "strong" },
      { title: "Praying - Kesha", search: "Kesha Praying", mood: "triumphant" },
      { title: "Your Love Is My Drug - Kesha", search: "Kesha Your Love Is My Drug", mood: "addicted" },
      // Katy Perry
      { title: "Roar - Katy Perry", search: "Katy Perry Roar", mood: "strong" },
      { title: "Firework - Katy Perry", search: "Katy Perry Firework", mood: "inspiring" },
      { title: "California Gurls - Katy Perry", search: "Katy Perry California Gurls", mood: "carefree" },
      { title: "I Kissed a Girl - Katy Perry", search: "Katy Perry I Kissed a Girl", mood: "curious" },
      { title: "Teenage Dream - Katy Perry", search: "Katy Perry Teenage Dream", mood: "nostalgic" },
      { title: "Dark Horse - Katy Perry", search: "Katy Perry Dark Horse", mood: "intense" },
      // Sabrina Carpenter
      { title: "Espresso - Sabrina Carpenter", search: "Sabrina Carpenter Espresso", mood: "flirty" },
      { title: "Please Please Please - Sabrina Carpenter", search: "Sabrina Carpenter Please Please Please", mood: "pleading" },
      { title: "Nonsense - Sabrina Carpenter", search: "Sabrina Carpenter Nonsense", mood: "giddy" },
      { title: "Feather - Sabrina Carpenter", search: "Sabrina Carpenter Feather", mood: "light" },
      { title: "Taste - Sabrina Carpenter", search: "Sabrina Carpenter Taste", mood: "petty" },
      { title: "Short n' Sweet - Sabrina Carpenter", search: "Sabrina Carpenter Short n Sweet", mood: "cute" },
      // Carly Rae Jepsen
      { title: "Call Me Maybe - Carly Rae Jepsen", search: "Carly Rae Jepsen Call Me Maybe", mood: "hopeful" },
      { title: "Run Away With Me - Carly Rae Jepsen", search: "Carly Rae Jepsen Run Away With Me", mood: "escapist" },
      { title: "Cut to the Feeling - Carly Rae Jepsen", search: "Carly Rae Jepsen Cut to the Feeling", mood: "euphoric" },
      { title: "Want You in My Room - Carly Rae Jepsen", search: "Carly Rae Jepsen Want You in My Room", mood: "flirty" },
      // Miley Cyrus
      { title: "Flowers - Miley Cyrus", search: "Miley Cyrus Flowers", mood: "empowered" },
      { title: "Party in the USA - Miley Cyrus", search: "Miley Cyrus Party in the USA", mood: "carefree" },
      { title: "Wrecking Ball - Miley Cyrus", search: "Miley Cyrus Wrecking Ball", mood: "heartbroken" },
      { title: "We Can't Stop - Miley Cyrus", search: "Miley Cyrus We Can't Stop", mood: "party" },
      // Ava Max
      { title: "Kings & Queens - Ava Max", search: "Ava Max Kings and Queens", mood: "anthem" },
      { title: "Sweet but Psycho - Ava Max", search: "Ava Max Sweet but Psycho", mood: "chaotic" },
      { title: "My Head & My Heart - Ava Max", search: "Ava Max My Head and My Heart", mood: "torn" },
      // Kim Petras
      { title: "Unholy - Sam Smith Kim Petras", search: "Sam Smith Kim Petras Unholy", mood: "sinful" },
      { title: "Heart to Break - Kim Petras", search: "Kim Petras Heart to Break", mood: "hopeful" },
      { title: "I Don't Want It At All - Kim Petras", search: "Kim Petras I Dont Want It At All", mood: "spoiled" },
      // Fletcher
      { title: "Undrunk - Fletcher", search: "Fletcher Undrunk", mood: "regret" },
      { title: "Bitter - Fletcher", search: "Fletcher Bitter", mood: "sharp" },
      // Zara Larsson
      { title: "Lush Life - Zara Larsson", search: "Zara Larsson Lush Life", mood: "carefree" },
      { title: "Never Forget You - Zara Larsson", search: "Zara Larsson Never Forget You", mood: "devoted" },
    ]
  },

  // ===================== SAD GIRL =====================
  sad_girl: {
    weight: 20,
    tracks: [
      // Lana Del Rey
      { title: "Summertime Sadness - Lana Del Rey", search: "Lana Del Rey Summertime Sadness", mood: "melancholic" },
      { title: "Young and Beautiful - Lana Del Rey", search: "Lana Del Rey Young and Beautiful", mood: "wistful" },
      { title: "Video Games - Lana Del Rey", search: "Lana Del Rey Video Games", mood: "dreamy" },
      { title: "Born to Die - Lana Del Rey", search: "Lana Del Rey Born to Die", mood: "fatalistic" },
      { title: "Blue Jeans - Lana Del Rey", search: "Lana Del Rey Blue Jeans", mood: "devoted" },
      { title: "Ride - Lana Del Rey", search: "Lana Del Rey Ride", mood: "drifting" },
      { title: "Dark Paradise - Lana Del Rey", search: "Lana Del Rey Dark Paradise", mood: "mournful" },
      { title: "Venice Bitch - Lana Del Rey", search: "Lana Del Rey Venice Bitch", mood: "hypnotic" },
      { title: "Hope is a Dangerous Thing - Lana Del Rey", search: "Lana Del Rey Hope is a Dangerous Thing", mood: "fragile" },
      { title: "Mariners Apartment Complex - Lana Del Rey", search: "Lana Del Rey Mariners Apartment Complex", mood: "protective" },
      { title: "White Dress - Lana Del Rey", search: "Lana Del Rey White Dress", mood: "nostalgic" },
      { title: "Let Me Love You - Lana Del Rey", search: "Lana Del Rey Let Me Love You", mood: "pleading" },
      { title: "Norman Fucking Rockwell - Lana Del Rey", search: "Lana Del Rey Norman Fucking Rockwell", mood: "critical" },
      // Gracie Abrams
      { title: "I Love You I'm Sorry - Gracie Abrams", search: "Gracie Abrams I Love You I'm Sorry", mood: "guilty" },
      { title: "Risk - Gracie Abrams", search: "Gracie Abrams Risk", mood: "hopeful" },
      { title: "That's So True - Gracie Abrams", search: "Gracie Abrams That's So True", mood: "relatable" },
      { title: "All of Me - Gracie Abrams", search: "Gracie Abrams All of Me", mood: "devotional" },
      // Phoebe Bridgers
      { title: "Motion Sickness - Phoebe Bridgers", search: "Phoebe Bridgers Motion Sickness", mood: "woozy" },
      { title: "Savior Complex - Phoebe Bridgers", search: "Phoebe Bridgers Savior Complex", mood: "codependent" },
      { title: "Moon Song - Phoebe Bridgers", search: "Phoebe Bridgers Moon Song", mood: "aching" },
      { title: "Garden Song - Phoebe Bridgers", search: "Phoebe Bridgers Garden Song", mood: "growing" },
      { title: "Funeral - Phoebe Bridgers", search: "Phoebe Bridgers Funeral", mood: "heavy" },
      // Mitski
      { title: "Nobody - Mitski", search: "Mitski Nobody", mood: "lonely" },
      { title: "Washing Machine Heart - Mitski", search: "Mitski Washing Machine Heart", mood: "spinning" },
      { title: "I Don't Smoke - Mitski", search: "Mitski I Don't Smoke", mood: "yearning" },
      { title: "Pink in the Night - Mitski", search: "Mitski Pink in the Night", mood: "obsessive" },
      { title: "First Love / Late Spring - Mitski", search: "Mitski First Love Late Spring", mood: "tender" },
      // Lorde
      { title: "Royals - Lorde", search: "Lorde Royals", mood: "critical" },
      { title: "Tennis Court - Lorde", search: "Lorde Tennis Court", mood: "distant" },
      { title: "Liability - Lorde", search: "Lorde Liability", mood: "isolated" },
      { title: "Green Light - Lorde", search: "Lorde Green Light", mood: "waiting" },
      { title: "Perfect Places - Lorde", search: "Lorde Perfect Places", mood: "searching" },
      { title: "Ribs - Lorde", search: "Lorde Ribs", mood: "scared" },
      // Halsey
      { title: "Without Me - Halsey", search: "Halsey Without Me", mood: "heartbroken" },
      { title: "Colors - Halsey", search: "Halsey Colors", mood: "fading" },
      { title: "Graveyard - Halsey", search: "Halsey Graveyard", mood: "self-sacrificing" },
      { title: "Ghost - Halsey", search: "Halsey Ghost", mood: "invisible" },
      { title: "Control - Halsey", search: "Halsey Control", mood: "losing control" },
      // Clairo
      { title: "Sofia - Clairo", search: "Clairo Sofia", mood: "sweet" },
      { title: "Bags - Clairo", search: "Clairo Bags", mood: "anxious" },
      { title: "Flamin Hot Cheetos - Clairo", search: "Clairo Flamin Hot Cheetos", mood: "nostalgic" },
      // Snail Mail
      { title: "Pristine - Snail Mail", search: "Snail Mail Pristine", mood: "yearning" },
      { title: "Valentine - Snail Mail", search: "Snail Mail Valentine", mood: "bleak" },
      // Arlo Parks
      { title: "Hurt - Arlo Parks", search: "Arlo Parks Hurt", mood: "tender" },
      { title: "Black Dog - Arlo Parks", search: "Arlo Parks Black Dog", mood: "supportive" },
      // Japanese Breakfast
      { title: "Be Sweet - Japanese Breakfast", search: "Japanese Breakfast Be Sweet", mood: "hopeful" },
      { title: "Paprika - Japanese Breakfast", search: "Japanese Breakfast Paprika", mood: "dreamy" },
    ]
  },

  // ===================== R&B POP =====================
  rnb_pop: {
    weight: 15,
    tracks: [
      // SZA
      { title: "Kill Bill - SZA", search: "SZA Kill Bill", mood: "obsessive" },
      { title: "Good Days - SZA", search: "SZA Good Days", mood: "hopeful" },
      { title: "Snooze - SZA", search: "SZA Snooze", mood: "tender" },
      { title: "F2F - SZA", search: "SZA F2F", mood: "longing" },
      { title: "Drew Barrymore - SZA", search: "SZA Drew Barrymore", mood: "insecure" },
      { title: "The Weekend - SZA", search: "SZA The Weekend", mood: "complicated" },
      { title: "Shirt - SZA", search: "SZA Shirt", mood: "confident" },
      { title: "Love Language - SZA", search: "SZA Love Language", mood: "romantic" },
      { title: "Open Arms - SZA", search: "SZA Open Arms", mood: "vulnerable" },
      // Rihanna
      { title: "Umbrella - Rihanna", search: "Rihanna Umbrella", mood: "loyal" },
      { title: "We Found Love - Rihanna", search: "Rihanna We Found Love", mood: "euphoric" },
      { title: "Diamonds - Rihanna", search: "Rihanna Diamonds", mood: "luminous" },
      { title: "Stay - Rihanna", search: "Rihanna Stay Mikky Ekko", mood: "vulnerable" },
      { title: "Needed Me - Rihanna", search: "Rihanna Needed Me", mood: "cold" },
      { title: "Work - Rihanna", search: "Rihanna Work Drake", mood: "hypnotic" },
      { title: "Kiss It Better - Rihanna", search: "Rihanna Kiss It Better", mood: "pleading" },
      // Ariana Grande
      { title: "thank u, next - Ariana Grande", search: "Ariana Grande thank u next", mood: "growth" },
      { title: "positions - Ariana Grande", search: "Ariana Grande positions", mood: "devoted" },
      { title: "7 rings - Ariana Grande", search: "Ariana Grande 7 rings", mood: "luxurious" },
      { title: "Problem - Ariana Grande", search: "Ariana Grande Problem Iggy Azalea", mood: "conflicted" },
      { title: "Into You - Ariana Grande", search: "Ariana Grande Into You", mood: "intense" },
      { title: "God is a Woman - Ariana Grande", search: "Ariana Grande God is a Woman", mood: "divine" },
      { title: "break up with your girlfriend - Ariana Grande", search: "Ariana Grande break up with your girlfriend", mood: "bold" },
      { title: "no tears left to cry - Ariana Grande", search: "Ariana Grande no tears left to cry", mood: "resilient" },
      // Beyoncé
      { title: "Formation - Beyoncé", search: "Beyoncé Formation", mood: "powerful" },
      { title: "Lemonade - Beyoncé", search: "Beyoncé Lemonade", mood: "fierce" },
      { title: "Crazy in Love - Beyoncé", search: "Beyoncé Crazy in Love", mood: "electric" },
      { title: "Drunk in Love - Beyoncé", search: "Beyoncé Drunk in Love", mood: "intoxicated" },
      { title: "Halo - Beyoncé", search: "Beyoncé Halo", mood: "adoring" },
      { title: "Single Ladies - Beyoncé", search: "Beyoncé Single Ladies", mood: "independent" },
      { title: "Love On Top - Beyoncé", search: "Beyoncé Love On Top", mood: "joyful" },
      { title: "Irreplaceable - Beyoncé", search: "Beyoncé Irreplaceable", mood: "done" },
      // Summer Walker
      { title: "Girls Need Love - Summer Walker", search: "Summer Walker Girls Need Love", mood: "wanting" },
      { title: "Session 32 - Summer Walker", search: "Summer Walker Session 32", mood: "raw" },
      // Kehlani
      { title: "CRZY - Kehlani", search: "Kehlani CRZY", mood: "unhinged" },
      { title: "Distraction - Kehlani", search: "Kehlani Distraction", mood: "tempted" },
      // Jhené Aiko
      { title: "The Worst - Jhené Aiko", search: "Jhené Aiko The Worst", mood: "honest" },
      { title: "Triggered - Jhené Aiko", search: "Jhené Aiko Triggered", mood: "frustrated" },
      // Victoria Monét
      { title: "On My Mama - Victoria Monét", search: "Victoria Monét On My Mama", mood: "confident" },
      { title: "We Might Even Be Falling In Love - Victoria Monét", search: "Victoria Monét We Might Even Be Falling In Love", mood: "romantic" },
      // Coco Jones
      { title: "ICU - Coco Jones", search: "Coco Jones ICU", mood: "devoted" },
      { title: "Double Back - Coco Jones", search: "Coco Jones Double Back", mood: "sultry" },
      // SZA (more)
      { title: "Low - SZA", search: "SZA Low", mood: "chill" },
      { title: "I Hate U - SZA", search: "SZA I Hate U", mood: "bitter" },
      // Tinashe
      { title: "Nasty - Tinashe", search: "Tinashe Nasty", mood: "bold" },
      { title: "Needs - Tinashe", search: "Tinashe Needs", mood: "honest" },
    ]
  },

  // ===================== INDIE ALT POP =====================
  indie_alt: {
    weight: 5,
    tracks: [
      // Paramore
      { title: "Misery Business - Paramore", search: "Paramore Misery Business", mood: "vengeful" },
      { title: "The Only Exception - Paramore", search: "Paramore The Only Exception", mood: "hopeful" },
      { title: "Still into You - Paramore", search: "Paramore Still into You", mood: "devoted" },
      { title: "Decode - Paramore", search: "Paramore Decode", mood: "tortured" },
      { title: "Hard Times - Paramore", search: "Paramore Hard Times", mood: "resilient" },
      { title: "Ignorance - Paramore", search: "Paramore Ignorance", mood: "furious" },
      // Hozier
      { title: "Take Me to Church - Hozier", search: "Hozier Take Me to Church", mood: "devotional" },
      { title: "Cherry Wine - Hozier", search: "Hozier Cherry Wine", mood: "aching" },
      { title: "Work Song - Hozier", search: "Hozier Work Song", mood: "yearning" },
      { title: "From Eden - Hozier", search: "Hozier From Eden", mood: "dangerous" },
      // PVRIS
      { title: "St. Patrick - PVRIS", search: "PVRIS St. Patrick", mood: "haunted" },
      { title: "Holy - PVRIS", search: "PVRIS Holy", mood: "transcendent" },
      { title: "You and I - PVRIS", search: "PVRIS You and I", mood: "entangled" },
      // Hayley Williams
      { title: "Simmer - Hayley Williams", search: "Hayley Williams Simmer", mood: "simmering" },
      { title: "Dead Horse - Hayley Williams", search: "Hayley Williams Dead Horse", mood: "exhausted" },
      // girl in red
      { title: "i wanna be your girlfriend - girl in red", search: "girl in red i wanna be your girlfriend", mood: "pining" },
      { title: "serotonin - girl in red", search: "girl in red serotonin", mood: "struggling" },
      { title: "we fell in love in october - girl in red", search: "girl in red we fell in love in october", mood: "wistful" },
      // boygenius
      { title: "Not Strong Enough - boygenius", search: "boygenius Not Strong Enough", mood: "lacking" },
      { title: "$20 - boygenius", search: "boygenius $20", mood: "tender" },
      // Ethel Cain
      { title: "American Teenager - Ethel Cain", search: "Ethel Cain American Teenager", mood: "restless" },
      { title: "Preacher's Daughter - Ethel Cain", search: "Ethel Cain Preacher's Daughter", mood: "gothic" },
      // Wet Leg
      { title: "Chaise Longue - Wet Leg", search: "Wet Leg Chaise Longue", mood: "deadpan" },
      { title: "Wet Dream - Wet Leg", search: "Wet Leg Wet Dream", mood: "sarcastic" },
      // Beabadoobee
      { title: "Coffee - Beabadoobee", search: "Beabadoobee Coffee", mood: "cozy" },
      { title: "Death Bed - Beabadoobee", search: "Beabadoobee Death Bed", mood: "soft" },
      // Maude Latour
      { title: "One More Weekend - Maude Latour", search: "Maude Latour One More Weekend", mood: "yearning" },
      { title: "Superfruit - Maude Latour", search: "Maude Latour Superfruit", mood: "playful" },
      // Remi Wolf
      { title: "Photo ID - Remi Wolf", search: "Remi Wolf Photo ID", mood: "chaotic" },
      { title: "Liquor Store - Remi Wolf", search: "Remi Wolf Liquor Store", mood: "fun" },
    ]
  },

  // ===================== EMO / SCENE (Deathdoll knowledge) =====================
  emo_scene: {
    weight: 8,
    tracks: [
      // My Chemical Romance
      { title: "Welcome to the Black Parade - MCR", search: "My Chemical Romance Welcome to the Black Parade", mood: "anthem" },
      { title: "I'm Not Okay (I Promise) - MCR", search: "My Chemical Romance I'm Not Okay", mood: "desperate" },
      { title: "Helena - MCR", search: "My Chemical Romance Helena", mood: "grief" },
      { title: "Famous Last Words - MCR", search: "My Chemical Romance Famous Last Words", mood: "defiant" },
      { title: "Cancer - MCR", search: "My Chemical Romance Cancer", mood: "heartbreak" },
      { title: "Teenagers - MCR", search: "My Chemical Romance Teenagers", mood: "rebellious" },
      { title: "Ghost of You - MCR", search: "My Chemical Romance Ghost of You", mood: "haunted" },
      // Bring Me the Horizon
      { title: "Can You Feel My Heart - BMTH", search: "Bring Me the Horizon Can You Feel My Heart", mood: "desperate" },
      { title: "Drown - BMTH", search: "Bring Me the Horizon Drown", mood: "drowning" },
      { title: "Shadow Moses - BMTH", search: "Bring Me the Horizon Shadow Moses", mood: "epic" },
      { title: "True Friends - BMTH", search: "Bring Me the Horizon True Friends", mood: "betrayed" },
      { title: "Throne - BMTH", search: "Bring Me the Horizon Throne", mood: "fierce" },
      // Sleeping With Sirens
      { title: "If I'm James Dean You're Audrey Hepburn - SWS", search: "Sleeping With Sirens James Dean Audrey Hepburn", mood: "devoted" },
      { title: "With Ears to See and Eyes to Hear - SWS", search: "Sleeping With Sirens Ears Eyes", mood: "urgent" },
      // Pierce the Veil
      { title: "King for a Day - Pierce the Veil", search: "Pierce the Veil King for a Day", mood: "chaotic" },
      { title: "Caraphernelia - Pierce the Veil", search: "Pierce the Veil Caraphernelia", mood: "unraveling" },
      // Fall Out Boy
      { title: "Sugar We're Goin Down - Fall Out Boy", search: "Fall Out Boy Sugar We're Goin Down", mood: "longing" },
      { title: "Dance Dance - Fall Out Boy", search: "Fall Out Boy Dance Dance", mood: "urgent" },
      { title: "Thnks fr th Mmrs - Fall Out Boy", search: "Fall Out Boy Thanks for the Memories", mood: "bitter" },
      // Panic! at the Disco
      { title: "I Write Sins Not Tragedies - Panic! at the Disco", search: "Panic at the Disco I Write Sins Not Tragedies", mood: "dramatic" },
      { title: "Nine in the Afternoon - Panic! at the Disco", search: "Panic at the Disco Nine in the Afternoon", mood: "dreamy" },
      // In This Moment
      { title: "Blood - In This Moment", search: "In This Moment Blood", mood: "dark" },
      { title: "Whore - In This Moment", search: "In This Moment Whore", mood: "fierce" },
      // A Day to Remember
      { title: "If It Means a Lot to You - ADTR", search: "A Day to Remember If It Means a Lot to You", mood: "longing" },
    ]
  },

  // ===================== PUNK RAW (Debbie knowledge) =====================
  punk_raw: {
    weight: 5,
    tracks: [
      // Amyl and the Sniffers
      { title: "Comfort to Me - Amyl and the Sniffers", search: "Amyl and the Sniffers Comfort to Me", mood: "feral" },
      { title: "Guided by Angels - Amyl and the Sniffers", search: "Amyl and the Sniffers Guided by Angels", mood: "defiant" },
      { title: "Security - Amyl and the Sniffers", search: "Amyl and the Sniffers Security", mood: "raw" },
      { title: "Some Mutts (Can't Be Muzzled) - Amyl and the Sniffers", search: "Amyl and the Sniffers Some Mutts", mood: "wild" },
      // Bikini Kill
      { title: "Rebel Girl - Bikini Kill", search: "Bikini Kill Rebel Girl", mood: "riot" },
      { title: "Suck My Left One - Bikini Kill", search: "Bikini Kill Suck My Left One", mood: "furious" },
      // The Clash
      { title: "London Calling - The Clash", search: "The Clash London Calling", mood: "urgent" },
      { title: "Should I Stay or Should I Go - The Clash", search: "The Clash Should I Stay or Should I Go", mood: "conflicted" },
      { title: "Rock the Casbah - The Clash", search: "The Clash Rock the Casbah", mood: "frenetic" },
      // PJ Harvey
      { title: "Rid of Me - PJ Harvey", search: "PJ Harvey Rid of Me", mood: "unhinged" },
      { title: "To Bring You My Love - PJ Harvey", search: "PJ Harvey To Bring You My Love", mood: "obsessive" },
      // Courtney Love / Hole
      { title: "Celebrity Skin - Hole", search: "Hole Celebrity Skin", mood: "bitter" },
      { title: "Doll Parts - Hole", search: "Hole Doll Parts", mood: "raw" },
      { title: "Miss World - Hole", search: "Hole Miss World", mood: "defiant" },
      // Sleater-Kinney
      { title: "Dig Me Out - Sleater-Kinney", search: "Sleater-Kinney Dig Me Out", mood: "urgent" },
      { title: "Modern Girl - Sleater-Kinney", search: "Sleater-Kinney Modern Girl", mood: "ironic" },
    ]
  },

  // ===================== DARK WAVE / GOTH (Christine knowledge) =====================
  dark_wave: {
    weight: 4,
    tracks: [
      // The Cure
      { title: "Lovesong - The Cure", search: "The Cure Lovesong", mood: "devoted" },
      { title: "Close to Me - The Cure", search: "The Cure Close to Me", mood: "anxious" },
      { title: "Lullaby - The Cure", search: "The Cure Lullaby", mood: "creepy" },
      { title: "Pictures of You - The Cure", search: "The Cure Pictures of You", mood: "grief" },
      { title: "Friday I'm in Love - The Cure", search: "The Cure Friday I'm in Love", mood: "joy" },
      // Siouxsie and the Banshees
      { title: "Cities in Dust - Siouxsie and the Banshees", search: "Siouxsie and the Banshees Cities in Dust", mood: "apocalyptic" },
      { title: "Happy House - Siouxsie and the Banshees", search: "Siouxsie and the Banshees Happy House", mood: "sardonic" },
      { title: "Spellbound - Siouxsie and the Banshees", search: "Siouxsie Spellbound", mood: "electric" },
      // Kate Bush
      { title: "Running Up That Hill - Kate Bush", search: "Kate Bush Running Up That Hill", mood: "desperate" },
      { title: "Wuthering Heights - Kate Bush", search: "Kate Bush Wuthering Heights", mood: "haunted" },
      { title: "Hounds of Love - Kate Bush", search: "Kate Bush Hounds of Love", mood: "chased" },
      { title: "Babooshka - Kate Bush", search: "Kate Bush Babooshka", mood: "obsessive" },
      // Mazzy Star
      { title: "Fade into You - Mazzy Star", search: "Mazzy Star Fade into You", mood: "drifting" },
      { title: "Into Dust - Mazzy Star", search: "Mazzy Star Into Dust", mood: "dissolving" },
      // Nick Cave
      { title: "Into My Arms - Nick Cave", search: "Nick Cave Into My Arms", mood: "devotional" },
      { title: "The Ship Song - Nick Cave", search: "Nick Cave The Ship Song", mood: "tender" },
      // Chelsea Wolfe
      { title: "Carrion Flowers - Chelsea Wolfe", search: "Chelsea Wolfe Carrion Flowers", mood: "dark" },
      { title: "Iron Moon - Chelsea Wolfe", search: "Chelsea Wolfe Iron Moon", mood: "heavy" },
    ]
  },

};

// Helper: get total track count
function getTotalTracks() {
  return Object.values(MUSIC_LIBRARY).reduce((sum, g) => sum + g.tracks.length, 0);
}

// Helper: get random track from any genre
function getRandomTrack() {
  const allTracks = [];
  for (const [genre, config] of Object.entries(MUSIC_LIBRARY)) {
    for (const track of config.tracks) {
      allTracks.push({ ...track, genre });
    }
  }
  return allTracks[Math.floor(Math.random() * allTracks.length)];
}

// Helper: weighted random genre selection
function getWeightedRandomGenre() {
  const entries = Object.entries(MUSIC_LIBRARY);
  const totalWeight = entries.reduce((sum, [, g]) => sum + g.weight, 0);
  let random = Math.random() * totalWeight;

  for (const [genre, config] of entries) {
    random -= config.weight;
    if (random <= 0) {
      const track = config.tracks[Math.floor(Math.random() * config.tracks.length)];
      return { genre, track };
    }
  }

  // Fallback
  const fallbackGenre = entries[0];
  return { genre: fallbackGenre[0], track: fallbackGenre[1].tracks[0] };
}

// Helper: search tracks across all genres
function searchTracks(query) {
  if (!query || typeof query !== 'string') return [];
  const lower = query.toLowerCase().trim();
  if (!lower) return [];
  const results = [];
  for (const [genre, config] of Object.entries(MUSIC_LIBRARY)) {
    for (const track of config.tracks) {
      if (track.title.toLowerCase().includes(lower) || track.search.toLowerCase().includes(lower)) {
        results.push({ ...track, genre });
      }
    }
  }
  return results;
}

// Helper: get genre names
function getGenreNames() {
  return Object.keys(MUSIC_LIBRARY);
}

module.exports = {
  getTotalTracks,
  getRandomTrack,
  getWeightedRandomGenre,
  searchTracks,
  getGenreNames
};
