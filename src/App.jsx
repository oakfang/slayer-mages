import {
  ChevronDownIcon,
  ChevronUpIcon,
  Crosshair1Icon,
  TrashIcon,
} from "@radix-ui/react-icons";
import cls from "classnames";
import {
  createContext,
  useEffect,
  useState,
  useContext,
  useRef,
  useMemo,
} from "react";
import { produce as make } from "immer";

const skills = {
  agile: {
    name: "Agile",
    description: "Dodging, leaping, acrobatics.",
  },
  brawn: {
    name: "Brawn",
    description: "Physical work, powering through, intimidating.",
  },
  deceive: {
    name: "Deceive",
    description: "Lying, tricking, distracting.",
  },
  hunt: {
    name: "Hunt",
    description: "Hunting, tracking, monster knowledge.",
  },
  mend: {
    name: "Mend",
    description: "Warding off death, stabilising wounds, medical training.",
  },
  negotiate: {
    name: "Negotiate",
    description: "Persuading, diplomacy, compelling.",
  },
  stealth: {
    name: "Stealth",
    description: "Blending in, keeping quiet, sleight of hand.",
  },
  streets: {
    name: "Streets",
    description: "Social circles, navigating the city, purchasing power.",
  },
  study: {
    name: "Study",
    description: "Perception, reading a situation or person, doing research.",
  },
  tactics: {
    name: "Tactics",
    description: "Strategizing, preparing for battle, split-second decisions.",
  },
};

const disciplines = {
  arcaneDuelist: {
    id: "arcaneDuelist",
    title: "Arcane Duelist",
    description:
      "Master of single combat using quick successions of lethal spells.",
    fields: [
      { key: "HP", value: 10 },
      { key: "Speed", value: <i data-dice="D8" /> },
      { key: "Spell Dice", value: <i data-dice="D6" /> },
      { key: "Damage", value: 2 },
    ],
    actions: {
      ready: {
        name: "Take a Stance",
        text: "Choose one of your stances (Defensive or Offensive) to be in at the start of combat.",
      },
      attack: {
        name: "Combo",
        text: `A Duelist does not just strike once, but hits their foe with a
        thousand strikes before they have a moment to react. Choose a
        monster in attack range and roll your Spell Dice. Any Hits trigger a
        combo, and you roll another die. This combo continues until you no
        longer roll any Hits. Deal damage for the total number of Hits.`,
      },
      quick: {
        name: "Change Stance",
        node: (
          <>
            <p>
              Duelists use fighting stances during a fight, allowing them to
              always keep an edge in the fight. You may change your fighting
              stance. Effects work until you use another Quick Action to change
              your stance.
            </p>
            <ul>
              <li>
                <span className="font-semibold">Defensive:</span> Monsters need
                a 5+ to Hit you instead of 4+.
              </li>
              <li>
                <span className="font-semibold">Offensive:</span> +1 damage per
                Hit, but monsters deal +1 damage per Hit.
              </li>
            </ul>
          </>
        ),
      },
    },
    features: [
      {
        name: "Shrewd",
        text: "The first roll of your attack always has Advantage.",
      },
      {
        name: "Feint",
        text: "Reroll the first 1 rolled during an attack.",
      },
      {
        name: "Shield",
        text: "Defensive stance applies to nearby allies as well.",
      },
      {
        name: "Sniper",
        text: "Increase both effects of Offensive by +1.",
      },
      {
        name: "Mercury",
        text: (
          <span>
            Increase Speed to <i data-dice="D10" /> and always roll it with
            Advantage.
          </span>
        ),
        fn(d) {
          d.fields[1].value = <i data-dice="D10" />;
        },
      },
      {
        name: "Smite",
        text: "If a monster attacks you, your next attack against them is made with Advantage.",
      },
    ],
  },
  spellslinger: {
    id: "spellslinger",
    title: "Spellslinger",
    description:
      "With multiple magical projectiles surrounding your head, you easily can dispatch a crowd of foes.",
    fields: [
      { key: "HP", value: 8 },
      { key: "Speed", value: <i data-dice="D6" /> },
      { key: "Damage", value: 2 },
    ],
    actions: {
      ready: {
        name: "Invoke Spells",
        text: (
          <span>
            At the start of combat, place 6 <i data-dice="D6" /> in front of
            you, representing the floating magic missiles around your head.
          </span>
        ),
      },
      attack: {
        name: "Spell Slinging",
        text: "Spellslingers unload devastating firepower on anyone unlucky enough to be their target. When Spell Slinging, choose a monster and pick up as many spell dice as you would like to fire. You may use any spell you have floating. Each spell that Hits deals your Damage. Spells that have been rolled are spent, and are not available until you use a Quick Action to cast them again.",
      },
      quick: {
        name: "Cast",
        text: "A trained ‘Slinger knows just the right moment to lay down their guard and prepare their spells. You may cast up to two of the spells you've used up, adding them to the ones around your head.",
      },
    },
    features: [
      {
        name: "Clever",
        text: "Use two Skills when using the Skill action instead of one.",
      },
      {
        name: "Quick Cast",
        text: (
          <span>
            Increase Speed to <i data-dice="D8" />.
          </span>
        ),
        fn(d) {
          d.fields[1] = <i data-dice="D8" />;
        },
      },
      {
        name: "Spell Barrage",
        text: "While all of your spells are available, each spell has Advantage.",
      },
      { name: "Last Will", text: "Your last available spell deals 5 damage." },
      {
        name: "Lethal Spell (Rune)",
        text: (
          <span>
            Choose one of your <i data-dice="D6" /> - it is now a Rune. Any
            spell cast with this dice has the following effect: Deals +2 damage
            on Hit.
          </span>
        ),
      },
      {
        name: "Blast Spell (Rune)",
        text: (
          <span>
            Choose one of your <i data-dice="D6" /> - it is now a Rune. Any
            spell cast with this dice has the following effect: Deals damage as
            normal, and target is pushed back a few meters.
          </span>
        ),
      },
      {
        name: "Slow Spell (Rune)",
        text: (
          <span>
            Choose one of your <i data-dice="D6" /> - it is now a Rune. Any
            spell cast with this dice has the following effect: Deals 1 damage
            instead. Target takes 1 fewer action on their next turn.
          </span>
        ),
      },
      {
        name: "Grasping Spell (Rune)",
        text: (
          <span>
            Choose one of your <i data-dice="D6" /> - it is now a Rune. Any
            spell cast with this dice has the following effect: Deals 1 damage
            instead. Target makes their next action with disadvantage.
          </span>
        ),
      },
      {
        name: "Blood Spell (Rune)",
        text: (
          <span>
            Choose one of your <i data-dice="D6" /> - it is now a Rune. Any
            spell cast with this dice has the following effect: Deals 1 damage
            instead. Target loses 1 HP at the start of each of its turns until
            dead.
          </span>
        ),
      },
      {
        name: "Seeker Spell (Rune)",
        text: (
          <span>
            Choose one of your <i data-dice="D6" /> - it is now a Rune. Any
            spell cast with this dice has the following effect: Hits on a 3+
            instead of a 4+.
          </span>
        ),
      },
    ],
  },
  fatebinder: {
    id: "fatebinder",
    title: "Fatebinder",
    description:
      "You’ve always known how this fight would go, luck is for the blind.",
    fields: [
      { key: "HP", value: 8 },
      { key: "Speed", value: <i data-dice="D4" /> },
      { key: "Damage", value: 1 },
    ],
    actions: {
      ready: {
        name: "Visions of the Future",
        node: (
          <>
            <p>
              Gather and roll a number of <i data-dice="D6" /> equal to the
              number of faces on your Tactics skill die. (A pool size of 6 for{" "}
              <i data-dice="D6" />
              , a pool size of 8 for <i data-dice="D8" />, and so on.) This is
              your Vision Pool.
            </p>
            <p>
              During combat, you can replace any single result rolled by either
              an ally or an enemy with any result within your Vision Pool during
              their turn. Once that result has been used, it is discarded for
              the remainder of combat. This does not count as an action.
              Instead, this is done during other character's turns.
            </p>
          </>
        ),
      },
      attack: {
        name: "Cantrip",
        node: (
          <p>
            Roll <i data-dice="D6" /> to attack a nearby target. On Hit, deal 1
            damage.
          </p>
        ),
      },
      quick: {
        name: "Invoke Future",
        text: "Choose another Mage nearby. That Mage may immediately make a Skill or Quick action for free.",
      },
    },
    features: [
      {
        name: "Vision",
        text: (
          <span>
            Add <i data-dice="D6" /> to your Vision Pool.
          </span>
        ),
      },
      {
        name: "Misfortune",
        text: (
          <span>
            You may roll <i data-dice="D4" /> in place of any{" "}
            <i data-dice="D6" /> in your Vision Pool.
          </span>
        ),
      },
      {
        name: "Fortune",
        text: (
          <span>
            You may roll <i data-dice="D8" /> in place of any{" "}
            <i data-dice="D6" /> in your Vision Pool.
          </span>
        ),
      },
      {
        name: "Ascending Fate",
        text: `You may add a Vision Pool dice to a roll, instead of replacing a die.`,
      },
      {
        name: "Sudden Doom",
        text: `You may subtract a Vision Pool dice from a roll, instead of replacing a die.`,
      },
      {
        name: "Visions of Victory",
        text: (
          <span>
            When a monster is killed, add <i data-dice="D6" /> to your Vision
            Pool. Your Vision Pool can't increased beyond its initial size.
          </span>
        ),
      },
      {
        name: "Danger Sense",
        text: `You and your allies all roll Speed with Advantage.`,
      },
    ],
  },
  summoner: {
    id: "summoner",
    title: "Summoner",
    description:
      "You conjure spirits and other creatures to do the work for you.",
    fields: [
      { key: "HP", value: 7 },
      { key: "Speed", value: <i data-dice="D6" /> },
      { key: "Horde", value: 2 },
      { key: "Spirit Dice", value: <i data-dice="D8" /> },
    ],
    actions: {
      ready: {
        name: "Call Spirits",
        text: `At the start of combat, summon a number of Spirits equal to your Flock stat.
        You may choose multiple copies of the same type of Spirit.
        Your Spirits have 1 Health.`,
      },
      quick: {
        name: "Bind Spirits",
        node: (
          <>
            <p>
              You conduct the horde, moving your spirits around and bringing in
              new ones. Choose one when you Bind Spirits:
            </p>
            <ul className="ps-4">
              <li className="list-disc">
                Summon another Spirit, if you are not at your Horde limit.
              </li>
              <li className="list-disc">
                Swap out a current Spirit for another type. The new Spirit may
                be used this turn.
              </li>
            </ul>
          </>
        ),
      },
      attack: {
        name: "Spirit Strike",
        node: (
          <>
            <p>
              Choose <span className="font-semibold">two</span> of your Spirits
              and roll your Spirit Dice for each to activate their abilities.
              Each type of Spirit has a different ability:
            </p>
            <ul>
              <li>
                <span className="font-semibold">Elemental:</span> Deal 3 damage
                to a monster.
              </li>
              <li>
                <span className="font-semibold">Shadow:</span> Learn a piece of
                information (Health, Actions, etc.) about any monster.
              </li>
              <li>
                <span className="font-semibold">Trickster:</span> Chosen monster
                has one less action on its next turn.
              </li>
            </ul>
          </>
        ),
      },
    },
    features: [
      {
        name: "Summoning Circle",
        text: "Increase Horde by +1.",
        fn(d) {
          d.fields[2].value = 3;
        },
      },
      {
        name: "Spirit Shield",
        text: "When you take damage, you may sacrifice a Spirit to reduce the Harm by 1.",
      },
      {
        name: "Major Connection",
        text: "Your Spirits have 2 Health.",
      },
      {
        name: "Quicken Summoning",
        text: (
          <span>
            Increase Speed to <i data-dice="D8" />.
          </span>
        ),
        fn(d) {
          d.fields[1].value = <i data-dice="D8" />;
        },
      },
      {
        name: "Spiritual Flanking",
        text: "Allies attacking monsters targeted by a Spirit deal +1 Harm.",
      },
    ],
  },
  witch: {
    id: "witch",
    title: "Witch",
    description: "Let others memorise spells. You have hexes and blessings",
    fields: [
      { key: "HP", value: 8 },
      { key: "Speed", value: <i data-dice="D8" /> },
      { key: "Witchcraft Dice", value: <i data-dice="D8" /> },
    ],
    actions: {
      ready: {
        name: "Witchcraft",
        text: `You have a number of Witchcraft tokens equal to your Mend skill dice score.
        This creates your Witchcraft pool.
        At the start of combat, you may place one Witchcraft token from the pool on each character after you in the turn order.
        During combat, anyone with a Witchcraft token is considered Charmed, and will be affected by the current Hexes and Blessings.
        If a character dies with a Witchcraft token, it is removed from play.`,
      },
      attack: {
        name: "Swift Craft",
        text: `Target a nearby character and roll your Witchcraft Dice. If it’s an enemy,
        deal 1 damage per Hit. If it’s an ally, heal them by 1 HP per Hit.
        In either case, you may place a Witchcraft token on them if they don’t
        have one, or remove one, adding it to your pool.`,
      },
      quick: {
        name: "Hex / Bless",
        node: (
          <>
            <p>
              Choose the effect of those charmed with a Witchcraft token. You
              may only have one effect at a time.
            </p>
            <ul>
              <li>
                <span className="font-semibold">Bleed:</span> Lose 1 HP per
                Witchcraft token at the start of your turn.
              </li>
              <li>
                <span className="font-semibold">Heal:</span> Heal 1 HP per
                Witchcraft token at the start of your turn.
              </li>
              <li>
                <span className="font-semibold">Misfortune:</span> Actions are
                taken with Disadvantage.
              </li>
              <li>
                <span className="font-semibold">Fortune:</span> Actions are
                taken with Advantage.
              </li>
            </ul>
          </>
        ),
      },
    },
    features: [
      {
        name: "Life Control",
        text: "Increase the effects of Bleed and Heal by +1.",
      },
      {
        name: "Enhanced Craft",
        text: "Increase the damage and healing of Quick Craft by +1.",
      },
      {
        name: "Reaper",
        text: "You can reclaim the Witchcraft tokens of dead characters. This does not count as an action.",
      },
      {
        name: "Swift Craft",
        text: (
          <span>
            Increase Speed to <i data-dice="D10" />.
          </span>
        ),
        fn(d) {
          d.fields[1].value = <i data-dice="D10" />;
        },
      },
    ],
  },
};

const GlobalStateContext = createContext();

function useGlobalState() {
  return useContext(GlobalStateContext);
}

function useLocalState(key) {
  const [state, setState] = useState(() => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  });
  useEffect(() => {
    if (state) localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [
    state,
    setState,
    () => {
      localStorage.removeItem(key);
      setState(null);
    },
  ];
}

function GlobalStateProvider({ children }) {
  const characterId = useMemo(() => {
    const url = new URL(window.location);
    const id = url.searchParams.get("id");
    return id;
  }, []);
  const currentCharacterId = useMemo(
    () => characterId ?? crypto.randomUUID(),
    [characterId]
  );
  const [character, setCharacter, clearCharacter] = useLocalState(
    "mage_" + currentCharacterId
  );
  const ctx = {
    characterId: currentCharacterId,
    character,
    setCharacter,
    clearCharacter,
  };
  if (characterId && !character) {
    window.location.search = "";
  }

  return (
    <GlobalStateContext.Provider value={ctx}>
      {children}
    </GlobalStateContext.Provider>
  );
}

function Button({ className, icon = null, children, ...props }) {
  return (
    <button
      className={cls(
        "text-white p-2 rounded flex items-center justify-center gap-2 2xl:text-2xl active:brightness-75  disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {icon}
      {children ? (
        <span className={cls("md:inline leading-none", { hidden: icon })}>
          {children}
        </span>
      ) : null}
    </button>
  );
}

function Header() {
  const { character, clearCharacter } = useGlobalState();
  return (
    <header className="bg-gray-700 px-8 py-4 flex justify-between items-center">
      <a
        href="/"
        className="text-white font-semibold text-3xl leading-none 2xl:text-4xl"
      >
        Mages
      </a>
      {character ? (
        <div className="flex gap-2">
          <Button
            className="bg-red-500"
            icon={<TrashIcon />}
            onClick={() => {
              if (confirm("Are you sure you want to delete this character?")) {
                clearCharacter();
              }
            }}
          >
            Delete
          </Button>
        </div>
      ) : null}
    </header>
  );
}

function CharacterSheet() {
  const {
    character: {
      name,
      discipline: disciplineID,
      features: featureNames,
      skills: skillScores,
    },
  } = useGlobalState();
  const baseDiscipline = disciplines[disciplineID];
  const features = useMemo(
    () => baseDiscipline.features.filter((f) => featureNames.includes(f.name)),
    [baseDiscipline, featureNames]
  );
  const discipline = useMemo(() => {
    return features.reduce((d, feature) => {
      if (!feature.fn) return d;
      return make(d, feature.fn);
    }, baseDiscipline);
  }, [baseDiscipline, features]);
  const maxHP = useMemo(
    () => discipline.fields.find((f) => f.key === "HP").value,
    [discipline]
  );
  const [hp, setHP] = useState(maxHP);

  return (
    <div className="flex flex-col gap-8 flex-1">
      <h1 className="text-center sm:text-left text-3xl 2xl:text-6xl flex justify-between gap-4 items-baseline flex-wrap">
        <span>{name}</span>
        <small>{discipline.title}</small>
      </h1>
      <input
        type="range"
        min="0"
        max={maxHP}
        value={hp}
        onChange={(e) => setHP(e.target.valueAsNumber)}
      />
      <div
        className={cls(
          "grid grid-cols-2 gap-2",
          discipline.fields.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"
        )}
      >
        {discipline.fields.map(({ key, value }, idx, { length }) => (
          <div
            key={key}
            className={cls(
              "flex flex-col items-center gap-2 bg-gray-500 rounded-md py-2 md:flex-row md:justify-center",
              {
                "col-span-2 sm:col-span-1": length % 2 && idx === length - 1,
              }
            )}
          >
            <h2 className="font-semibold 2xl:text-xl">{key}</h2>
            <p>{key === "HP" ? hp : value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-center font-bold sm:text-left text-xl 2xl:text-4xl">
            Actions
          </h2>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
              <h3 className="font-semibold underline underline-offset-2 2xl:text-xl">
                Ready Action -{" "}
                <span className="font-bold">
                  {discipline.actions.ready.name}
                </span>
              </h3>
              {discipline.actions.ready.text ? (
                <p>{discipline.actions.ready.text}</p>
              ) : (
                discipline.actions.ready.node ?? null
              )}
            </div>
            <div className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
              <h3 className="font-semibold underline underline-offset-2 2xl:text-xl">
                Attack Action -{" "}
                <span className="font-bold">
                  {discipline.actions.attack.name}
                </span>
              </h3>
              {discipline.actions.attack.text ? (
                <p>{discipline.actions.attack.text}</p>
              ) : (
                discipline.actions.attack.node ?? null
              )}
            </div>
            <div className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
              <h3 className="font-semibold underline underline-offset-2 2xl:text-xl">
                Quick Action -{" "}
                <span className="font-bold">
                  {discipline.actions.quick.name}
                </span>
              </h3>
              {discipline.actions.quick.text ? (
                <p>{discipline.actions.quick.text}</p>
              ) : (
                discipline.actions.quick.node ?? null
              )}
            </div>
          </div>
        </section>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <section className="flex flex-col gap-4 lg:col-span-2 border rounded-xl border-gray-600 p-4">
            <h2 className="text-center font-bold text-xl 2xl:text-4xl">
              Skills
            </h2>
            <div className="grid grid-cols-fill-44 gap-4">
              {Object.keys(skills).map((skillId) => {
                return (
                  <div key={skillId} className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold 2xl:font-normal 2xl:text-3xl flex justify-between items-baseline">
                      <span>{skills[skillId].name}</span>
                      <i data-dice={`D${skillScores[skillId]}`} />
                    </h3>
                    <p>{skills[skillId].description}</p>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="flex flex-col gap-4 border rounded-xl border-gray-600 p-4">
            <h2 className="text-center font-bold text-xl 2xl:text-4xl">
              Features
            </h2>
            <div className="flex flex-col gap-4">
              {features.map((feature) => {
                return (
                  <div key={feature.name} className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold 2xl:font-normal 2xl:text-3xl flex justify-between items-baseline">
                      {feature.name}
                    </h3>
                    <p>{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Discipline({
  id,
  title,
  description,
  fields,
  actions,
  features,
  onPick,
  chosen,
  className,
}) {
  const isChosen = chosen === id;
  return (
    <li
      className={cls(
        "list-none p-4 bg-gray-800 rounded-sm flex flex-col gap-3 shadow-teal-600 shrink-0 max-w-full snap-center",
        { "shadow-inner": isChosen },
        className
      )}
    >
      <header className="flex justify-between items-center">
        <h3 className="text-lg font-bold 2xl:text-3xl">{title}</h3>
        <Button
          className="bg-teal-500"
          icon={<Crosshair1Icon />}
          onClick={() => onPick(id)}
        >
          Pick
        </Button>
      </header>
      <p className="2xl:text-lg">{description}</p>
      <div
        className={cls(
          "grid grid-cols-2 gap-2",
          fields.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-4"
        )}
      >
        {fields.map(({ key, value }, idx, { length }) => (
          <div
            key={key}
            className={cls(
              "flex flex-col items-center gap-2 bg-gray-500 rounded-md py-2 md:flex-row md:justify-center",
              {
                "col-span-2 sm:col-span-1": length % 2 && idx === length - 1,
              }
            )}
          >
            <h4 className="font-semibold 2xl:text-xl">{key}</h4>
            <p>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
        <section className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
          <h4 className="font-semibold underline underline-offset-2 2xl:text-xl">
            Ready Action -{" "}
            <span className="font-bold">{actions.ready.name}</span>
          </h4>
          {actions.ready.text ? (
            <p>{actions.ready.text}</p>
          ) : (
            actions.ready.node ?? null
          )}
        </section>
        <section className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
          <h4 className="font-semibold underline underline-offset-2 2xl:text-xl">
            Attack Action -{" "}
            <span className="font-bold">{actions.attack.name}</span>
          </h4>
          {actions.attack.text ? (
            <p>{actions.attack.text}</p>
          ) : (
            actions.attack.node ?? null
          )}
        </section>
        <section className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
          <h4 className="font-semibold underline underline-offset-2 2xl:text-xl">
            Quick Action -{" "}
            <span className="font-bold">{actions.quick.name}</span>
          </h4>
          {actions.quick.text ? (
            <p>{actions.quick.text}</p>
          ) : (
            actions.quick.node ?? null
          )}
        </section>
      </div>

      <section className="flex flex-col gap-2 bg-gray-500 rounded-md p-3">
        <h4 className="font-bold 2xl:text-xl">Extra Features</h4>
        <ul className="flex flex-col gap-1">
          {features.map(({ name, text }) => (
            <li key={name}>
              <h5 className="font-semibold">{name}</h5>
              <p className="indent-4">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </li>
  );
}

function ChooseDiscipline({ onDiscipline }) {
  const [chosen, setChosen] = useState(null);
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center sm:text-left text-xl 2xl:text-4xl">
        Choose Mage Discipline
      </h2>
      <div className="w-full overflow-x-auto scrollbar-thin snap-x snap-mandatory">
        <ul className="flex gap-4 xl:grid xl:grid-cols-2">
          <Discipline
            onPick={setChosen}
            chosen={chosen}
            {...disciplines.arcaneDuelist}
          />
          <Discipline
            onPick={setChosen}
            chosen={chosen}
            {...disciplines.summoner}
          />
          <Discipline
            onPick={setChosen}
            chosen={chosen}
            {...disciplines.fatebinder}
          />
          <Discipline
            onPick={setChosen}
            chosen={chosen}
            {...disciplines.witch}
          />
          <Discipline
            className={"col-span-full"}
            onPick={setChosen}
            chosen={chosen}
            {...disciplines.spellslinger}
          />
        </ul>
      </div>
      <div className="flex py-2 md:justify-end">
        <Button
          className={
            "bg-teal-500 disabled:bg-gray-600 disabled:opacity-50 w-full md:w-auto"
          }
          disabled={!chosen}
          onClick={() => onDiscipline(chosen)}
        >
          Pick Skills
        </Button>
      </div>
    </div>
  );
}

function Skill({ name, description, dice, setDice, canIncrease }) {
  return (
    <div className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border">
      <h3 className="text-lg font-bold 2xl:text-3xl">{name}</h3>
      <p className="2xl:text-xl flex-1">{description}</p>
      <div className="flex justify-between py-2 items-center">
        <Button
          icon={<ChevronDownIcon />}
          className="bg-red-800 disabled:brightness-50"
          disabled={dice === 6}
          onClick={() => setDice((current) => current - 2)}
        />
        <i data-dice={`D${dice}`} />
        <Button
          icon={<ChevronUpIcon />}
          className="bg-emerald-800  disabled:brightness-50"
          disabled={!canIncrease(dice)}
          onClick={() => setDice((current) => current + 2)}
        />
      </div>
    </div>
  );
}

function PickSkills({ onDiscipline, onSkills }) {
  const [agile, setAgile] = useState(6);
  const [brawn, setBrawn] = useState(6);
  const [deceive, setDeceive] = useState(6);
  const [hunt, setHunt] = useState(6);
  const [mend, setMend] = useState(6);
  const [negotiate, setNegotiate] = useState(6);
  const [stealth, setStealth] = useState(6);
  const [streets, setStreets] = useState(6);
  const [study, setStudy] = useState(6);
  const [tactics, setTactics] = useState(6);
  const currentSkills = [
    agile,
    brawn,
    deceive,
    hunt,
    mend,
    negotiate,
    stealth,
    streets,
    study,
    tactics,
  ];
  const d8s = currentSkills.filter((x) => x === 8).length;
  const d10s = currentSkills.filter((x) => x === 10).length;
  const canIncreaseToD10 = d10s === 0;
  const canIncreaseToD8 = d8s < 2 || (canIncreaseToD10 && d8s === 2);
  const canIncrease = (skill) => {
    switch (skill) {
      case 6:
        return canIncreaseToD8;
      case 8:
        return canIncreaseToD10;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-6">
      <h2 className="text-center sm:text-left text-xl 2xl:text-4xl">
        Pick your Skills
      </h2>
      <p>
        Pick two skills at <i data-dice="D8" /> and one at <i data-dice="D10" />
        .
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Skill
          {...skills.agile}
          dice={agile}
          setDice={setAgile}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.brawn}
          dice={brawn}
          setDice={setBrawn}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.deceive}
          dice={deceive}
          setDice={setDeceive}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.hunt}
          dice={hunt}
          setDice={setHunt}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.mend}
          dice={mend}
          setDice={setMend}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.negotiate}
          dice={negotiate}
          setDice={setNegotiate}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.stealth}
          dice={stealth}
          setDice={setStealth}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.streets}
          dice={streets}
          setDice={setStreets}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.study}
          dice={study}
          setDice={setStudy}
          canIncrease={canIncrease}
        />
        <Skill
          {...skills.tactics}
          dice={tactics}
          setDice={setTactics}
          canIncrease={canIncrease}
        />
      </div>
      <div className="buffer flex-1" />
      <div className="flex py-2 justify-between">
        <Button
          className={"border-teal-500 border"}
          onClick={() => onDiscipline(null)}
        >
          Pick Discipline
        </Button>
        <Button
          className={"bg-teal-500 disabled:bg-gray-600 disabled:opacity-50"}
          disabled={canIncreaseToD10 || canIncreaseToD8}
          onClick={() =>
            onSkills({
              agile,
              brawn,
              deceive,
              hunt,
              mend,
              negotiate,
              stealth,
              streets,
              study,
              tactics,
            })
          }
        >
          Pick Features
        </Button>
      </div>
    </div>
  );
}

function FeaturePicker({ discipline, onSkills, onFeatures }) {
  const dsl = disciplines[discipline];
  const [picked, setPicked] = useState(() => new Set());
  return (
    <div className="flex flex-col flex-1 gap-6">
      <h2 className="text-center sm:text-left text-xl 2xl:text-4xl">
        Pick 2 your {dsl.title} Featuers
      </h2>
      <div className="grid grid-cols-fill-64 gap-4">
        {dsl.features.map((feature) => {
          return (
            <div
              key={feature.name}
              className="flex flex-col gap-2 border-gray-500 rounded-md p-3 border"
            >
              <h3 className="text-lg font-bold 2xl:text-3xl">{feature.name}</h3>
              <p className="2xl:text-xl flex-1">{feature.text}</p>
              <Button
                className={cls(
                  " border-teal-500 border disabled:bg-gray-600 disabled:border-gray-600 disabled:opacity-50",
                  {
                    "bg-teal-500": !picked.has(feature),
                    "text-teal-500": picked.has(feature),
                  }
                )}
                disabled={!picked.has(feature) && picked.size === 2}
                onClick={() =>
                  setPicked((current) => {
                    if (current.has(feature)) {
                      const set = new Set(current);
                      set.delete(feature);
                      return set;
                    }
                    return new Set([...current, feature]);
                  })
                }
              >
                {picked.has(feature) ? "Unpick" : "Pick"}
              </Button>
            </div>
          );
        })}
      </div>
      <div className="buffer flex-1" />
      <div className="flex py-2 justify-between">
        <Button
          className={"border-teal-500 border"}
          onClick={() => onSkills(null)}
        >
          Pick Skills
        </Button>
        <Button
          className={"bg-teal-500 disabled:bg-gray-600 disabled:opacity-50"}
          disabled={picked.size < 2}
          onClick={() => onFeatures([...picked].map((feature) => feature.name))}
        >
          Final Touches
        </Button>
      </div>
    </div>
  );
}

function FinalTouches({ onFeatures, onDone }) {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col flex-1 gap-6">
      <h2 className="text-center sm:text-left text-xl 2xl:text-4xl">
        Who are you?
      </h2>
      <input
        type="text"
        className="p-4 bg-slate-800 rounded-lg text-xl"
        placeholder="Archmage Franz Ferdinand"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="buffer flex-1" />
      <div className="flex py-2 justify-between">
        <Button
          className={"border-teal-500 border"}
          onClick={() => onFeatures(null)}
        >
          Pick Skills
        </Button>
        <Button
          className={"bg-emerald-600 disabled:bg-gray-600 disabled:opacity-50"}
          disabled={!name}
          onClick={() => onDone(name)}
        >
          Create Character
        </Button>
      </div>
    </div>
  );
}

function CharacterCreator() {
  const { setCharacter, characterId } = useGlobalState();
  const pageRef = useRef(null);
  const [discipline, setDiscipline] = useState(null);
  const [skills, setSkills] = useState(null);
  const [features, setFeatures] = useState(null);

  function onDone(name) {
    setCharacter({ name, discipline, features, skills });
    window.location.search = `?id=${characterId}`;
  }

  useEffect(() => {
    if (!pageRef.current) return;
    const scroller = pageRef.current.closest(".scroller");
    if (scroller) {
      scroller.scrollTop = 0;
    }
  }, [discipline, skills]);
  return (
    <div ref={pageRef} className="flex flex-col gap-8 flex-1">
      <h1 className="text-center sm:text-left text-3xl 2xl:text-6xl">
        Create your Mage
      </h1>
      {!discipline ? (
        <ChooseDiscipline onDiscipline={setDiscipline} />
      ) : !skills ? (
        <PickSkills onDiscipline={setDiscipline} onSkills={setSkills} />
      ) : !features ? (
        <FeaturePicker
          discipline={discipline}
          onSkills={setSkills}
          onFeatures={setFeatures}
        />
      ) : (
        <FinalTouches onFeatures={setFeatures} onDone={onDone} />
      )}
    </div>
  );
}

function CharacterList() {
  const [create, setCreate] = useState(false);
  const characters = useMemo(() => {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("mage_")) {
        const { name } = JSON.parse(window.localStorage.getItem(key));
        keys.push({ id: key.substring(5), name });
      }
    }
    return keys;
  }, []);

  if (create) {
    return <CharacterCreator />;
  }

  return (
    <div className="flex flex-col flex-1 items-center gap-8 pt-10">
      <Button
        className="bg-teal-600 text-3xl p-6 rounded-2xl font-bold"
        onClick={() => setCreate(true)}
      >
        Create Your Mage
      </Button>
      {characters.length ? (
        <section className="container flex flex-col gap-6">
          <h1 className="text-2xl font-bold underline underline-offset-2 text-center">
            Your Mages
          </h1>
          <ul className="rounded bg-gray-800 py-2 flex flex-col text-center">
            {characters.map(({ id, name }) => (
              <li key={id} className="px-4 py-3 even:bg-gray-700">
                <a
                  className="underline text-xl leading-none"
                  href={`/?id=${id}`}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function AppContent() {
  const { character } = useGlobalState();

  if (character) return <CharacterSheet />;

  return <CharacterList />;
}

export default function App() {
  return (
    <GlobalStateProvider>
      <div className="h-screen w-screen bg-gray-900 overflow-hidden flex flex-col">
        <Header />
        <div className="scroller flex-1 overflow-auto flex flex-col">
          <main className="px-8 py-4 flex-1 flex flex-col">
            <AppContent />
          </main>
        </div>
      </div>
    </GlobalStateProvider>
  );
}
