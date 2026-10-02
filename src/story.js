export function createQuestDefinitions(getGame) {
  return {
    meet_calder: [
      "Ash on the Road",
      "Find the knight beside the ruined altar.",
      0,
      1,
    ],
    kill_goblins: [
      "The Goblin Oath",
      "Defeat 10 goblins for Sir Calder.",
      () => Math.min(getGame().goblins, 10),
      10,
    ],
    return_calder: [
      "An Oath Fulfilled",
      "Return to Sir Calder at the altar.",
      0,
      1,
    ],
    defeat_calder: [
      "The False Knight",
      "Defeat Calder and his undead army.",
      0,
      1,
    ],
    use_portal: [
      "The Road to Starfall",
      "Use the Teleporter Key at the meadow portal.",
      0,
      1,
    ],
    visit_services: [
      "A Town Reawakened",
      "Enter the smithy and shop; speak with Mira and Oren.",
      () => Number(getGame().visited.smith) + Number(getGame().visited.shop),
      2,
    ],
    awaken_altar: [
      "The Strange Rune",
      "Buy the Strange Rune and awaken Starfall’s altar.",
      () => Number(getGame().keyItems.includes("Strange Rune")),
      1,
    ],
    enter_man_cave: [
      "The Third House",
      "Acquire the Key to the Man Cave and enter the third house.",
      () => Number(getGame().visited.manHouse),
      1,
    ],
    find_basement: [
      "Beneath the Floorboards",
      "Descend the basement stairs and pass through the broken wall.",
      () => Number(getGame().visited.cave),
      1,
    ],
    explore_cave: [
      "The Hollow Below",
      "Defeat one bat group and the rock monster in the cave.",
      () =>
        Number(getGame().stats.bats > 0) + Number(getGame().stats.rocks > 0),
      2,
    ],
    complete: [
      "Echoes of Starfall",
      "Find three memories and seek the sealed Sentinel at the deepest bend of the Hollow.",
      () => Math.min(3, getGame().echoes.length),
      3,
    ],
    epilogue: [
      "The Oath Remembered",
      "Starfall is safe. Discover the remaining memories and keep its roads open.",
      1,
      1,
    ],
  };
}

export function createStoryBook() {
  const cutscenes = {
    intro: [
      [
        "NARRATOR",
        "Ash drifts over the Meadow of Cinders as Bram returns to the old road.",
        "player",
        "rise",
      ],
      [
        "BRAM",
        "Starfall’s beacon still burns. Then someone survived.",
        "portal",
        "orbit",
      ],
      [
        "NARRATOR",
        "A knight waits beside a silent altar, watching the road.",
        "knight",
        "push",
      ],
    ],
    calder: [
      [
        "SIR CALDER",
        "Bram Stoneguard. Your hammer has been absent too long.",
        "knight",
        "orbit",
      ],
      [
        "BRAM",
        "Why are goblins carrying steel from Starfall?",
        "player",
        "push",
      ],
      [
        "SIR CALDER",
        "Slay ten. I will open the road when their blood pays the oath.",
        "altar",
        "rise",
      ],
    ],
    betrayal: [
      [
        "SIR CALDER",
        "Excellent. Every goblin you struck fed the dead beneath us.",
        "knight",
        "orbit",
      ],
      ["BRAM", "You were never guarding this road.", "player", "push"],
      ["SIR CALDER", "No. I was preparing it. Minions—rise!", "altar", "rise"],
    ],
    transform: [
      [
        "CALDER",
        "Why do I always have to do things myself?",
        "battleBoss",
        "orbit",
      ],
      [
        "NARRATOR",
        "His armor shatters. A necromancer rises inside the broken plates.",
        "battleBoss",
        "rise",
      ],
    ],
    victory: [
      ["BRAM", "Your oath ends here.", "player", "push"],
      [
        "NARRATOR",
        "The Teleporter Key answers, opening the road to Starfall.",
        "portal",
        "orbit",
      ],
    ],
    town: [
      [
        "NARRATOR",
        "Starfall endures behind old stone walls and warm windows.",
        "townAltar",
        "orbit",
      ],
      [
        "BRAM",
        "Mira and Oren may know what survived beneath this place.",
        "player",
        "push",
      ],
    ],
    manHouse: [
      [
        "NARRATOR",
        "The key turns in a lock untouched for years.",
        "thirdHouse",
        "push",
      ],
      ["BRAM", "Someone hid these stairs for a reason.", "stairs", "rise"],
    ],
    cave: [
      [
        "NARRATOR",
        "A broken wall opens into a jagged passage beneath Starfall.",
        "wallHole",
        "push",
      ],
      [
        "BRAM",
        "This is no cellar. Something is nesting down here.",
        "player",
        "orbit",
      ],
    ],
    ending: [
      [
        "NARRATOR",
        "Bat wings stir above stone footsteps in the Hollow Below.",
        "player",
        "orbit",
      ],
      [
        "BRAM",
        "Whatever built this passage is still farther ahead.",
        "player",
        "push",
      ],
    ],
  };
  cutscenes.intro = [
    [
      "NARRATOR",
      "The road home ends in ash. Beyond the meadow, Starfall’s last beacon refuses to die.",
      "player",
      "rise",
    ],
    [
      "BRAM",
      "Father said a Stoneguard never leaves a road undefended. If you’re still out there… I’m coming.",
      "player",
      "push",
    ],
    [
      "NARRATOR",
      "A knight waits by a ruined altar. In the grass, fragments of an older story glimmer.",
      "knight",
      "orbit",
    ],
  ];

  cutscenes.victory = [
    [
      "BRAM",
      "You turned their deaths into a weapon. That was never the oath.",
      "player",
      "push",
    ],
    [
      "NARRATOR",
      "Calder’s broken armor falls silent. Among the plates lies a key warm with Starfall’s light.",
      "portal",
      "orbit",
    ],
    ["BRAM", "Mira. Oren. Hold on. I’m coming home.", "player", "push"],
  ];

  cutscenes.town = [
    [
      "NARRATOR",
      "Starfall’s windows glow against the dusk. Someone has been keeping the lanterns lit.",
      "townAltar",
      "orbit",
    ],
    [
      "BRAM",
      "Mira’s forge is still burning. Oren always said he’d outlast the end of the world.",
      "player",
      "push",
    ],
    [
      "NARRATOR",
      "Speak to them inside their shops. The silent altar and the locked third house are waiting.",
      "townAltar",
      "rise",
    ],
  ];

  cutscenes.sentinel = [
    [
      "THE SENTINEL",
      "Three echoes. One bloodline. Tell me why you carry his hammer.",
      "sentinel",
      "orbit",
    ],
    [
      "BRAM",
      "Not to finish his war. To bring everyone home.",
      "player",
      "push",
    ],
    [
      "THE SENTINEL",
      "Then hold the last road. Show me what your oath is worth.",
      "sentinel",
      "rise",
    ],
  ];

  cutscenes.trueEnding = [
    [
      "NARRATOR",
      "The Sentinel lowers its head. Light fills the cracks in its stone, sealing the breach at last.",
      "sentinel",
      "rise",
    ],
    [
      "THE SENTINEL",
      "He stood here so you would never have to. He would have been proud that you came anyway.",
      "sentinel",
      "push",
    ],
    [
      "BRAM",
      "No more lonely watchmen. We keep the lights on together.",
      "player",
      "push",
    ],
  ];

  return cutscenes;
}
