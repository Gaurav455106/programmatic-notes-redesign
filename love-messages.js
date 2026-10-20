// Shared love messages for the corner note (morning-note.js) and the full-screen moment (love-burst.js).
// "\n" marks a line break; both components show the lines as written.
window.PN_LOVE = {
  names: ["Meri Jaan", "Wifey", "Baby", "My Love"],
  // Our playlist: shown as a small player in the corner note. She taps play; browsers never autoplay sound.
  spotify: "https://open.spotify.com/playlist/37i9dQZF1EJL2GRuKsEMaS",
  // Full-screen moment only, so it never repeats what the corner note says.
  bigTitles: ["I love you", "Meri Jaan", "My Wifey", "Always you", "Hey Baby", "You and me"],
  bigMessages: [
    "You make ordinary days feel like my favourite ones.",
    "Thank you for being exactly who you are.",
    "No rush, no pressure. Just us, at our own pace 🫂",
    "Your smile is still my favourite notification.",
    "I'm proud of you. Today, and every day.",
    "One day: chai, a balcony,\nand you laughing at my terrible jokes 🧿",
    "You are allowed to rest.\nYou are allowed to just be.",
    "Of all the random calls in the world,\nyours are the best ones.",
    "You deserve all the gentleness in the world.",
    "I choose you, on the loud days and the quiet ones.",
    "Hugging you through the screen right now 🫂",
    "Whatever you're feeling, it's welcome here.",
    "Still smiling about our last silly conversation 🥹",
    "However many miles apart,\nyou're always close to my heart.",
    "You are loved. Not for what you do. Just for you.",
    "Go easy on yourself tonight, okay? ❤️",
    "Life with you is my favourite adventure.",
    "Every little memory with you is a treasure.",
    "Take your time. I'm right here.",
    "My calm, my chaos, my favourite person.",
    "Can't wait to make a million more memories with you.",
    "You're doing beautifully,\neven when it doesn't feel like it."
  ],
  messages: [
    "Good morning, Meri Jaan ❤️\nYou don't have to be okay today, or explain anything.\nI'm just happy you exist, exactly as you are.",
    "Baby, you can be quiet with me.\nNo questions, no pressure, no need to be strong.\nI'll still be right here, loving you the same.",
    "Wifey, remember that call where we laughed at nothing for twenty minutes?\nIt's one of my favourite memories.\nLet's make a hundred more silly ones 🥹",
    "Take all the time you need, my love.\nYour pace is the right pace,\nand every feeling is welcome here, even the confusing ones.",
    "You deserve soft mornings, kind people and a peaceful heart, Meri Jaan.\nYou always have ❤️",
    "If you need space, take it, Baby.\nIt never makes me love you less.\nI'll be here whenever you feel like talking.",
    "Sending you a big, warm, slightly too-long hug 🫂\nNo reason. Just because you're you.",
    "Wifey, your laugh is my favourite sound,\nespecially the one that slips out when something is really, truly funny.\nI could listen to it all day.",
    "You don't owe me anything, my love.\nNot answers, not explanations, not a brave face.\nLoving you was never a deal. It's just true.",
    "Every version of you is lovable, Meri Jaan.\nThe chatty one, the quiet one, the sleepy one.\nI like getting to know all of them.",
    "Random reminder: you're really, really cute when you're focused 🥹\nThat's all. Back to it, Baby.",
    "Wherever life takes you, Mumbai or anywhere else,\nchoose what feels right for you.\nI'll be cheering for you either way ❤️",
    "I love the way you see the world, Wifey.\nYour kindness, your humour, your stubborn little opinions.\nNever tone yourself down for anyone.",
    "Some days are heavy, and that's okay, my love.\nYou can rest. You can just breathe.\nYou don't have to earn a break.",
    "I can't wait for the evenings we make chai together,\nargue about nothing,\nand call it a perfect day 🧿",
    "Your boundaries matter to me, Baby.\n\"No\", \"not now\" and \"I don't know\" are all okay.\nI'll always respect them.",
    "You are so much more than anything you've been through, Meri Jaan.\nYou're funny, clever, warm,\nand wonderfully, completely you.",
    "Thank you for every little thing you share with me.\nThe memes, the 2 AM thoughts, the random voice notes.\nThey make my days brighter ❤️",
    "Being with you feels like home, Wifey,\neven from miles away.\nWe'll figure out the rest one day at a time.",
    "You never have to share more than you want to, my love.\nWhether you talk or stay quiet,\nI'm on your side 🫂"
  ],
  // The pet name a message uses, so a heading never says one name while the message says another.
  nameIn: function (message) {
    var lower = message.toLowerCase();
    var found = this.names.filter(function (n) { return lower.indexOf(n.toLowerCase()) > -1; });
    return found.length ? found[0] : "My Love";
  }
};
