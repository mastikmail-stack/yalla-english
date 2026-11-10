/* Teaching sequence and placement data. Loaded after data.js; no build required. */
(function () {
  'use strict';
  const word = (en, he, say, emoji = '💬') => ({ en, he, say, emoji });
  const sentence = (en, he, explanation) => ({ en, he, explanation });
  const phonics = {
    id: 'up', title: 'סודות הקריאה', desc: 'אותיות מתחברות לצלילים', color: '#4779C4', stage: 'starter',
    lessons: [
      { id: 'upl1', title: 'SH ו־CH', icon: '🚢',
        tip: 'שם האות אינו הצליל שלה במילה. לפעמים שתי אותיות יוצרות צליל אחד: sh כמו שׁ ב־ship; ch כמו צ׳ ב־chip. אומרים את הצלילים ומחברים למילה, ולא מקריאים את שמות האותיות. התעתיק בעברית הוא עזרה משוערת בלבד — הקשיבו גם להקראה.',
        words: [word('ship','ספינה','שִׁיפּ','🚢'), word('shop','חנות','שׁוֹפּ','🏪'), word('fish','דג','פִישׁ','🐟'), word('dish','צלחת','דִישׁ','🍽️'), word('chip','צ׳יפס בודד','צִ׳יפּ','🍟'), word('chin','סנטר','צִ׳ין','🙂')],
        sentences: [sentence('a big ship','ספינה גדולה','התואר big בא לפני שם העצם ship.'), sentence('a fish and a chip','דג וצ׳יפס בודד','fish מסתיימת ב־sh; chip מתחילה ב־ch. אלו צלילים שונים.'), sentence('a red dish','צלחת אדומה','a באה לפני שם עצם יחיד שאינו מיודע.'), sentence('a big shop','חנות גדולה','sh נשמע כצליל אחד, גם בתחילת המילה וגם בסופה.')]
      },
      { id: 'upl2', title: 'שני הצלילים של TH', icon: '👄',
        tip: 'ל־th שני צלילים שאין להם מקבילה מדויקת בעברית. ב־thin מוציאים אוויר כשהלשון נוגעת בעדינות בין השיניים, בלי רטט בגרון. ב־this עושים אותו דבר עם רטט. אל תחליפו אוטומטית בס׳, ת׳ או ד׳. הקשיבו, האטו וחזרו בקול.',
        words: [word('thin','דק','ת׳ִין'), word('thick','עבה','ת׳ִיק'), word('three','שלוש','ת׳ְרִי','3️⃣'), word('bath','אמבטיה','בַּאת׳','🛁'), word('this','זה / זאת','ד׳ִיס','👇'), word('that','ההוא / ההיא','ד׳ֶאט','👉')],
        sentences: [sentence('this cat','החתול הזה','this בא לפני שם העצם, ו־th כאן קולי.'), sentence('that dog','הכלב ההוא','that מצביע על משהו רחוק יותר; th קולי.'), sentence('three cats','שלושה חתולים','אחרי three משתמשים ברבים: cats. ב־three ה־th אינו קולי.'), sentence('a thin cat','חתול רזה','thin מתאר משהו דק או רזה; כאן th אינו קולי.')]
      },
      { id: 'upl3', title: 'EE, EA ו־OO', icon: '🌳',
        tip: 'ee נשמע בדרך כלל כמו אִי ארוכה: see, tree. גם ea יכול להישמע כך: tea, sea — אבל ב־bread הצליל קצר, כמו ב־red. גם oo משתנה: moon ו־food נשמעים אחרת מ־book. לא מנחשים לפי כלל אחד; מקשיבים ומשווים.',
        words: [word('see','לראות','סִי','👀'), word('tree','עץ','טְרִי','🌳'), word('tea','תה','טִי','🍵'), word('sea','ים','סִי','🌊'), word('bread','לחם','בְּרֶד','🍞'), word('moon','ירח','מוּן','🌙'), word('food','אוכל','פוּד','🍽️'), word('book','ספר','בּוּק','📖')],
        sentences: [sentence('a book and a pen','ספר ועט','ב־book הצליל של oo קצר יותר מאשר ב־moon.'), sentence('I see a tree','אני רואה עץ','I = אני; see = רואה; a tree = עץ. ב־see וב־tree הצליל זהה.'), sentence('tea and bread','תה ולחם','בשתי המילים יש ea, אבל ההגייה שונה. לחצו להקשבה והשוו.'), sentence('the moon','הירח','the מציין דבר ידוע; ב־moon יש צליל oo ארוך.')]
      },
      { id: 'upl4', title: 'ה־E השקטה', icon: '✨',
        tip: 'במילים רבות e בסוף לא נשמעת, אבל משנה את התנועה לפניה: cap → cape, kit → kite, not → note. זה דפוס נפוץ ולא חוק בלי חריגים: have ו־give יוצאות דופן. השוו בהקראה בין כל זוג.',
        words: [word('cap','כובע מצחייה','קֶפּ','🧢'), word('cape','גלימה','קֵייפּ','🦸'), word('kit','ערכה','קִיט','🧰'), word('kite','עפיפון','קַייט','🪁'), word('not','לא (לשלילה)','נוֹט','🚫'), word('note','פתק','נוֹאוּט','📝'), word('have','יש / להיות בעלים של','הֶאב'), word('give','לתת','גִיב','🎁')],
        sentences: [sentence('a red kite','עפיפון אדום','ב־kite ה־e שקטה וה־i נשמעת כמו שם האות I.'), sentence('I have a cap','יש לי כובע מצחייה','have היא חריגה: e שקטה, אבל a אינה נשמעת כמו שם האות A.'), sentence('a note in a book','פתק בתוך ספר','in = בתוך. note ו־not נבדלות בצליל התנועה.'), sentence('a red cape','גלימה אדומה','cape מסתיימת ב־e שקטה; a נשמעת כמו שם האות A.')]
      }
    ]
  };
  const foundations = {
    id: 'uf', title: 'בונים משפטים', desc: 'הדקדוק שעוזר לדבר', color: '#8A68CE', stage: 'guided',
    lessons: [
      { id: 'ufl1', title: 'am, is, are', icon: '🧩',
        tip: 'באנגלית משפט כמו ״אני שמח״ צריך פועל: I am happy. משתמשים ב־am עם I, ב־is עם he/she/it וב־are עם you/we/they. לשאלה מחליפים סדר: Are you happy? לשלילה מוסיפים not: I am not sad.',
        words: [word('happy','שמח','הֶפִּי','😊'), word('sad','עצוב','סֶד','😢'), word('tired','עייף','טַייֶרְד','😴'), word('ready','מוכן','רֶדִי','✅'), word('we','אנחנו','וִי','👫'), word('they','הם / הן','דֵ׳יי','👥')],
        sentences: [sentence('I am happy','אני שמח','עם I משתמשים ב־am. באנגלית אי אפשר להשמיט אותו כאן.'), sentence('She is tired','היא עייפה','עם she משתמשים ב־is.'), sentence('We are ready','אנחנו מוכנים','עם we משתמשים ב־are.'), sentence('Are you happy?','האם אתם שמחים?','בשאלה Are בא לפני you.'), sentence('They are not sad','הם לא עצובים','not בא אחרי are לשלילה.'), sentence('He is ready','הוא מוכן','עם he משתמשים ב־is.')]
      },
      { id: 'ufl2', title: 'a, an ו־the', icon: '🍎',
        tip: 'לפני שם עצם ספיר ביחיד בדרך כלל צריך a/an או the. בוחרים a לפני צליל של עיצור ו־an לפני צליל של תנועה: a cat, an apple. הבחירה לפי הצליל, לא רק האות! the = ה׳ הידיעה. ברבים מוסיפים בדרך כלל s, בלי a/an.',
        words: [word('apple','תפוח','אֶפֶּל','🍎'), word('egg','ביצה','אֶג','🥚'), word('cat','חתול','קֶט','🐱'), word('dog','כלב','דוֹג','🐶'), word('big','גדול','בִּיג','🐘'), word('small','קטן','סְמוֹל','🐭')],
        sentences: [sentence('an apple','תפוח','apple מתחילה בצליל של תנועה ולכן an.'), sentence('a cat','חתול','cat מתחילה בצליל של עיצור ולכן a.'), sentence('the big dog','הכלב הגדול','the = ה׳ הידיעה; big בא לפני dog.'), sentence('an egg','ביצה','egg מתחילה בצליל של תנועה ולכן an.'), sentence('two small cats','שני חתולים קטנים','אחרי two בא cats ברבים. התואר small אינו מקבל s.'), sentence('a big apple','תפוח גדול','המילה שאחרי a היא big, שמתחילה בצליל של עיצור.')]
      },
      { id: 'ufl3', title: 'יש לי, בתוך ועל', icon: '🎒',
        tip: 'I/you/we/they have = יש לי/לך/לנו/להם. עם he/she/it משתמשים ב־has. my = שלי; your = שלך/שלכם. in = בתוך; on = על; under = מתחת. למשל: My bag is on the bed.',
        words: [word('bag','תיק','בֶּג','🎒'), word('box','קופסה','בּוֹקְס','📦'), word('bed','מיטה','בֶּד','🛏️'), word('in','בתוך','אִין','📥'), word('on','על','אוֹן','⬆️'), word('under','מתחת','אַנְדֶר','⬇️')],
        sentences: [sentence('I have a bag','יש לי תיק','עם I משתמשים ב־have.'), sentence('She has a cat','יש לה חתול','עם she משתמשים ב־has, ולא have.'), sentence('The cat is in the box','החתול בתוך הקופסה','in = בתוך; is מחבר את הנושא לתיאור המיקום.'), sentence('My bag is on the bed','התיק שלי על המיטה','my בא לפני bag; on = על.'), sentence('The dog is under the bed','הכלב מתחת למיטה','under = מתחת.'), sentence('You have a box','יש לכם קופסה','you יכול להיות אתה, את, אתם או אתן; עם כולם משתמשים ב־have.')]
      },
      { id: 'ufl4', title: 'פעולות ושאלות', icon: '💬',
        tip: 'להרגלים משתמשים בהווה פשוט: I eat, she eats. בשאלות עם פועל רגיל מוסיפים do/does: Do you eat? Does she eat? אחרי does הפועל חוזר לצורת הבסיס, בלי s. בשלילה: I do not eat; she does not eat.',
        words: [word('eat','לאכול','אִיט','🍽️'), word('drink','לשתות','דְרִינְק','🥤'), word('like','לאהוב / לחבב','לַייק','❤️'), word('read','לקרוא','רִיד','📖'), word('water','מים','ווֹטֶר','💧'), word('milk','חלב','מִילְק','🥛')],
        sentences: [sentence('I drink water','אני שותה מים','בהווה פשוט עם I משתמשים ב־drink.'), sentence('She drinks milk','היא שותה חלב','בהווה פשוט מוסיפים s עם she: drinks.'), sentence('Do you like milk?','האם אתם אוהבים חלב?','בשאלה עם like ו־you משתמשים ב־Do.'), sentence('Does he read?','האם הוא קורא?','אחרי Does משתמשים ב־read, בלי s.'), sentence('I do not like milk','אני לא אוהב חלב','השלילה עם like היא do not like.'), sentence('She does not eat bread','היא לא אוכלת לחם','אחרי does not משתמשים ב־eat, בלי s.')]
      }
    ]
  };
  const units = window.COURSE.units;
  units.splice(units.findIndex(u => u.id === 'u1'), 0, phonics);
  units.splice(units.findIndex(u => u.id === 'u2'), 0, foundations);
  units.forEach(u => { u.stage = u.stage || (u.id === 'ua' ? 'letters' : u.id === 'ub' ? 'starter' : ['u1','u2'].includes(u.id) ? 'guided' : 'independent'); });

  // A start point opens earlier lessons for optional review; it never awards completion.
  window.LEARNING_LEVELS = [
    { id:'zero', title:'מתחילים מאפס', desc:'עוד לא מכירים את האותיות. נתחיל יחד, בלי לחץ.', start:'ual1', icon:'🌱' },
    { id:'letters', title:'מכירים את האותיות', desc:'מזהים ABC ורוצים להתחיל לקרוא מילים קצרות.', start:'ubl1', icon:'🔤' },
    { id:'some', title:'יודעים קצת', desc:'קוראים מילים קצרות; נחזק צלילים וצירופי אותיות.', start:'upl1', icon:'🌿' },
    { id:'basic', title:'יש בסיס', desc:'קוראים מילים ורוצים לבנות אוצר מילים ומשפטים.', start:'u1l1', icon:'👋' },
    { id:'middle', title:'בינונית — מחזקים משפטים', desc:'מכירים מילים וברכות; רוצים סדר בדקדוק הבסיסי.', start:'ufl1', icon:'🧩' },
    { id:'good', title:'טובה — מדברים ביום־יום', desc:'בונים משפטים פשוטים; מתרגלים פעולות ושאלות.', start:'u3l1', icon:'💬' },
    { id:'strong', title:'טובה מאוד / מעולה', desc:'אפשר להתחיל בשיחות יומיומיות ולחזור חופשי על כל הבסיס. קורס מתקדם מלא עדיין לא קיים.', start:'u5l1', icon:'🚀' }
  ];
  // Brief routing check, not a standardized proficiency assessment.
  window.PLACEMENT_QUESTIONS = [
    { gate:0, prompt:'מהי האות הקטנה של B?', options:['d','b','p','q'], answer:'b', explanation:'האות הקטנה של B היא b. שימו לב לכיוון העיגול.' },
    { gate:0, prompt:'איזו אות פותחת את המילה dog?', options:['g','o','b','d'], answer:'d', explanation:'קוראים משמאל לימין: האות הראשונה ב־dog היא d.' },
    { gate:1, prompt:'איך אומרים ״חתול״?', options:['dog','hat','cat','sun'], answer:'cat', explanation:'cat = חתול; hat = כובע.' },
    { gate:1, prompt:'מה פירוש red pen?', options:['עט אדום','מיטה גדולה','חתול אדום','תיק קטן'], answer:'עט אדום', explanation:'red = אדום, pen = עט. התואר בא לפני שם העצם.' },
    { gate:2, prompt:'באיזו מילה יש הצליל שׁ?', options:['chip','ship','cat','pen'], answer:'ship', explanation:'ב־ship הצירוף sh נשמע כמו שׁ; ב־chip הצירוף ch נשמע כמו צ׳.' },
    { gate:2, prompt:'באיזו מילה ה־e בסוף שקטה ומשנה את הצליל של i?', options:['kit','sit','kite','fish'], answer:'kite', explanation:'kit → kite: ב־kite ה־i נשמעת כמו שם האות I.' },
    { gate:3, prompt:'מה פירוש Thank you?', options:['בוקר טוב','להתראות','בבקשה','תודה'], answer:'תודה', explanation:'Thank you = תודה. Please = בבקשה.' },
    { gate:3, prompt:'מה פירוש This is my brother?', options:['זאת אחותי','זה אחי','זה אבא שלי','זה החבר שלך'], answer:'זה אחי', explanation:'my = שלי; brother = אח.' },
    { gate:4, prompt:'בחרו את ההשלמה: She ___ happy.', options:['am','are','is','be'], answer:'is', explanation:'עם she משתמשים ב־is: She is happy.' },
    { gate:4, prompt:'בחרו את המשפט הנכון: ״האם הוא קורא?״', options:['Does he reads?','Do he read?','He does reads?','Does he read?'], answer:'Does he read?', explanation:'אחרי Does הפועל בצורת הבסיס, בלי s.' },
    { gate:5, prompt:'איך אומרים ״כמה זה עולה?״', options:['How many is this?','How much is this?','Where is this?','Who is this?'], answer:'How much is this?', explanation:'How much שואל על מחיר; How many שואל על כמות שאפשר לספור.' },
    { gate:5, prompt:'מה פירוש I would like a salad?', options:['אני אוהב לבשל','הסלט יקר','הייתי רוצה סלט','הזמנתי סלט אתמול'], answer:'הייתי רוצה סלט', explanation:'I would like היא דרך מנומסת לבקש משהו.' }
  ];
})();
