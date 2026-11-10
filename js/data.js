/*
 * Course content for "Yalla English" (יאללה אינגליש).
 *
 * How to add content:
 *  - A unit has: id, title, desc, color, lessons[]
 *  - A lesson has: id (unique!), title, icon, tip (Hebrew grammar tip),
 *    words[] and sentences[].
 *  - word:     { en, he, emoji?, alt?: [other accepted English answers] }
 *  - sentence: { en, he, alt?: [other accepted English answers] }
 *  - Each lesson should have at least 6 words and 4 sentences.
 *  - Exercises are generated automatically from this data (see js/app.js).
 */
window.COURSE = {
  units: [
    // ───────────────────── Alphabet (absolute beginners) ─────────────────────
    // type: 'letters' lessons use a special exercise generator (genLetters in app.js).
    // en = letter; he = its name in Hebrew; ex/exHe/emoji = an example word.
    // Letter names use fixed audio/letters/A.wav etc., routed by js/audio.js.
    {
      id: 'ua',
      title: 'האותיות באנגלית',
      desc: 'מתחילים מאפס: A B C',
      color: '#14B8A6',
      lessons: [
        {
          id: 'ual1', title: 'A עד G', icon: '🔤', type: 'letters',
          tip: 'באנגלית יש 26 אותיות, וכותבים משמאל לימין. לכל אות יש צורה גדולה (A) וצורה קטנה (a). לחצו על 🔊 כדי לשמוע את השם של האות.',
          words: [
            { en: 'A', he: 'אֵיי', ex: 'apple', exHe: 'תפוח', emoji: '🍎' },
            { en: 'B', he: 'בִּי', ex: 'ball', exHe: 'כדור', emoji: '⚽' },
            { en: 'C', he: 'סִי', ex: 'cat', exHe: 'חתול', emoji: '🐱' },
            { en: 'D', he: 'דִי', ex: 'dog', exHe: 'כלב', emoji: '🐶' },
            { en: 'E', he: 'אִי', ex: 'egg', exHe: 'ביצה', emoji: '🥚' },
            { en: 'F', he: 'אֶף', ex: 'fish', exHe: 'דג', emoji: '🐟' },
            { en: 'G', he: "גִ'י", ex: 'gift', exHe: 'מתנה', emoji: '🎁' }
          ],
          sentences: []
        },
        {
          id: 'ual2', title: 'H עד N', icon: '🔠', type: 'letters',
          tip: 'שמות האותיות שונים מהצלילים שלהן במילים. במילים רבות H מייצגת צליל כמו ה׳, J כמו ג׳ ו־K כמו ק׳. האות I (אַיי) היא גם מילה שלמה: I = אני.',
          words: [
            { en: 'H', he: "אֵייץ'", ex: 'house', exHe: 'בית', emoji: '🏠' },
            { en: 'I', he: 'אַיי', ex: 'ice cream', exHe: 'גלידה', emoji: '🍦' },
            { en: 'J', he: "גֵ'יי", ex: 'juice', exHe: 'מיץ', emoji: '🧃' },
            { en: 'K', he: 'קֵיי', ex: 'key', exHe: 'מפתח', emoji: '🔑' },
            { en: 'L', he: 'אֶל', ex: 'lion', exHe: 'אריה', emoji: '🦁' },
            { en: 'M', he: 'אֶם', ex: 'milk', exHe: 'חלב', emoji: '🥛' },
            { en: 'N', he: 'אֶן', ex: 'nose', exHe: 'אף', emoji: '👃' }
          ],
          sentences: []
        },
        {
          id: 'ual3', title: 'O עד U', icon: '🅾️', type: 'letters',
          tip: 'O נשמעת לרוב כמו אוֹ או אָ, ו-U כמו אַ או יוּ. האות Q כמעט תמיד באה יחד עם U, כמו ב-queen (מלכה).',
          words: [
            { en: 'O', he: 'אוֹ', ex: 'orange', exHe: 'תפוז', emoji: '🍊' },
            { en: 'P', he: 'פִּי', ex: 'pizza', exHe: 'פיצה', emoji: '🍕' },
            { en: 'Q', he: 'קְיוּ', ex: 'queen', exHe: 'מלכה', emoji: '👑' },
            { en: 'R', he: 'אָר', ex: 'rain', exHe: 'גשם', emoji: '🌧️' },
            { en: 'S', he: 'אֶס', ex: 'sun', exHe: 'שמש', emoji: '☀️' },
            { en: 'T', he: 'טִי', ex: 'tree', exHe: 'עץ', emoji: '🌳' },
            { en: 'U', he: 'יוּ', ex: 'umbrella', exHe: 'מטרייה', emoji: '☂️' }
          ],
          sentences: []
        },
        {
          id: 'ual4', title: 'V עד Z', icon: '🏁', type: 'letters',
          tip: 'W נקראת "דַאבֶּל יוּ" – כלומר U כפולה. Y בתחילת מילה נשמעת כמו י׳ (yellow). אחרי השיעור הזה אתם מכירים את כל 26 האותיות! 🎉',
          words: [
            { en: 'V', he: 'וִי', ex: 'violin', exHe: 'כינור', emoji: '🎻' },
            { en: 'W', he: 'דַאבֶּל יוּ', ex: 'water', exHe: 'מים', emoji: '💧' },
            { en: 'X', he: 'אֶקְס', ex: 'x-ray', exHe: 'צילום רנטגן', emoji: '🩻' },
            { en: 'Y', he: 'וַואי', ex: 'yellow', exHe: 'צהוב', emoji: '🟡' },
            { en: 'Z', he: 'זִי', ex: 'zebra', exHe: 'זברה', emoji: '🦓' }
          ],
          sentences: []
        }
      ]
    },

    // ───────────────────── Easy words (short, read-as-you-write) ─────────────────────
    // say = how to pronounce, written in Hebrew letters (helps learners who can't read English yet)
    {
      id: 'ub',
      title: 'מילים ראשונות',
      desc: 'מילים קצרות שקל לקרוא ולכתוב',
      color: '#EF6C57',
      lessons: [
        {
          id: 'ubl1', title: 'cat, hat, bag', icon: '🐱',
          tip: 'ב־cat יש שלושה צלילים שמחברים למילה, משמאל לימין. התנועה a כאן אינה שם האות אֵיי; אין לה מקבילה מדויקת בעברית. התעתיק קֶט הוא עזרה משוערת. a באה לפני שם עצם ספיר יחיד ולא מיודע: a cat = חתול. and = ו־.',
          words: [
            { en: 'cat', he: 'חתול', emoji: '🐱', say: 'קֶט' },
            { en: 'hat', he: 'כובע', emoji: '🎩', say: 'הֶט' },
            { en: 'bag', he: 'תיק', emoji: '👜', say: 'בֶּג' },
            { en: 'man', he: 'איש', emoji: '👨', say: 'מֶן' },
            { en: 'map', he: 'מפה', emoji: '🗺️', say: 'מֶפּ' },
            { en: 'bat', he: 'עטלף', emoji: '🦇', say: 'בֶּט' },
            { en: 'jam', he: 'ריבה', emoji: '🍓', say: "גֶ'ם" },
            { en: 'van', he: 'מסחרית', emoji: '🚐', say: 'וֶן' }
          ],
          sentences: [
            {"en": "a cat", "he": "חתול"},
            {"en": "a hat", "he": "כובע"},
            {"en": "a bag", "he": "תיק"},
            {"en": "a man", "he": "איש"},
            {"en": "a cat and a hat", "he": "חתול וכובע"}
          ]
        },
        {
          id: 'ubl2', title: 'pen, red, pig', icon: '🐷',
          tip: 'האות e במילים קצרות נשמעת כמו אֶ (pen = פֶּן), והאות i כמו אִי קצרה (pig = פִּיג). שימו לב: באנגלית התואר בא לפני המילה – a red pen = עט אדום.',
          words: [
            { en: 'pen', he: 'עט', emoji: '🖊️', say: 'פֶּן' },
            { en: 'bed', he: 'מיטה', emoji: '🛏️', say: 'בֶּד' },
            { en: 'red', he: 'אדום', emoji: '🔴', say: 'רֶד' },
            { en: 'ten', he: 'עשר', emoji: '🔟', say: 'טֶן' },
            { en: 'hen', he: 'תרנגולת', emoji: '🐔', say: 'הֶן' },
            { en: 'pig', he: 'חזיר', emoji: '🐷', say: 'פִּיג' },
            { en: 'big', he: 'גדול', emoji: '🐘', say: 'בִּיג' },
            { en: 'six', he: 'שש', emoji: '6️⃣', say: 'סִיקְס' }
          ],
          sentences: [
            {"en": "a red pen", "he": "עט אדום"},
            {"en": "a big pig", "he": "חזיר גדול"},
            {"en": "a red bed", "he": "מיטה אדומה"},
            {"en": "a big cat", "he": "חתול גדול"},
            {"en": "a red hen", "he": "תרנגולת אדומה"}
          ]
        },
        {
          id: 'ubl3', title: 'dog, sun, bus', icon: '☀️',
          tip: 'הצליל של o במילים כמו dog ו־box משתנה בין מבטאים ואינו תמיד אוֹ. u ב־sun קצרה ושונה משם האות יוּ. התעתיק הוא עזרה משוערת; הקשיבו למילה השלמה. the = ה׳ הידיעה: the dog = הכלב.',
          words: [
            { en: 'dog', he: 'כלב', emoji: '🐶', say: 'דוֹג' },
            { en: 'box', he: 'קופסה', emoji: '📦', say: 'בּוֹקְס' },
            { en: 'hot', he: 'חם', emoji: '🔥', say: 'הוֹט' },
            { en: 'fox', he: 'שועל', emoji: '🦊', say: 'פוֹקְס' },
            { en: 'sun', he: 'שמש', emoji: '☀️', say: 'סַאן' },
            { en: 'bus', he: 'אוטובוס', emoji: '🚌', say: 'בַּאס' },
            { en: 'cup', he: 'כוס', emoji: '☕', say: 'קַאפּ' },
            { en: 'bug', he: 'חרק', emoji: '🐛', say: 'בַּאג' }
          ],
          sentences: [
            {"en": "a big dog", "he": "כלב גדול"},
            {"en": "a red fox", "he": "שועל אדום"},
            {"en": "a box", "he": "קופסה"},
            {"en": "the sun", "he": "השמש"},
            {"en": "a cup", "he": "כוס"},
            {"en": "a bug", "he": "חרק"}
          ]
        },
        {
          id: 'ubl4', title: 'hi, mom, dad', icon: '👋',
          tip: 'it is = זה / זאת במשפטים כמו it is a dog = זה כלב. באנגלית צריך is במשפט הזה. in = בתוך. hi ו־no הן מילים נפוצות שההגייה שלהן אינה לפי דפוס התנועה הקצרה.',
          words: [
            { en: 'hi', he: 'היי', emoji: '👋', say: 'הַיי' },
            { en: 'yes', he: 'כן', emoji: '✅', say: 'יֶס' },
            { en: 'no', he: 'לא', emoji: '❌', say: 'נוֹ' },
            { en: 'mom', he: 'אמא', emoji: '👩', say: 'מוֹם' },
            { en: 'dad', he: 'אבא', emoji: '👨', say: 'דֶד' },
            { en: 'up', he: 'למעלה', emoji: '⬆️', say: 'אַפּ' },
            { en: 'in', he: 'בתוך', emoji: '📥', say: 'אִין' },
            { en: 'it', he: 'זה', emoji: '👉', say: 'אִיט' }
          ],
          sentences: [
            { en: 'hi mom', he: 'היי אמא', alt: ['hi, mom'], say: 'הַיי מוֹם' },
            { en: 'hi dad', he: 'היי אבא', alt: ['hi, dad'], say: 'הַיי דֶד' },
            { en: 'it is a dog', he: 'זה כלב', alt: ["it's a dog"], say: 'אִיט אִיז אַ דוֹג' },
            { en: 'it is in the box', he: 'זה בתוך הקופסה', alt: ["it's in the box"], say: 'אִיט אִיז אִין דַ בּוֹקְס' },
            { en: 'yes, it is hot', he: 'כן, זה חם', alt: ["yes, it's hot"], say: 'יֶס, אִיט אִיז הוֹט' },
            { en: 'mom has a cat', he: 'לאמא יש חתול', say: 'מוֹם הֶז אַ קֶט' }
          ]
        }
      ]
    },

    // ───────────────────────── Unit 1 ─────────────────────────
    {
      id: 'u1',
      title: 'צעדים ראשונים',
      desc: 'ברכות, היכרות, משפחה ומספרים',
      color: '#3DBE5B',
      lessons: [
        {
          id: 'u1l1', title: 'ברכות', icon: '👋',
          tip: 'Hello אומרים בכל שעה ביום. Good morning אומרים רק בבוקר, ו-Good night רק כשהולכים לישון. Thank you = תודה, ו-Please = בבקשה.',
          words: [
            { en: 'hello', he: 'שלום', emoji: '👋', alt: ['hi'], say: "הֶלוֹ" },
            { en: 'goodbye', he: 'להתראות', emoji: '🚶', alt: ['bye'], say: "גוּדְבַּיי" },
            { en: 'good morning', he: 'בוקר טוב', emoji: '🌅', say: "גוּד מוֹרְנִינְג" },
            { en: 'good night', he: 'לילה טוב', emoji: '🌙', say: "גוּד נַייט" },
            { en: 'thank you', he: 'תודה', emoji: '🙏', alt: ['thanks'], say: "תֶ'נְק יוּ" },
            { en: 'please', he: 'בבקשה', emoji: '🥺', say: "פְּלִיז" },
            { en: 'yes', he: 'כן', emoji: '✅', say: 'יֶס' },
            { en: 'no', he: 'לא', emoji: '❌', say: 'נוֹ' }
          ],
          sentences: [
            { en: 'Hello, how are you?', he: 'שלום, מה שלומך?', alt: ['Hi, how are you?'] },
            { en: 'Good morning', he: 'בוקר טוב' },
            { en: 'Thank you very much', he: 'תודה רבה', alt: ['Thanks a lot', 'Thank you so much'] },
            { en: 'Goodbye and good night', he: 'להתראות ולילה טוב', alt: ['Bye and good night'] },
            { en: 'Yes, please', he: 'כן, בבקשה' },
            { en: 'No, thank you', he: 'לא, תודה', alt: ['No, thanks'] }
          ]
        },
        {
          id: 'u1l2', title: 'אני ואתה', icon: '🙋',
          tip: 'באנגלית you יכול להיות אתה, את, אתם או אתן. לתיאור זהות או מצב עם I משתמשים ב־am: I am Dan = אני דן. בקיצור אפשר להגיד I\'m.',
          words: [
            { en: 'I', he: 'אני', emoji: '🙋', say: "אַיי" },
            { en: 'you', he: 'אתה / את', emoji: '👉', say: "יוּ" },
            { en: 'he', he: 'הוא', emoji: '👦', say: "הִי" },
            { en: 'she', he: 'היא', emoji: '👧', say: "שִׁי" },
            { en: 'we', he: 'אנחנו', emoji: '👫', say: "וִי" },
            { en: 'they', he: 'הם / הן', emoji: '👨‍👩‍👦', say: "דֵ'יי" },
            { en: 'name', he: 'שם', emoji: '🏷️', say: "נֵיים" },
            { en: 'friend', he: 'חבר / חברה', emoji: '🤝', say: "פְרֶנְד" }
          ],
          sentences: [
            { en: 'I am Dan', he: 'אני דן', alt: ["I'm Dan"] },
            { en: 'My name is Noa', he: 'השם שלי נועה', alt: ["My name's Noa"] },
            { en: 'What is your name?', he: 'מה השם שלך?', alt: ["What's your name?"] },
            { en: 'We are friends', he: 'אנחנו חברים', alt: ["We're friends"] },
            { en: 'He is Tom', he: 'הוא טום', alt: ["He's Tom"] },
            { en: 'She is my friend', he: 'היא החברה שלי', alt: ["She's my friend"] }
          ]
        },
        {
          id: 'u1l3', title: 'משפחה', icon: '👨‍👩‍👧',
          tip: 'כדי להגיד "יש לי" אומרים I have. למשל: I have a brother = יש לי אח. המילה a באה לפני שם עצם ביחיד (אחד).',
          words: [
            { en: 'mother', he: 'אמא', emoji: '👩', alt: ['mom', 'mum'], say: "מָאדֶ'ר" },
            { en: 'father', he: 'אבא', emoji: '👨', alt: ['dad'], say: "פָאדֶ'ר" },
            { en: 'brother', he: 'אח', emoji: '👦', say: "בְּרָאדֶ'ר" },
            { en: 'sister', he: 'אחות', emoji: '👧', say: "סִיסְטֶר" },
            { en: 'family', he: 'משפחה', emoji: '👨‍👩‍👧', say: "פֶמִילִי" },
            { en: 'baby', he: 'תינוק', emoji: '👶', say: "בֵּייבִּי" },
            { en: 'grandmother', he: 'סבתא', emoji: '👵', alt: ['grandma'], say: "גְרֶנְדְמָאדֶ'ר" },
            { en: 'grandfather', he: 'סבא', emoji: '👴', alt: ['grandpa'], say: "גְרֶנְדְפָאדֶ'ר" }
          ],
          sentences: [
            { en: 'This is my mother', he: 'זאת אמא שלי', alt: ['This is my mom', 'This is my mum'] },
            { en: 'I have a brother', he: 'יש לי אח' },
            { en: 'She is my sister', he: 'היא אחותי', alt: ["She's my sister"] },
            { en: 'I love my family', he: 'אני אוהב את המשפחה שלי' },
            { en: 'The baby is sleeping', he: 'התינוק ישן', alt: ["The baby's sleeping", 'The baby sleeps'] },
            { en: 'My father is a teacher', he: 'אבא שלי מורה', alt: ['My dad is a teacher'] }
          ]
        },
        {
          id: 'u1l4', title: 'מספרים', icon: '🔢',
          tip: 'כשיש יותר מאחד, מוסיפים s בסוף המילה: one brother, two brothers. ככה גם: one cat, three cats.',
          words: [
            { en: 'one', he: 'אחת (1)', emoji: '1️⃣', say: "וָאן" },
            { en: 'two', he: 'שתיים (2)', emoji: '2️⃣', say: "טוּ" },
            { en: 'three', he: 'שלוש (3)', emoji: '3️⃣', say: "ת'רִי" },
            { en: 'four', he: 'ארבע (4)', emoji: '4️⃣', say: "פוֹר" },
            { en: 'five', he: 'חמש (5)', emoji: '5️⃣', say: "פַייב" },
            { en: 'six', he: 'שש (6)', emoji: '6️⃣', say: "סִיקְס" },
            { en: 'seven', he: 'שבע (7)', emoji: '7️⃣', say: "סֶבֶן" },
            { en: 'eight', he: 'שמונה (8)', emoji: '8️⃣', say: "אֵייט" },
            { en: 'nine', he: 'תשע (9)', emoji: '9️⃣', say: "נַיין" },
            { en: 'ten', he: 'עשר (10)', emoji: '🔟', say: "טֶן" }
          ],
          sentences: [
            { en: 'I have two brothers', he: 'יש לי שני אחים' },
            { en: 'I have one sister', he: 'יש לי אחות אחת', alt: ['I have a sister'] },
            { en: 'She is ten', he: 'היא בת עשר', alt: ["She's ten", 'She is ten years old'] },
            { en: 'We have three cats', he: 'יש לנו שלושה חתולים' },
            { en: 'He is five years old', he: 'הוא בן חמש', alt: ['He is five', "He's five"] }
          ]
        }
      ]
    },

    // ───────────────────────── Unit 2 ─────────────────────────
    {
      id: 'u2',
      title: 'היום-יום שלי',
      desc: 'אוכל, הבית, צבעים וחיות',
      color: '#2FA8F0',
      lessons: [
        {
          id: 'u2l1', title: 'אוכל', icon: '🍎',
          tip: 'a באה לפני מילה שמתחילה בעיצור (a banana), ו-an לפני מילה שמתחילה בתנועה a/e/i/o/u (an apple, an egg).',
          words: [
            { en: 'apple', he: 'תפוח', emoji: '🍎', say: "אֶפֶּל" },
            { en: 'bread', he: 'לחם', emoji: '🍞', say: "בְּרֶד" },
            { en: 'water', he: 'מים', emoji: '💧', say: "ווֹטֶר" },
            { en: 'milk', he: 'חלב', emoji: '🥛', say: "מִילְק" },
            { en: 'egg', he: 'ביצה', emoji: '🥚', say: "אֶג" },
            { en: 'cheese', he: 'גבינה', emoji: '🧀', say: "צִ'יז" },
            { en: 'coffee', he: 'קפה', emoji: '☕', say: "קוֹפִי" },
            { en: 'tea', he: 'תה', emoji: '🍵', say: "טִי" }
          ],
          sentences: [
            { en: 'I eat an apple', he: 'אני אוכל תפוח', alt: ['I am eating an apple', "I'm eating an apple"] },
            { en: 'She drinks water', he: 'היא שותה מים', alt: ['She is drinking water', "She's drinking water"] },
            { en: 'I want coffee, please', he: 'אני רוצה קפה, בבקשה', alt: ['I want a coffee, please', 'Coffee, please'] },
            { en: 'The bread is fresh', he: 'הלחם טרי' },
            { en: 'Do you drink tea?', he: 'אתה שותה תה?' },
            { en: 'I like cheese', he: 'אני אוהב גבינה', alt: ['I love cheese'] }
          ]
        },
        {
          id: 'u2l2', title: 'בבית', icon: '🏠',
          tip: 'the = ה\' הידיעה. house = בית, the house = הבית. door = דלת, the door = הדלת.',
          words: [
            { en: 'house', he: 'בית', emoji: '🏠', alt: ['home'], say: "הָאוּס" },
            { en: 'room', he: 'חדר', emoji: '🛋️', say: "רוּם" },
            { en: 'table', he: 'שולחן', emoji: '🍽️', say: "טֵייבֶּל" },
            { en: 'chair', he: 'כיסא', emoji: '🪑', say: "צֶ'ייר" },
            { en: 'bed', he: 'מיטה', emoji: '🛏️', say: "בֶּד" },
            { en: 'door', he: 'דלת', emoji: '🚪', say: "דוֹר" },
            { en: 'window', he: 'חלון', emoji: '🪟', say: "וִינְדוֹאוּ" },
            { en: 'kitchen', he: 'מטבח', emoji: '🍳', say: "קִיצֶ'ן" }
          ],
          sentences: [
            { en: 'This is my house', he: 'זה הבית שלי', alt: ['This is my home'] },
            { en: 'The cat is on the bed', he: 'החתול על המיטה' },
            { en: 'Open the door, please', he: 'תפתח את הדלת, בבקשה', alt: ['Please open the door'] },
            { en: 'The kitchen is big', he: 'המטבח גדול' },
            { en: 'I am in my room', he: 'אני בחדר שלי', alt: ["I'm in my room"] },
            { en: 'The chair is new', he: 'הכיסא חדש' }
          ]
        },
        {
          id: 'u2l3', title: 'צבעים', icon: '🎨',
          tip: 'באנגלית התואר בא לפני שם העצם – הפוך מעברית! a red apple = תפוח אדום. a big house = בית גדול.',
          words: [
            { en: 'red', he: 'אדום', emoji: '🔴', say: "רֶד" },
            { en: 'blue', he: 'כחול', emoji: '🔵', say: "בְּלוּ" },
            { en: 'green', he: 'ירוק', emoji: '🟢', say: "גְרִין" },
            { en: 'yellow', he: 'צהוב', emoji: '🟡', say: "יֶלוֹאוּ" },
            { en: 'black', he: 'שחור', emoji: '⚫', say: "בְּלֶק" },
            { en: 'white', he: 'לבן', emoji: '⚪', say: "וַוייט" },
            { en: 'orange', he: 'כתום', emoji: '🟠', say: "אוֹרֶנְג'" },
            { en: 'purple', he: 'סגול', emoji: '🟣', say: "פֶּרְפֶּל" }
          ],
          sentences: [
            { en: 'The apple is red', he: 'התפוח אדום' },
            { en: 'I like blue', he: 'אני אוהב כחול', alt: ['I love blue'] },
            { en: 'The sky is blue', he: 'השמיים כחולים' },
            { en: 'My car is white', he: 'המכונית שלי לבנה' },
            { en: 'I have a black cat', he: 'יש לי חתול שחור' },
            { en: 'The grass is green', he: 'הדשא ירוק' }
          ]
        },
        {
          id: 'u2l4', title: 'חיות', icon: '🐶',
          tip: 'ברבים מוסיפים s: dog → dogs, cat → cats. יוצא דופן: fish נשאר fish גם ברבים.',
          words: [
            { en: 'dog', he: 'כלב', emoji: '🐶', say: "דוֹג" },
            { en: 'cat', he: 'חתול', emoji: '🐱', say: "קֶט" },
            { en: 'bird', he: 'ציפור', emoji: '🐦', say: "בֶּרְד" },
            { en: 'fish', he: 'דג', emoji: '🐟', say: "פִיש" },
            { en: 'horse', he: 'סוס', emoji: '🐴', say: "הוֹרְס" },
            { en: 'cow', he: 'פרה', emoji: '🐮', say: "קָאוּ" },
            { en: 'lion', he: 'אריה', emoji: '🦁', say: "לַאיֶן" },
            { en: 'rabbit', he: 'ארנב', emoji: '🐰', say: "רֶבִּיט" }
          ],
          sentences: [
            { en: 'The dog is big', he: 'הכלב גדול' },
            { en: 'I have a cat', he: 'יש לי חתול' },
            { en: 'The bird can fly', he: 'הציפור יכולה לעוף' },
            { en: 'The fish is in the water', he: 'הדג במים' },
            { en: 'Lions are strong', he: 'אריות חזקים' },
            { en: 'The horse is fast', he: 'הסוס מהיר' }
          ]
        }
      ]
    },

    // ───────────────────────── Unit 3 ─────────────────────────
    {
      id: 'u3',
      title: 'לדבר ולשאול',
      desc: 'פעלים, שאלות, זמנים ורגשות',
      color: '#A066F0',
      lessons: [
        {
          id: 'u3l1', title: 'פעלים', icon: '🏃',
          tip: 'עם he / she / it מוסיפים s לפועל: I read → he reads, I eat → she eats. "ל..." בעברית = to באנגלית: to eat = לאכול.',
          words: [
            { en: 'eat', he: 'לאכול', emoji: '🍽️', alt: ['to eat'] },
            { en: 'drink', he: 'לשתות', emoji: '🥤', alt: ['to drink'] },
            { en: 'sleep', he: 'לישון', emoji: '😴', alt: ['to sleep'] },
            { en: 'go', he: 'ללכת', emoji: '🚶', alt: ['to go', 'walk'] },
            { en: 'see', he: 'לראות', emoji: '👀', alt: ['to see'] },
            { en: 'want', he: 'לרצות', emoji: '🤲', alt: ['to want'] },
            { en: 'read', he: 'לקרוא', emoji: '📖', alt: ['to read'] },
            { en: 'write', he: 'לכתוב', emoji: '✍️', alt: ['to write'] }
          ],
          sentences: [
            { en: 'I want to sleep', he: 'אני רוצה לישון' },
            { en: 'We go to school', he: 'אנחנו הולכים לבית הספר', alt: ['We are going to school', "We're going to school"] },
            { en: 'He reads a book', he: 'הוא קורא ספר', alt: ['He is reading a book', "He's reading a book"] },
            { en: 'They write a letter', he: 'הם כותבים מכתב', alt: ['They are writing a letter', "They're writing a letter"] },
            { en: 'I see a dog', he: 'אני רואה כלב' },
            { en: 'She wants to eat', he: 'היא רוצה לאכול' }
          ]
        },
        {
          id: 'u3l2', title: 'שאלות', icon: '❓',
          tip: 'בשאלה עם am/is/are מחליפים את הסדר: You are happy (אתה שמח) → Are you happy? (אתה שמח?).',
          words: [
            { en: 'what', he: 'מה', emoji: '🤔' },
            { en: 'where', he: 'איפה', emoji: '📍' },
            { en: 'who', he: 'מי', emoji: '🕵️' },
            { en: 'when', he: 'מתי', emoji: '⏰' },
            { en: 'why', he: 'למה', emoji: '🤷' },
            { en: 'how', he: 'איך', emoji: '🛠️' },
            { en: 'how many', he: 'כמה (כמות)', emoji: '🔢' },
            { en: 'which', he: 'איזה', emoji: '👆' }
          ],
          sentences: [
            { en: 'Where is the bathroom?', he: 'איפה השירותים?', alt: ["Where's the bathroom?", 'Where is the toilet?', 'Where is the restroom?'] },
            { en: 'What is this?', he: 'מה זה?', alt: ["What's this?"] },
            { en: 'Who is she?', he: 'מי היא?', alt: ["Who's she?"] },
            { en: 'Why are you sad?', he: 'למה אתה עצוב?' },
            { en: 'When is the party?', he: 'מתי המסיבה?', alt: ["When's the party?"] },
            { en: 'How many cats do you have?', he: 'כמה חתולים יש לך?' }
          ]
        },
        {
          id: 'u3l3', title: 'זמן', icon: '📅',
          tip: 'was היא צורת העבר של am / is: I am home = אני בבית, I was home = הייתי בבית.',
          words: [
            { en: 'today', he: 'היום', emoji: '📆' },
            { en: 'tomorrow', he: 'מחר', emoji: '⏭️' },
            { en: 'yesterday', he: 'אתמול', emoji: '⏮️' },
            { en: 'morning', he: 'בוקר', emoji: '🌅' },
            { en: 'evening', he: 'ערב', emoji: '🌆' },
            { en: 'night', he: 'לילה', emoji: '🌙' },
            { en: 'day', he: 'יום', emoji: '☀️' },
            { en: 'week', he: 'שבוע', emoji: '🗓️' }
          ],
          sentences: [
            { en: 'Today is a good day', he: 'היום הוא יום טוב', alt: ["Today's a good day"] },
            { en: 'See you tomorrow', he: 'נתראה מחר' },
            { en: 'I was home yesterday', he: 'הייתי בבית אתמול', alt: ['I was at home yesterday', 'Yesterday I was home', 'Yesterday I was at home'] },
            { en: 'Good evening', he: 'ערב טוב' },
            { en: 'I work every day', he: 'אני עובד כל יום' },
            { en: 'See you next week', he: 'נתראה בשבוע הבא' }
          ]
        },
        {
          id: 'u3l4', title: 'רגשות', icon: '😊',
          tip: 'בעברית אומרים "אני עייף" בלי פועל, אבל באנגלית חובה את am / is / are: I am tired, She is happy, We are cold.',
          words: [
            { en: 'happy', he: 'שמח', emoji: '😀' },
            { en: 'sad', he: 'עצוב', emoji: '😢' },
            { en: 'tired', he: 'עייף', emoji: '😫' },
            { en: 'hungry', he: 'רעב', emoji: '😋' },
            { en: 'angry', he: 'כועס', emoji: '😠' },
            { en: 'cold', he: 'קר', emoji: '🥶' },
            { en: 'hot', he: 'חם', emoji: '🥵' },
            { en: 'scared', he: 'מפחד', emoji: '😨', alt: ['afraid'] }
          ],
          sentences: [
            { en: 'I am happy', he: 'אני שמח', alt: ["I'm happy"] },
            { en: 'She is tired', he: 'היא עייפה', alt: ["She's tired"] },
            { en: 'Are you hungry?', he: 'אתה רעב?' },
            { en: 'It is cold today', he: 'קר היום', alt: ["It's cold today", 'Today it is cold'] },
            { en: 'We are not angry', he: 'אנחנו לא כועסים', alt: ["We're not angry", "We aren't angry"] },
            { en: 'He is scared of dogs', he: 'הוא מפחד מכלבים', alt: ["He's scared of dogs", 'He is afraid of dogs'] }
          ]
        }
      ]
    },

    // ───────────────────────── Unit 4 ─────────────────────────
    {
      id: 'u4',
      title: 'בעיר',
      desc: 'מקומות, תחבורה, קניות וכיוונים',
      color: '#FF8A3D',
      lessons: [
        {
          id: 'u4l1', title: 'מקומות', icon: '🏙️',
          tip: 'to = אל / ל־ (תנועה): go to school. at / in = ב־ (מיקום): at the park, in the city.',
          words: [
            { en: 'school', he: 'בית ספר', emoji: '🏫' },
            { en: 'store', he: 'חנות', emoji: '🏪', alt: ['shop'] },
            { en: 'park', he: 'פארק', emoji: '🌳' },
            { en: 'hospital', he: 'בית חולים', emoji: '🏥' },
            { en: 'street', he: 'רחוב', emoji: '🛣️' },
            { en: 'city', he: 'עיר', emoji: '🏙️' },
            { en: 'beach', he: 'חוף', emoji: '🏖️' },
            { en: 'restaurant', he: 'מסעדה', emoji: '🍝' }
          ],
          sentences: [
            { en: 'The store is open', he: 'החנות פתוחה', alt: ['The shop is open'] },
            { en: "Let's go to the beach", he: 'בוא נלך לחוף', alt: ['Let us go to the beach'] },
            { en: 'The park is near my house', he: 'הפארק קרוב לבית שלי', alt: ['The park is close to my house'] },
            { en: 'I live in a big city', he: 'אני גר בעיר גדולה' },
            { en: 'We eat at a restaurant', he: 'אנחנו אוכלים במסעדה', alt: ['We are eating at a restaurant'] },
            { en: 'The hospital is on this street', he: 'בית החולים ברחוב הזה' }
          ]
        },
        {
          id: 'u4l2', title: 'תחבורה', icon: '🚌',
          tip: 'by + כלי תחבורה = נוסעים ב־: by bus = באוטובוס, by train = ברכבת, by car = במכונית.',
          words: [
            { en: 'car', he: 'מכונית', emoji: '🚗' },
            { en: 'bus', he: 'אוטובוס', emoji: '🚌' },
            { en: 'train', he: 'רכבת', emoji: '🚆' },
            { en: 'bike', he: 'אופניים', emoji: '🚲', alt: ['bicycle'] },
            { en: 'plane', he: 'מטוס', emoji: '✈️', alt: ['airplane'] },
            { en: 'taxi', he: 'מונית', emoji: '🚕', alt: ['cab'] },
            { en: 'boat', he: 'סירה', emoji: '⛵' },
            { en: 'ticket', he: 'כרטיס', emoji: '🎫' }
          ],
          sentences: [
            { en: 'I go by bus', he: 'אני נוסע באוטובוס', alt: ['I take the bus', 'I travel by bus'] },
            { en: 'The train is late', he: 'הרכבת מאחרת', alt: ['The train is delayed'] },
            { en: 'Where is the taxi?', he: 'איפה המונית?', alt: ["Where's the taxi?"] },
            { en: 'I need a ticket', he: 'אני צריך כרטיס' },
            { en: 'He rides a bike', he: 'הוא רוכב על אופניים', alt: ['He rides a bicycle', 'He is riding a bike'] },
            { en: 'The plane is big', he: 'המטוס גדול' }
          ]
        },
        {
          id: 'u4l3', title: 'קניות', icon: '🛍️',
          tip: 'How much = כמה (כסף). How many = כמה (כמות שאפשר לספור). this = הזה (קרוב), that = ההוא (רחוק).',
          words: [
            { en: 'money', he: 'כסף', emoji: '💰' },
            { en: 'price', he: 'מחיר', emoji: '🏷️' },
            { en: 'cheap', he: 'זול', emoji: '🪙' },
            { en: 'expensive', he: 'יקר', emoji: '💎' },
            { en: 'buy', he: 'לקנות', emoji: '🛒', alt: ['to buy'] },
            { en: 'sell', he: 'למכור', emoji: '🤝', alt: ['to sell'] },
            { en: 'shirt', he: 'חולצה', emoji: '👕' },
            { en: 'shoes', he: 'נעליים', emoji: '👟' }
          ],
          sentences: [
            { en: 'How much is this?', he: 'כמה זה עולה?', alt: ['How much does this cost?', 'How much is it?'] },
            { en: 'This shirt is expensive', he: 'החולצה הזאת יקרה' },
            { en: 'I want to buy shoes', he: 'אני רוצה לקנות נעליים' },
            { en: 'It is very cheap', he: 'זה מאוד זול', alt: ["It's very cheap"] },
            { en: 'Do you have money?', he: 'יש לך כסף?' },
            { en: 'What is the price?', he: 'מה המחיר?', alt: ["What's the price?"] }
          ]
        },
        {
          id: 'u4l4', title: 'כיוונים', icon: '🧭',
          tip: 'הוראות באנגלית מתחילות ישר בפועל, בלי "אתה": Turn left = פנה שמאלה, Go straight = לך ישר.',
          words: [
            { en: 'left', he: 'שמאלה', emoji: '⬅️' },
            { en: 'right', he: 'ימינה', emoji: '➡️' },
            { en: 'straight', he: 'ישר', emoji: '⬆️' },
            { en: 'near', he: 'קרוב', emoji: '📏', alt: ['close'] },
            { en: 'far', he: 'רחוק', emoji: '🔭' },
            { en: 'here', he: 'כאן', emoji: '📍' },
            { en: 'there', he: 'שם', emoji: '👉' },
            { en: 'map', he: 'מפה', emoji: '🗺️' }
          ],
          sentences: [
            { en: 'Turn left', he: 'פנה שמאלה' },
            { en: 'It is not far', he: 'זה לא רחוק', alt: ["It's not far", "It isn't far"] },
            { en: 'The bank is on the right', he: 'הבנק בצד ימין' },
            { en: 'Go straight', he: 'לך ישר', alt: ['Go straight ahead'] },
            { en: 'I am here', he: 'אני כאן', alt: ["I'm here"] },
            { en: 'Do you have a map?', he: 'יש לך מפה?' }
          ]
        }
      ]
    },

    // ───────────────────────── Unit 5 ─────────────────────────
    {
      id: 'u5',
      title: 'שיחות אמיתיות',
      desc: 'מסעדה, עבודה, תחביבים ומזג אוויר',
      color: '#F25A8C',
      lessons: [
        {
          id: 'u5l1', title: 'במסעדה', icon: '🍽️',
          tip: 'I would like (או בקיצור I\'d like) היא דרך מנומסת להגיד "אני רוצה". Can I...? = אפשר...?',
          words: [
            { en: 'menu', he: 'תפריט', emoji: '📋' },
            { en: 'waiter', he: 'מלצר', emoji: '🤵' },
            { en: 'order', he: 'להזמין', emoji: '📝', alt: ['to order'] },
            { en: 'check', he: 'חשבון', emoji: '🧾', alt: ['bill'] },
            { en: 'delicious', he: 'טעים', emoji: '😋', alt: ['tasty'] },
            { en: 'dessert', he: 'קינוח', emoji: '🍰' },
            { en: 'salad', he: 'סלט', emoji: '🥗' },
            { en: 'juice', he: 'מיץ', emoji: '🧃' }
          ],
          sentences: [
            { en: 'Can I see the menu?', he: 'אפשר לראות את התפריט?', alt: ['May I see the menu?', 'Can I see the menu, please?'] },
            { en: 'I would like a salad', he: 'הייתי רוצה סלט', alt: ["I'd like a salad"] },
            { en: 'The food is delicious', he: 'האוכל טעים', alt: ['The food is tasty'] },
            { en: 'The check, please', he: 'חשבון, בבקשה', alt: ['The bill, please', 'Check, please', 'Bill, please'] },
            { en: 'I want orange juice', he: 'אני רוצה מיץ תפוזים', alt: ['I would like orange juice', "I'd like orange juice"] },
            { en: 'We want to order', he: 'אנחנו רוצים להזמין' }
          ]
        },
        {
          id: 'u5l2', title: 'עבודה', icon: '💼',
          tip: 'לפני מקצוע ביחיד שמים a: She is a doctor, I am a teacher. (בעברית פשוט: היא רופאה).',
          words: [
            { en: 'work', he: 'עבודה', emoji: '💼', alt: ['job'] },
            { en: 'office', he: 'משרד', emoji: '🏢' },
            { en: 'teacher', he: 'מורה', emoji: '🧑‍🏫' },
            { en: 'doctor', he: 'רופא', emoji: '🧑‍⚕️' },
            { en: 'student', he: 'סטודנט / תלמיד', emoji: '🎓' },
            { en: 'boss', he: 'בוס', emoji: '😎', alt: ['manager'] },
            { en: 'computer', he: 'מחשב', emoji: '💻' },
            { en: 'meeting', he: 'פגישה', emoji: '👥' }
          ],
          sentences: [
            { en: 'I work in an office', he: 'אני עובד במשרד' },
            { en: 'She is a doctor', he: 'היא רופאה', alt: ["She's a doctor"] },
            { en: 'My teacher is nice', he: 'המורה שלי נחמדה' },
            { en: 'The meeting is at ten', he: 'הפגישה בעשר', alt: ["The meeting's at ten", 'The meeting is at ten o\'clock'] },
            { en: 'I use a computer', he: 'אני משתמש במחשב' },
            { en: 'He is a student', he: 'הוא סטודנט', alt: ["He's a student"] }
          ]
        },
        {
          id: 'u5l3', title: 'תחביבים', icon: '🎮',
          tip: 'like + to + פועל: I like to swim = אני אוהב לשחות. אפשר גם להוסיף ing: I like swimming.',
          words: [
            { en: 'music', he: 'מוזיקה', emoji: '🎵' },
            { en: 'sport', he: 'ספורט', emoji: '⚽', alt: ['sports'] },
            { en: 'movie', he: 'סרט', emoji: '🎬', alt: ['film'] },
            { en: 'game', he: 'משחק', emoji: '🎮' },
            { en: 'dance', he: 'לרקוד', emoji: '💃', alt: ['to dance'] },
            { en: 'sing', he: 'לשיר', emoji: '🎤', alt: ['to sing'] },
            { en: 'swim', he: 'לשחות', emoji: '🏊', alt: ['to swim'] },
            { en: 'cook', he: 'לבשל', emoji: '👩‍🍳', alt: ['to cook'] }
          ],
          sentences: [
            { en: 'I like to dance', he: 'אני אוהב לרקוד', alt: ['I like dancing', 'I love to dance', 'I love dancing'] },
            { en: 'We watch a movie', he: 'אנחנו צופים בסרט', alt: ['We are watching a movie', "We're watching a movie"] },
            { en: 'She can sing', he: 'היא יודעת לשיר' },
            { en: 'Do you like music?', he: 'אתה אוהב מוזיקה?' },
            { en: 'He swims every day', he: 'הוא שוחה כל יום' },
            { en: 'My mother likes to cook', he: 'אמא שלי אוהבת לבשל', alt: ['My mother likes cooking', 'My mom likes to cook'] }
          ]
        },
        {
          id: 'u5l4', title: 'מזג אוויר', icon: '🌦️',
          tip: 'על מזג אוויר מדברים עם It: It is cold = קר, It is raining = יורד גשם. ה-It לא מתורגם לעברית.',
          words: [
            { en: 'sun', he: 'שמש', emoji: '☀️' },
            { en: 'rain', he: 'גשם', emoji: '🌧️' },
            { en: 'snow', he: 'שלג', emoji: '❄️' },
            { en: 'wind', he: 'רוח', emoji: '💨' },
            { en: 'cloud', he: 'ענן', emoji: '☁️' },
            { en: 'weather', he: 'מזג אוויר', emoji: '🌦️' },
            { en: 'summer', he: 'קיץ', emoji: '🏖️' },
            { en: 'winter', he: 'חורף', emoji: '⛄' }
          ],
          sentences: [
            { en: 'It is raining', he: 'יורד גשם', alt: ["It's raining"] },
            { en: 'The sun is hot', he: 'השמש חמה' },
            { en: 'I love the summer', he: 'אני אוהב את הקיץ', alt: ['I love summer'] },
            { en: 'It is cold in winter', he: 'קר בחורף', alt: ["It's cold in winter", 'In winter it is cold'] },
            { en: 'What is the weather like today?', he: 'מה מזג האוויר היום?', alt: ["What's the weather today?", "What's the weather like today?", 'How is the weather today?'] },
            { en: 'There is snow on the mountain', he: 'יש שלג על ההר' }
          ]
        }
      ]
    }
  ]
};
