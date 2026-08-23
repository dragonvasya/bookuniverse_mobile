/**
 * db.js — In-memory data store persisted to localStorage.
 * Schema: { cities[], clubs[], books[] }
 * books can have optional coverUrl for a real image.
 */

const STORAGE_KEY = 'book-club-universe-v102';

const SEED = {
    venues: [
        { id: 'v1', name: 'Chère Maman', address: 'Трубная 26, корп.1' },
        { id: 'v2', name: 'Nostalgia', address: '2-я Песчаная, 4' },
        { id: 'v3', name: 'Études Café', address: 'Покровка, 38А' }
    ],
    cities: [
        { id: 'c1', name: 'Москва', population: 12500, color: '#ff9944' },
        { id: 'c2', name: 'Санкт-Петербург', population: 5400, color: '#4499ff' },
        { id: 'c4', name: 'Екатеринбург', population: 1530000, color: '#aa3333' },
        { id: 'c5', name: 'Тюмень', population: 860000, color: '#33aa33' },
        { id: 'c6', name: 'Онлайн', population: 53600, color: '#33ddaa', hideSun: true },
        { id: 'c7', name: 'Онлайн', population: 1000000, color: '#f3b066', hideSun: true },
        { id: 'c8', name: 'Онлайн', population: 500000, color: '#cc88ff', hideSun: true },
        { id: 'c9', name: 'Белград', population: 1700000, color: '#7ec8a0' },
        { id: 'c10', name: 'Дубай' },
    ],
    clubs: [
        // Real clubs
        { id: 'cl1', name: 'Книжный клуб SOK', cityId: 'c1', members: 457, color: '#bb44ff',
            archetype: {
                title: '🧬 «Люди, которые хотят прожить большую жизнь осознанно»',
                description: '<div class="arc-section"><div class="arc-label">🏛️ Профиль клуба</div><div class="arc-traits">Это не клуб литераторов.<br>Не клуб фантастов.<br>Не бизнес-клуб.<br>Не философский кружок.<br><br>Это клуб людей, которых интересует вопрос:<br><b>«Как прожить жизнь масштабно, сохранив себя?»</b></div></div><div class="arc-section"><div class="arc-label">📊 ДНК клуба</div><div class="arc-dna-row"><span class="arc-pct">30%</span><span class="arc-cat">Личностный рост и психология</span></div><div class="arc-dna-row"><span class="arc-pct">25%</span><span class="arc-cat">Самореализация и успех</span></div><div class="arc-dna-row"><span class="arc-pct">20%</span><span class="arc-cat">Классика о смысле жизни</span></div><div class="arc-dna-row"><span class="arc-pct">15%</span><span class="arc-cat">Гуманистическая литература</span></div><div class="arc-dna-row"><span class="arc-pct">10%</span><span class="arc-cat">Научная фантастика и большие идеи</span></div></div><div class="arc-section"><div class="arc-label">🎯 Средний уровень читателя</div><div class="arc-traits">Это выше среднего книжного клуба, но не академический уровень.</div><br><div class="arc-complexity"><span>Глубина</span><div class="arc-bar-wrap"><div class="arc-bar" style="width:75%"></div></div><span class="arc-val">7.5/10</span></div></div><div class="arc-section"><div class="arc-label">👥 Кто типичный участник</div><div class="arc-traits"><b>Человек, который органично впишется сюда, скорее всего уже читал:</b><ul class="arc-formats-list"><li>Мастер и Маргарита;</li><li>1984;</li><li>Цветы для Элджернона;</li><li>Атлант расправил плечи.</li></ul></div></div>'
            }
        },
        { id: 'cl8', name: 'Школа Великих книг', cityId: 'c1', members: 3000, color: '#ffffff',
            archetype: {
                title: '🔭 «Клуб первоисточников»',
                description: '<div class="arc-section"><div class="arc-label">Что бросается в глаза</div><div class="arc-absent"><b>Практически отсутствуют:</b> художественная литература, бестселлеры, саморазвитие, популярные нон-фикшн пересказы.</div><div class="arc-present"><b>Очень много:</b> академических первоисточников · нон-фикшна о природе человека · книг, которые сами стали основой для других книг · текстов, требующих вдумчивого чтения.</div></div><div class="arc-section"><div class="arc-label">📊 ДНК клуба</div><div class="arc-dna-row"><span class="arc-pct">30%</span><span class="arc-cat">Психология и поведение</span></div><div class="arc-examples">Игры, в которые играют люди · Человек убеждённый · Агрессия</div><div class="arc-dna-row"><span class="arc-pct">25%</span><span class="arc-cat">Философия науки и культуры</span></div><div class="arc-examples">Как читать книги · Миф машины · Семиотика</div><div class="arc-dna-row"><span class="arc-pct">20%</span><span class="arc-cat">Этология и биология</span></div><div class="arc-examples">Эгоистичный ген · Агрессия · В поисках чудесного</div><div class="arc-dna-row"><span class="arc-pct">15%</span><span class="arc-cat">Структурализм и семиотика</span></div><div class="arc-examples">Морфология волшебной сказки · Семиотика</div><div class="arc-dna-row"><span class="arc-pct">10%</span><span class="arc-cat">Эзотерика и метафизика</span></div><div class="arc-examples">В поисках чудесного · Древний человек в городе</div></div><div class="arc-section"><div class="arc-label">🎯 Уровень сложности</div><div class="arc-complexity"><span>Интеллектуальная</span><div class="arc-bar-wrap"><div class="arc-bar" style="width:90%"></div></div><span class="arc-val">9/10</span></div><div class="arc-complexity"><span>Эмоциональная</span><div class="arc-bar-wrap"><div class="arc-bar arc-bar-em" style="width:50%"></div></div><span class="arc-val">5/10</span></div></div><div class="arc-section"><div class="arc-label">👥 Типичный участник</div><div class="arc-traits">Читает медленно и глубоко · интересуется дисциплинами на стыке наук · не доверяет популярным пересказам · ищет первопричины явлений · возможно, связан с академической средой</div></div>'
            }
        },
        { id: 'cl10', name: 'Между строк', cityId: 'c1', members: 3700, color: '#33ddaa', founded: 2022 },
        { id: 'cl14', name: 'Книжный четверг', cityId: 'c1', members: 1400, color: '#dd6644', memberLabel: 'подписчиков', organizer: 'Магнит' },
        { id: 'cl9', name: 'Книжный клуб Всмысле', cityId: 'c2', members: 4900, color: '#55aaff' },
        { id: 'cl6', name: 'Книжный клуб Ольги Чебыкиной', cityId: 'c7', members: 30, color: '#f3b066', isCentral: true, hasLogo: true },
        { id: 'cl7', name: 'Книжный клуб SOK Екб', cityId: 'c4', members: 75, color: '#111111' },
        { id: 'cl20', name: 'Книжный клуб "Ты, твой друг и книга"', cityId: 'c4', members: 560, color: '#cc2222', hasLogo: true },
        { id: 'cl18', name: 'Книжный клуб SOK Спб', cityId: 'c2', members: 50, color: '#bb44ff', organizer: 'SOK', hasLogo: true },
        { id: 'cl16', name: 'Шалость удалась', cityId: 'c1', members: 212, color: '#d8bc98', founded: 2024, hasLogo: true },
        { id: 'cl17', name: 'Книжный клуб МГУ', cityId: 'c1', members: 1000, color: '#aa33ff', hasLogo: true , archetype: { title: 'Клуб человека на границе свободы, морали и абсурда', description: `Клуб постоянно возвращается к одному вопросу: «Что остаётся от человека, когда рушатся привычные опоры — Бог, государство, любовь, разум, мораль, свобода?» Именно поэтому рядом оказываются Камю, Достоевский, Сартр, Кафка, Толстой, Франкл, Фромм, Хаксли, Пелевин и Лю Цысинь.<br><br>Если материализовать клуб в персонажа: 35–50 лет, гуманитарное или очень хорошее техническое образование плюс самообразование. Интеллект высокий, отношение к авторитетам скептическое. Главный страх — прожить чужую жизнь. Главный конфликт — свобода и ответственность. Главное желание — понять устройство человека и мира. Главная слабость — можно слишком долго анализировать жизнь вместо того, чтобы жить.<br><br><div style="font-weight: 700; margin-bottom: 12px; font-size: 1.1em;">📊 ДНК клуба</div><div style="margin-bottom: 12px;">  <div style="display: flex; align-items: baseline; gap: 8px;">    <span style="font-weight: 700; font-size: 1.2em; color: #aa33ff;">19%</span>    <span style="font-weight: 700;">Человек и его внутренняя природа</span>  </div>  <div style="font-size: 0.9em; opacity: 0.8; margin-top: 2px;">Почему человек поступает именно так; противоречия, самообман, идентичность, психика</div></div><div style="margin-bottom: 12px;">  <div style="display: flex; align-items: baseline; gap: 8px;">    <span style="font-weight: 700; font-size: 1.2em; color: #aa33ff;">17%</span>    <span style="font-weight: 700;">Смысл жизни и экзистенциальные вопросы</span>  </div>  <div style="font-size: 0.9em; opacity: 0.8; margin-top: 2px;">Зачем жить, смерть, абсурд, одиночество, конечность существования</div></div><div style="margin-bottom: 12px;">  <div style="display: flex; align-items: baseline; gap: 8px;">    <span style="font-weight: 700; font-size: 1.2em; color: #aa33ff;">14%</span>    <span style="font-weight: 700;">Мораль, добро и зло</span>  </div>  <div style="font-size: 0.9em; opacity: 0.8; margin-top: 2px;">Вина, ответственность, преступление, совесть, возможность оправдания человека</div></div><div style="margin-bottom: 12px;">  <div style="display: flex; align-items: baseline; gap: 8px;">    <span style="font-weight: 700; font-size: 1.2em; color: #aa33ff;">13%</span>    <span style="font-weight: 700;">Человек и общество / система</span>  </div>  <div style="font-size: 0.9em; opacity: 0.8; margin-top: 2px;">Давление общества, государство, идеология, нормы, социальные институты</div></div><div style="margin-bottom: 12px;">  <div style="display: flex; align-items: baseline; gap: 8px;">    <span style="font-weight: 700; font-size: 1.2em; color: #aa33ff;">10%</span>    <span style="font-weight: 700;">Свобода, выбор и личная автономия</span>  </div>  <div style="font-size: 0.9em; opacity: 0.8; margin-top: 2px;">Свободен ли человек, цена выбора, бунт, детерминизм, индивидуальность</div></div><div style="margin-bottom: 12px;">  <div style="display: flex; align-items: baseline; gap: 8px;">    <span style="font-weight: 700; font-size: 1.2em; color: #aa33ff;">9%</span>    <span style="font-weight: 700;">Отношения, любовь и близость</span>  </div>  <div style="font-size: 0.9em; opacity: 0.8; margin-top: 2px;">Любовь, сексуальность, семья, невозможность близости, зависимость от другого</div></div> Именно поэтому клуб не становится сухим философским семинаром.<br><br>Миссию клуба можно сформулировать как: «Читаем о человеке, чтобы лучше понять, что делать со своей собственной жизнью». Внутренний вопрос может звучать как: «Что значит быть человеком, когда никто не гарантирует, что жизнь имеет смысл?»` } },
        // Тюмень
        { id: 'cl12', name: 'Думай иначе', cityId: 'c5', members: 1500, color: '#44ccbb', memberLabel: 'подписчиков', hasLogo: true },
        // Ticker-only clubs (no planet)
        { id: 'cl11', name: 'Книжный клуб Skolkovo Alumni', cityId: 'c1', members: 0, color: '#888888', tickerOnly: true },
        { id: 'cl13', name: 'Институт карьерного роста', cityId: 'c1', members: 150, color: '#aa4466' },
        { id: 'cl19', name: 'Книжный клуб "На чердаке"', cityId: 'c1', members: 0, color: '#778899', tickerOnly: true },
        // Sun-sized central club
        { id: 'cl15', name: 'Литературный клуб Синхронизации', cityId: 'c6', members: 53600, color: '#33ffaa', memberLabel: 'подписчиков', organizer: 'Синхронизация', isCentral: true, hasLogo: true },
        { id: 'cl21', name: 'Книжный клуб Евгении Власенко', cityId: 'c8', members: 3250, color: '#cc88ff', isCentral: true, hasLogo: true,
            archetype: {
                title: '🔥 «Клуб живой литературы»',
                description: '<div class="arc-section"><div class="arc-label">🏛️ Профиль клуба</div><div class="arc-traits"><b>Очень много:</b><ul class="arc-formats-list"><li>современной прозы;</li><li>новых авторов;</li><li>женских голосов;</li><li>социальной проблематики;</li><li>тем идентичности;</li><li>памяти;</li><li>травмы;</li><li>семьи;</li><li>войны;</li><li>эмиграции;</li><li>одиночества.</li></ul></div></div><div class="arc-section"><div class="arc-label">📊 ДНК клуба</div><div class="arc-dna-row"><span class="arc-pct">45%</span><span class="arc-cat">Современная литературная проза</span></div><div class="arc-desc">Основное ядро.</div><div class="arc-dna-row"><span class="arc-pct">20%</span><span class="arc-cat">Социальная чувствительность</span></div><div class="arc-dna-row"><span class="arc-pct">20%</span><span class="arc-cat">Память, семья, идентичность</span></div><div class="arc-dna-row"><span class="arc-pct">10%</span><span class="arc-cat">Пограничная и экспериментальная литература</span></div><div class="arc-dna-row"><span class="arc-pct">5%</span><span class="arc-cat">Фантастика и жанр</span></div><div class="arc-desc">Появляется редко и только если книга несёт сильный социальный или литературный слой.</div></div><div class="arc-section"><div class="arc-label">🎯 Уровень сложности</div><div class="arc-traits">Интересный момент: этот клуб не читает сложные книги в академическом смысле, но читает сложные книги эмоционально.</div><br><div class="arc-complexity"><span>Интеллектуальная сложность</span><div class="arc-bar-wrap"><div class="arc-bar" style="width:60%"></div></div><span class="arc-val">6/10</span></div><div class="arc-complexity"><span>Эмоциональная сложность</span><div class="arc-bar-wrap"><div class="arc-bar arc-bar-em" style="width:90%"></div></div><span class="arc-val">9/10</span></div></div><div class="arc-section"><div class="arc-label">👥 Кто типичный участник</div><div class="arc-traits"><b>С высокой вероятностью:</b><ul class="arc-formats-list"><li>интересуется современной культурой;</li><li>следит за новыми издательствами;</li><li>любит литературные премии;</li><li>читает не ради сюжета;</li><li>любит обсуждать общество через личные истории.</li></ul></div></div>'
            }
        },
        { id: 'cl24', name: 'Лама', cityId: 'c1', members: 2390, color: '#7ba7d4', memberLabel: 'подписчиков', hasLogo: true },
        { id: 'cl25', name: 'Bukva Book Club', cityId: 'c9', members: 0, color: '#7ec8a0', hasLogo: true },
        { id: 'cl26', name: 'Bookz Club', cityId: 'c1', members: 322, color: '#c4a99a', hasLogo: true },
        { id: 'cl27', name: 'Книжный клуб Дубай', cityId: 'c10', members: 372, color: '#d4a853', hasLogo: true, archetype: { title: 'Клуб больших человеческих историй', description: `<div class="arc-section">
  <div class="arc-label">Характер клуба</div>
  <div class="arc-traits">«Клуб больших человеческих историй». Здесь люди приходят понять человека через литературу — не ради интриги, а ради понимания. Их привлекают семейные саги, моральные дилеммы, культурное разнообразие и истории, где большие исторические события становятся фоном для личных судеб.</div>
</div>
<div class="arc-section">
  <div class="arc-label">Читатель клуба</div>
  <div class="arc-traits">Любит долго обсуждать мотивы героев · Интересуется психологией через литературу · Ценит эмпатию выше остроумия · Любит красивые тексты · Готов читать большие романы · Спокойно относится к открытому финалу</div>
</div>
<div class="arc-section">
  <div class="arc-label">Любимые эмоции</div>
  <div class="arc-traits">Светлая грусть · Сострадание · Ностальгия · Надежда · Принятие · Ощущение сложности жизни</div>
</div>
<div class="arc-section">
  <div class="arc-label">География книг</div>
  <div class="arc-traits">Япония · Индия · Армения · Россия · США · Мексика · Вьетнам · Африка · Италия · Испания · Великобритания — высокая открытость другим культурам</div>
</div>` } },
        { id: 'cl22', name: 'Читули', cityId: 'c1', members: 200, color: '#ff8c69', hasLogo: true,
            archetype: {
                title: '🌍 «Клуб эпических историй»',
                description: '<div class="arc-section"><div class="arc-label">🏛️ Профиль клуба</div><div class="arc-traits"><b>Главная тема:</b> судьба человека на фоне эпохи<br><br><b>Любимые форматы:</b><ul class="arc-formats-list"><li>большие романы</li><li>семейные саги</li><li>историческая проза</li><li>литературная классика</li></ul><br><b>Средняя длина книги:</b> высокая</div></div><div class="arc-section"><div class="arc-label">📊 ДНК клуба</div><div class="arc-dna-row"><span class="arc-pct">40%</span><span class="arc-cat">Большие семейные и исторические романы</span></div><div class="arc-desc">Ядро клуба.</div><div class="arc-dna-row"><span class="arc-pct">25%</span><span class="arc-cat">Литературная классика</span></div><div class="arc-dna-row"><span class="arc-pct">20%</span><span class="arc-cat">Гуманистическая проза</span></div><div class="arc-dna-row"><span class="arc-pct">15%</span><span class="arc-cat">Эксперименты и новинки</span></div><div class="arc-desc">Они есть, но не определяют клуб.</div></div><div class="arc-section"><div class="arc-label">🎯 Уровень сложности</div><div class="arc-complexity"><span>Интеллектуальная сложность</span><div class="arc-bar-wrap"><div class="arc-bar" style="width:60%"></div></div><span class="arc-val">6/10</span></div><div class="arc-complexity"><span>Эмоциональная вовлечённость</span><div class="arc-bar-wrap"><div class="arc-bar arc-bar-em" style="width:90%"></div></div><span class="arc-val">9/10</span></div></div><div class="arc-section"><div class="arc-label">👥 Совпадение с читателями</div><div class="arc-traits">• любителям Драйзера — <b>высокое</b><br>• любителям Ремарка — <b>высокое</b><br>• любителям Водолазкина — <b>высокое</b><br>• любителям Талеба и Кови — <b>низкое</b></div></div>'
            }
        },
            {
            id: 'cl23',
            name: 'Книжный клуб Book Events',
            cityId: 'c1',
            members: 120,
            color: '#f5a2b3',
            founded: '21 января 2018 года',
            hasLogo: true,
            archetype: {
                title: '🧬 «Архив предельного опыта»',
                description: '<div class="arc-section"><div class="arc-label">🏛️ Суть архетипа</div><div class="arc-traits">Это сообщество читает не “сюжеты”, а предельные режимы человеческого существования: любовь, вина, распад идентичности, насилие истории, одиночество, моральный выбор, память, травма, надежда. Клуб про человека в условиях, где простые ответы перестают работать.</div></div><div class="arc-section"><div class="arc-label">🧠 Психологический профиль</div><div class="arc-traits"><b>1. Фокус на внутренней реальности:</b> сознание переживает мир (Исигуро, Сарамаго, Фоер, Франзен, Водолазкин, Улицкая, Памук, Тартт).<br><br><b>2. Травма и историческая тень:</b> давление истории на психику человека (Оруэлл, Стейнбек, Астафьев, Шолохов, Булгаков, Гюго, Драйзер, Достоевский).<br><br><b>3. Моральная неоднозначность:</b> нет простых героев, есть выбор и цена выбора (Тайная история, Имя розы, Коллекционер, Граф Монте-Кристо, Анна Каренина, Братья Карамазовы).<br><br><b>4. Эмоциональная эмпатия + тёмные зоны:</b> попытка держать тяжелое в поле зрения рядом с теплом (Флэгг, Бакман, Абгарян, Богданова, Сарамаго, Симмонс, Кронин).<br><br><b>5. Интерес к идентичности:</b> постоянный вопрос: «что делает меня мной?» (Цветы для Элджернона, Не отпускай меня, Степной волк, Франкл, Чиксентмихайи, Бернс).</div></div><div class="arc-section"><div class="arc-label">🧬 ДНК книжного клуба</div><div class="arc-dna-row"><span class="arc-pct">28%</span><span class="arc-cat">Психологическая глубина и исследование личности</span></div><div class="arc-dna-row"><span class="arc-pct">18%</span><span class="arc-cat">История, общество и давление эпохи</span></div><div class="arc-dna-row"><span class="arc-pct">17%</span><span class="arc-cat">Моральные выборы и этическая неоднозначность</span></div><div class="arc-dna-row"><span class="arc-pct">12%</span><span class="arc-cat">Эмоциональная эмпатия и человеческое тепло</span></div><div class="arc-dna-row"><span class="arc-pct">10%</span><span class="arc-cat">Экзистенциальная философия и смысл жизни</span></div><div class="arc-dna-row"><span class="arc-pct">9%</span><span class="arc-cat">Тёмная проза, психологическая напряжённость и тревога</span></div><div class="arc-dna-row"><span class="arc-pct">6%</span><span class="arc-cat">Классическая литература как “скелет системы”</span></div><div class="arc-profile-block"><b>Итоговый профиль:</b><ul class="arc-formats-list"><li><b>≈ 60% — психология личности и смысл</b></li><li><b>≈ 25% — общество, история и мораль</b></li><li><b>≈ 15% — эмоциональная и классическая “опора”</b></li></ul></div></div><div class="arc-section"><div class="arc-label">🎓 Интеллектуальный стиль</div><div class="arc-traits"><ul class="arc-formats-list"><li>синтез высокой классики и современной прозы</li><li>отсутствие границы между “школьной программой” и актуальной литературой</li><li>интерес к философии, психологии и культурной памяти</li><li>чтение как способ самонаблюдения</li><li>клуб про человека в условиях, где простые ответы перестают работать.</li></ul></div></div><div class="arc-section"><div class="arc-label">🎯 Уровень сложности</div><div class="arc-complexity"><span>Интеллектуальная сложность</span><div class="arc-bar-wrap"><div class="arc-bar" style="width:80%"></div></div><span class="arc-val">8/10</span></div><div class="arc-complexity"><span>Эмоциональная глубина</span><div class="arc-bar-wrap"><div class="arc-bar arc-bar-em" style="width:85%"></div></div><span class="arc-val">8.5/10</span></div></div>'
            }
        },
],
    books: [
                { id: 'bq1', title: 'Маленький принц', author: 'Антуан де Сент-Экзюпери', color: '#1a2a5e' },
        { id: 'bq2', title: 'Алхимик',         author: 'Пауло Коэльо',             color: '#5e3a0a' },
        { id: 'b400', title: 'Люди, которые всегда со мной', author: 'Наринэ Абгарян', clubId: 'cl23', color: '#8B0000', year: 2019 },
        { id: 'b401', title: 'Глиняный мост', author: 'Маркус Зусак', clubId: 'cl23', color: '#5c0000', year: 2018 },
        { id: 'b402', title: 'С жизнью наедине', author: 'Кристин Ханна', clubId: 'cl23', color: '#2244aa', year: 2022 },
        { id: 'b403', title: 'Дни Савелия', author: 'Григорий Служитель', clubId: 'cl23', color: '#aa5500', year: 2021 },
        { id: 'b404', title: 'Женщины Лазаря', author: 'Марина Степнова', clubId: 'cl23', color: '#2255aa', year: 2021 },
        { id: 'b405', title: 'Я — посланник', author: 'Маркус Зусак', clubId: 'cl23', color: '#1a3a5c', year: 2020 },
        { id: 'b406', title: 'Рождество и красный кардинал', author: 'Фэнни Флэгг', clubId: 'cl23', color: '#2c2c2c', year: 2019 },
        { id: 'b407', title: 'Последний самурай', author: 'Хелен Девитт', clubId: 'cl23', color: '#333366', year: 2026 },
        { id: 'b408', title: 'Обещание на рассвете', author: 'Ромен Гари', clubId: 'cl23', color: '#5c3a1a', year: 2019 },
        { id: 'b409', title: 'Цитадель', author: 'Арчибальд Кронин', clubId: 'cl23', color: '#1a4a1a', year: 2024 },
        { id: 'b410', title: 'Слепота', author: 'Жозе Сарамаго', clubId: 'cl23', color: '#2a2a4a', year: 2018 },
        { id: 'b411', title: 'Серебряная дорога', author: 'Стина Джексон', clubId: 'cl23', color: '#4a1a1a', year: 2018 },
        { id: 'b412', title: 'Клара и солнце', author: 'Кадзуо Исигуро', clubId: 'cl23', color: '#1a3a1a', year: 2019 },
        { id: 'b413', title: 'Жутко громко и запредельно близко', author: 'Джонатан Сафран Фоер', clubId: 'cl23', color: '#3a1a4a', year: 2021 },
        { id: 'b414', title: 'Четыре ветра', author: 'Кристин Ханна', clubId: 'cl23', color: '#1a1a4a', year: 2021 },
        { id: 'b415', title: 'Художница из Джайпура', author: 'Алка Джоши', clubId: 'cl23', color: '#334466', year: 2026 },
        { id: 'b416', title: 'Американская трагедия', author: 'Теодор Драйзер', clubId: 'cl23', color: '#8B0000', year: 2018 },
        { id: 'b417', title: 'Рай где-то рядом', author: 'Фэнни Флэгг', clubId: 'cl23', color: '#5c0000', year: 2026 },
        { id: 'b418', title: 'Голландский дом', author: 'Энн Пэтчетт', clubId: 'cl23', color: '#2244aa', year: 2021 },
        { id: 'b419', title: 'Искусство терять', author: 'Алис Зенитер', clubId: 'cl23', color: '#aa5500', year: 2026 },
        { id: 'b420', title: 'Риф', author: 'Алексей Поляринов', clubId: 'cl23', color: '#2255aa', year: 2024 },
        { id: 'b421', title: 'Сезон отравленных плодов', author: 'Вера Богданова', clubId: 'cl23', color: '#1a3a5c', year: 2021 },
        { id: 'b422', title: 'Цветы для Элджернона', author: 'Дэниел Киз', clubId: 'cl23', color: '#2c2c2c', year: 2025 },
        { id: 'b423', title: 'В тумане дом', author: 'Ольга Каменская', clubId: 'cl23', color: '#333366', year: 2022 },
        { id: 'b424', title: 'Прислуга', author: 'Кэтрин Стокетт', clubId: 'cl23', color: '#5c3a1a', year: 2018 },
        { id: 'b425', title: 'Казус Кукоцкого', author: 'Людмила Улицкая', clubId: 'cl23', color: '#1a4a1a', year: 2020 },
        { id: 'b426', title: '1984', author: 'Джордж Оруэлл', clubId: 'cl23', color: '#2a2a4a', year: 2024 },
        { id: 'b427', title: 'Последнее, что он сказал мне', author: 'Лора Дейв', clubId: 'cl23', color: '#4a1a1a', year: 2023 },
        { id: 'b428', title: 'Брисбен', author: 'Евгений Водолазкин', clubId: 'cl23', color: '#1a3a1a', year: 2022 },
        { id: 'b429', title: 'Там, где раки поют', author: 'Дэлия Оуэнс', clubId: 'cl23', color: '#3a1a4a', year: 2020 },
        { id: 'b430', title: 'Маленькие женщины', author: 'Луиза Мэй Олкотт', clubId: 'cl23', color: '#1a1a4a', year: 2021 },
        { id: 'b431', title: 'Девять жизней Роуз Наполитано', author: 'Донна Фрейтас', clubId: 'cl23', color: '#334466', year: 2023 },
        { id: 'b432', title: 'Протагонист', author: 'Ася Володина', clubId: 'cl23', color: '#8B0000', year: 2019, coverUrl: 'https://cdn.litres.ru/pub/c/cover/69152536.jpg' },
        { id: 'b433', title: 'Тревожные люди', author: 'Фредрик Бакман', clubId: 'cl23', color: '#5c0000', year: 2019 , coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-u/wc2500/7109930118.jpg'},
        { id: 'b434', title: 'Большая маленькая ложь', author: 'Лиана Мориарти', clubId: 'cl23', color: '#2244aa', year: 2024 },
        { id: 'b435', title: 'Дом шелка', author: 'Кейт Нанн', clubId: 'cl23', color: '#aa5500', year: 2019 },
        { id: 'b436', title: 'Королева Юга', author: 'Артуро Перес-Реверте', clubId: 'cl23', color: '#2255aa', year: 2023 },
        { id: 'b437', title: 'С неба упали три яблока', author: 'Наринэ Абгарян', clubId: 'cl23', color: '#1a3a5c', year: 2023 },
        { id: 'b438', title: 'Перекрёстки', author: 'Джонатан Франзен', clubId: 'cl23', color: '#2c2c2c', year: 2022 },
        { id: 'b439', title: 'Лисьи броды', author: 'Анна Старобинец', clubId: 'cl23', color: '#333366', year: 2018 , coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-p/wc1000/9776160493.jpg'},
        { id: 'b440', title: 'К югу от границы, на запад от солнца', author: 'Харуки Мураками', clubId: 'cl23', color: '#5c3a1a', year: 2025 },
        { id: 'b441', title: 'Маленькие птичьи сердца', author: 'Виктория Ллойд-Барлоу', clubId: 'cl23', color: '#1a4a1a', year: 2026 },
        { id: 'b442', title: 'Унесенные ветром', author: 'Маргарет Митчелл', clubId: 'cl23', color: '#2a2a4a', year: 2019 },
        { id: 'b443', title: 'Шоколад', author: 'Джоанн Харрис', clubId: 'cl23', color: '#4a1a1a', year: 2024 , coverUrl: 'https://ir.ozone.ru/s3/multimedia-8/wc500/6732582344.jpg'},
        { id: 'b444', title: 'Протагонист', author: 'Ася Володина', clubId: 'cl23', color: '#1a3a1a', year: 2019, coverUrl: 'https://cdn.litres.ru/pub/c/cover/69152536.jpg' },
        { id: 'b445', title: 'Явь', author: 'Ольга Каменская', clubId: 'cl23', color: '#3a1a4a', year: 2026 },
        { id: 'b446', title: 'Дети шини', author: 'Ида Мартин', clubId: 'cl23', color: '#1a1a4a', year: 2022 },
        { id: 'b447', title: 'Folly', author: 'Алекс О.', clubId: 'cl23', color: '#334466', year: 2023 },
        { id: 'b448', title: 'Забери меня с собой', author: 'Елена Гордина', clubId: 'cl23', color: '#8B0000', year: 2021 },
        { id: 'b449', title: 'Клуб любителей книг и пирогов из картофельных очистков', author: 'Мэри Энн Шаффер, Энни Бэрроуз', clubId: 'cl23', color: '#5c0000', year: 2019 },
        { id: 'b450', title: 'Атомные привычки', author: 'Джеймс Клир', clubId: 'cl23', color: '#2244aa', year: 2026, coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-6/wc1000/9294335214.jpg' },
        { id: 'b451', title: 'Хождение по мукам', author: 'Алексей Толстой', clubId: 'cl23', color: '#aa5500', year: 2026 },
        { id: 'b452', title: 'Преступление лорда Артура Сэвила', author: 'Оскар Уайлд', clubId: 'cl23', color: '#2255aa', year: 2026 },
        { id: 'b453', title: 'Борис Годунов', author: 'Александр Пушкин', clubId: 'cl23', color: '#1a3a5c', year: 2026 },
        { id: 'b454', title: 'Звук и ярость', author: 'Уильям Фолкнер', clubId: 'cl23', color: '#2c2c2c', year: 2026 },
        { id: 'b455', title: 'В круге первом', author: 'Александр Солженицын', clubId: 'cl23', color: '#333366', year: 2026 },
        { id: 'b456', title: 'Сердца трех', author: 'Джек Лондон', clubId: 'cl23', color: '#5c3a1a', year: 2026 },
        { id: 'b457', title: 'Сага о форсайтах', author: 'Джон Голсуори', clubId: 'cl23', color: '#1a4a1a', year: 2026 },
        { id: 'b458', title: 'Хамнет', author: "Мэгги О'Фаррелл", clubId: 'cl23', color: '#2a2a4a', year: 2026 },
        { id: 'b459', title: 'Королек-птичка певчая', author: 'Решат Нури Гюнтекин', clubId: 'cl23', color: '#4a1a1a', year: 2026 },
        { id: 'b460', title: 'Последняя обитель', author: 'Антон Мамон', clubId: 'cl23', color: '#1a3a1a', year: 2026 },
        { id: 'b461', title: 'Сказать жизни да!', author: 'Виктор Франкл', clubId: 'cl23', color: '#3a1a4a', year: 2026 },
        { id: 'b462', title: 'Глаза Моны', author: 'Том Шлессер', clubId: 'cl23', color: '#1a1a4a', year: 2026 },
        { id: 'b463', title: 'Токсичные люди', author: 'Шахида Араби', clubId: 'cl23', color: '#334466', year: 2026 },
        { id: 'b464', title: 'Книга извечных ценностей', author: 'Анчал Малхотра', clubId: 'cl23', color: '#8B0000', year: 2026 },
        {
            id: 'b465', title: 'Дар', author: 'Владимир Набоков', clubId: 'cl23', color: '#5c0000', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/151371.jpg',
            meetingDate: '2026-07-05', meetingTime: '14:00',
            location: 'Библиотека 16',
            registerUrl: 'https://booksevents.ru/#schedule',
        },
        { id: 'b466', title: 'Господа Головлёвы', author: 'М.Е. Салтыков-Щедрин', clubId: 'cl23', color: '#2244aa', year: 2025 },
        { id: 'b467', title: 'Отверженные', author: 'Виктор Гюго', clubId: 'cl23', color: '#aa5500', year: 2025 },
        { id: 'b468', title: 'Гроза, Бесприданница, Свои люди - сочтемся', author: 'А.Н. Островский', clubId: 'cl23', color: '#2255aa', year: 2025 },
        { id: 'b469', title: 'Бремя страстей человеческих', author: 'У.С. Моэм', clubId: 'cl23', color: '#1a3a5c', year: 2025 },
        { id: 'b470', title: 'Прокляты и убиты', author: 'Виктор Астафьев', clubId: 'cl23', color: '#2c2c2c', year: 2025 },
        { id: 'b471', title: 'Прощай, оружие!', author: 'Эрнест Хемингуэй', clubId: 'cl23', color: '#333366', year: 2025 },
        { id: 'b472', title: 'Алмазный мой венец', author: 'Валентин Катаев', clubId: 'cl23', color: '#5c3a1a', year: 2025 },
        { id: 'b473', title: 'Макбет, Сон в летнюю ночь', author: 'У. Шекспир', clubId: 'cl23', color: '#1a4a1a', year: 2025 },
        { id: 'b474', title: 'Красное и черное', author: 'Стендаль', clubId: 'cl23', color: '#2a2a4a', year: 2025 },
        { id: 'b475', title: 'Плаха', author: 'Чингиз Айтматов', clubId: 'cl23', color: '#4a1a1a', year: 2025 },
        { id: 'b476', title: 'Овод', author: 'Э.Л. Войнич', clubId: 'cl23', color: '#1a3a1a', year: 2025 },
        { id: 'b477', title: 'Доверие', author: 'Эрнан Диаз', clubId: 'cl23', color: '#3a1a4a', year: 2025 },
        { id: 'b478', title: 'Сердце Пармы', author: 'Алексей Иванов', clubId: 'cl23', color: '#1a1a4a', year: 2025 },
        { id: 'b479', title: 'Имя розы', author: 'Умберто Эко', clubId: 'cl23', color: '#334466', year: 2025 },
        { id: 'b480', title: 'Желчный ангел', author: 'Катя Качур', clubId: 'cl23', color: '#8B0000', year: 2025 },
        { id: 'b481', title: 'Почтальонша', author: 'Франческа Джанноне', clubId: 'cl23', color: '#5c0000', year: 2025 },
        { id: 'b482', title: 'Не отпускай меня', author: 'Кадзуо Исигуро', clubId: 'cl23', color: '#2244aa', year: 2025 },
        { id: 'b483', title: 'Храни её', author: 'Жан-Батист Андреа', clubId: 'cl23', color: '#aa5500', year: 2025 },
        { id: 'b484', title: 'Собиратели ракушек', author: 'Розамунда Пилчер', clubId: 'cl23', color: '#2255aa', year: 2025, coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-k/wc1000/7402967480.jpg' },
        { id: 'b485', title: 'Тайная история', author: 'Донна Тартт', clubId: 'cl23', color: '#1a3a5c', year: 2025 },
        { id: 'b486', title: 'Город с львиным сердцем', author: 'Екатерина Звонцова', clubId: 'cl23', color: '#2c2c2c', year: 2025 },
        { id: 'b487', title: 'Авиатор', author: 'Евгений Водолазкин', clubId: 'cl23', color: '#333366', year: 2025, coverUrl: 'https://cv0.litres.ru/pub/c/cover/18910175.jpg' },
        { id: 'b488', title: 'Зелёный свет', author: 'Мэттью Макконахи', clubId: 'cl23', color: '#5c3a1a', year: 2025, coverUrl: 'https://ir.ozone.ru/s3/multimedia-2/6132075578.jpg',
            review: 'Я очень хорошо отношусь к Макконахи, но не писаюсь от него кипятком (хотя в «Джентльменах» едва сдерживаюсь), после этой автобиографии ещё больше успокоилась. К актёрам, которые пишут отношусь скептически, понимаю, что это работа над брендом, но также понимаю, что это дело можно передать гораздо более умелым людям.\n\nКак киновед я читаю очень много автобиографий и биографий кинематографистов и актёрские всегда самые слабые, я была к этому готова, но блин ⭐️ Как же банально она написана. Лёгкий слог, но такой скучный. Моя любимая часть, это его влажные сны, когда эрекция привела его на Амазонку и в другие части света. Это прикольно, но каким самомнением надо обладать, чтобы писать о том, что семяизвержение – маятник твоих мечт? 😂 Я это пишу со всей любовью.\n\nВосхищаюсь его стойкостью, воспитательными методами его бати, актерским экспериментами, подготовками к ролям, и настоящей верой в себя. Последнее – главное, что подчеркнула для себя в книге и что мне по-настоящему понравилось. Молодой парень без связей пробился в Голливуде, к главным ролям у потрясающих режиссёров и не потерял себя!\n\nПотому что верил, что он сможет. Без веры в себя ни нам, ни Мэттью Макконахи никуда ❤️' },
        { id: 'b489', title: 'Иллюзия себя', author: 'Грегори Бернс', clubId: 'cl23', color: '#1a4a1a', year: 2025 },
        { id: 'b490', title: 'Поток', author: 'Михай Чиксентмихайи', clubId: 'cl23', color: '#2a2a4a', year: 2025 },
        { id: 'b491', title: 'Воспоминания о прошлом земли', author: 'Лю Цысинь', clubId: 'cl23', color: '#4a1a1a', year: 2025 },
        { id: 'b492', title: 'Властелин колец', author: 'Дж.Р.Р. Толкин', clubId: 'cl23', color: '#1a3a1a', year: 2025 },
        // Book Events — события 2026
        {
            id: 'b826', title: 'Литературный бранч «Я — читатель»',
            clubId: 'cl23', color: '#f5a2b3', year: 2026,
            meetingDate: '2026-08-05',
            registerUrl: 'https://bookevents.ru',
            genreRibbon: 'Спецформат',
        },
        {
            id: 'b827', title: 'Плоды земли', author: 'Кнут Гамсун',
            clubId: 'cl23', color: '#f5a2b3', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-2/wc1000/6253011854.jpg',
            meetingDate: '2026-08-08',
            registerUrl: 'https://bookevents.ru',
            direction: 'Классическое направление',
        },
        {
            id: 'b828', title: 'Книги перемен',
            clubId: 'cl23', color: '#f5a2b3', year: 2026,
            meetingDate: '2026-08-23',
            registerUrl: 'https://bookevents.ru',
            genreRibbon: 'Спецформат',
        },
        {
            id: 'b829', title: 'Анабарская сказка', author: 'Виктор Ремизов',
            clubId: 'cl23', color: '#f5a2b3', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-y/wc1000/9857850298.jpg',
            meetingDate: '2026-08-29',
            registerUrl: 'https://bookevents.ru',
            direction: 'Современное направление',
        },
        // SOK real books with cover images
        {
            id: 'b1', title: 'Граф Монте-Кристо. Том 1', author: 'А. Дюма', clubId: 'cl1', color: '#8B0000', year: 2025,
            coverUrl: '/cover-monte-1.jpg',
        },
        {
            id: 'b48', title: 'Граф Монте-Кристо. Том 2', author: 'А. Дюма', clubId: 'cl1', color: '#5c0000', year: 2025,
            coverUrl: '/cover-monte-2.webp',
        },
        {
            id: 'b2', title: 'Братья Карамазовы', author: 'Ф.М. Достоевский', clubId: 'cl1', color: '#2244aa', year: 2026,
            coverUrl: '/cover-karamazov.jpg',
        },
        {
            id: 'b3', title: 'Триггеры', author: 'Маршалл Голдсмит', clubId: 'cl1', color: '#aa5500', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/14834695/hat989fe8fc8eeaeb8a7125b04b25125077/orig',
        },
        {
            id: 'b49', title: 'Как устроена экономика', author: 'Ха-Джун Чан', clubId: 'cl1', color: '#2255aa', year: 2026,
            coverUrl: '/cover-economy.jpg',
            meetingDate: '2026-03-26', meetingTime: '19:00',
            location: 'SOK Рыбаков Тауэр, 103 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events;coworking_id=1;location_id=14;widget=1;ids=;lang=ru;id=1213',
        },
        // SOK — новые книги
        {
            id: 'b13', title: 'Письма Баламута', author: 'К.С. Льюис', clubId: 'cl1', color: '#1a3a5c', year: 2025,
            coverUrl: 'https://basket-01.wbbasket.ru/vol107/part10733/10733427/images/big/4.webp',
        },
        {
            id: 'b14', title: 'ОН', author: '', clubId: 'cl1', color: '#2c2c2c', year: 2025,
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/15427954/hat545fee11d5723eda2c75d9b0176302f7/orig',
        },
        {
            id: 'b15', title: 'Чёрно-белое мышление', author: '', clubId: 'cl1', color: '#333366', year: 2025,
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/12837253/hatfcb019f75b2158587f5ff4d9e269e482/orig',
        },
        {
            id: 'b16', title: 'Самурай без меча', author: 'Китами Масао', clubId: 'cl1', color: '#5c3a1a', year: 2025,
            coverUrl: 'https://avatars.mds.yandex.net/get-mpic/1543318/2a0000019179e58ae0f06c54ae6b2d43dfe2/orig',
        },
        {
            id: 'b17', title: 'Воскресение', author: 'Л.Н. Толстой', clubId: 'cl1', color: '#1a4a1a', year: 2025,
            coverUrl: '/cover-voskresenie.jpg',
        },
        {
            id: 'b18', title: 'Почти серьёзно…', author: 'Никулин', clubId: 'cl1', color: '#2a2a4a', year: 2025,
            coverUrl: 'https://avatars.mds.yandex.net/get-mpic/4614113/2a0000019202e74f6141960b8b050f73dad2/orig',
        },
        {
            id: 'b19', title: 'Божественная комедия', author: 'Данте', clubId: 'cl1', color: '#4a1a1a', year: 2025,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-i/6937261038.jpg',
        },
        {
            id: 'b20', title: 'Зелёный свет', author: 'МакКонахи', clubId: 'cl1', color: '#1a3a1a', year: 2025,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-2/6132075578.jpg',
            review: 'Я очень хорошо отношусь к Макконахи, но не писаюсь от него кипятком (хотя в «Джентльменах» едва сдерживаюсь), после этой автобиографии ещё больше успокоилась. К актёрам, которые пишут отношусь скептически, понимаю, что это работа над брендом, но также понимаю, что это дело можно передать гораздо более умелым людям.\n\nКак киновед я читаю очень много автобиографий и биографий кинематографистов и актёрские всегда самые слабые, я была к этому готова, но блин ⭐️ Как же банально она написана. Лёгкий слог, но такой скучный. Моя любимая часть, это его влажные сны, когда эрекция привела его на Амазонку и в другие части света. Это прикольно, но каким самомнением надо обладать, чтобы писать о том, что семяизвержение – маятник твоих мечт? 😂 Я это пишу со всей любовью.\n\nВосхищаюсь его стойкостью, воспитательными методами его бати, актерским экспериментами, подготовками к ролям, и настоящей верой в себя. Последнее – главное, что подчеркнула для себя в книге и что мне по-настоящему понравилось. Молодой парень без связей пробился в Голливуде, к главным ролям у потрясающих режиссёров и не потерял себя!\n\nПотому что верил, что он сможет. Без веры в себя ни нам, ни Мэттью Макконахи никуда ❤️',
        },
        {
            id: 'b21', title: 'Фауст', author: 'Гёте', clubId: 'cl1', color: '#3a1a4a', year: 2025,
            coverUrl: '/cover-faust.jpg',
        },
        {
            id: 'b22', title: 'Скажи жизни ДА!', author: 'Франкл', clubId: 'cl1', color: '#1a1a4a', year: 2025,
            coverUrl: 'https://avatars.mds.yandex.net/get-mpic/16497166/2a0000019a4690e3013cfe177d5286f45c61/orig',
        },
        {
            id: 'b88', title: 'Клуб неисправимых оптимистов', author: 'Жан-Мишель Генассия', clubId: 'cl1', color: '#334466', year: 2026,
            coverUrl: '/cover-optimists.jpg',
            meetingDate: '2026-04-30', meetingTime: '',
            location: 'SOK Rybakov',
        },
        // SOK Москва — история клуба (хронологический порядок, 1 книга в месяц)
        // 2021 (июл–дек): книги 1–6
        { id: 'b270', title: 'Гении и аутсайдеры', author: 'Малкольм Гладуэлл', clubId: 'cl1', color: '#aa5533', year: 2021 },
        { id: 'b271', title: 'Красная таблетка', author: 'Андрей Курпатов', clubId: 'cl1', color: '#cc2222', year: 2021 },
        { id: 'b272', title: 'Никаких правил', author: 'Рид Хастингс, Эрин Мейер', clubId: 'cl1', color: '#dd3344', year: 2021 },
        { id: 'b273', title: 'Антихрупкость', author: 'Нассим Талеб', clubId: 'cl1', color: '#225588', year: 2021 },
        { id: 'b274', title: 'Самый богатый человек в Вавилоне', author: 'Джордж Клейсон', clubId: 'cl1', color: '#c8a020', year: 2021 },
        { id: 'b275', title: 'Икигай', author: 'Кен Моги', clubId: 'cl1', color: '#dd4466', year: 2021 },
        // 2022 (янв–дек): книги 7–18
        { id: 'b276', title: 'Тревожные люди', author: 'Фредрик Бакман', clubId: 'cl1', color: '#5588cc', year: 2022 , coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-u/wc2500/7109930118.jpg'},
        { id: 'b277', title: 'Эссенциализм', author: 'Грег МакКеон', clubId: 'cl1', color: '#336699', year: 2022 },
        { id: 'b278', title: 'Мы', author: 'Евгений Замятин', clubId: 'cl1', color: '#334466', year: 2022 },
        { id: 'b279', title: 'Экономика впечатлений', author: 'Б. Джозеф Пайн, Джеймс Гилмор', clubId: 'cl1', color: '#3377aa', year: 2022 },
        { id: 'b280', title: 'Финансист', author: 'Теодор Драйзер', clubId: 'cl1', color: '#225533', year: 2022 },
        { id: 'b281', title: 'Думай как римский император', author: 'Дональд Робертсон', clubId: 'cl1', color: '#8866aa', year: 2022 },
        { id: 'b282', title: 'Источник', author: 'Айн Рэнд', clubId: 'cl1', color: '#cc8833', year: 2022 },
        { id: 'b283', title: 'WILL', author: 'Уилл Смит, Марк Мэнсон', clubId: 'cl1', color: '#333333', year: 2022 },
        { id: 'b284', title: 'По ком звонит колокол', author: 'Эрнест Хемингуэй', clubId: 'cl1', color: '#885533', year: 2022 },
        { id: 'b285', title: 'TED TALKS: слова меняют мир', author: 'Крис Андерсон', clubId: 'cl1', color: '#dd3333', year: 2022 },
        { id: 'b286', title: 'Secret X10', author: 'Игорь Рыбаков', clubId: 'cl1', color: '#2255aa', year: 2022 },
        { id: 'b287', title: 'На западном фронте без перемен', author: 'Эрих Мария Ремарк', clubId: 'cl1', color: '#556677', year: 2022 },
        // 2023 (янв–дек): книги 19–30
        { id: 'b288', title: 'Брать, давать и наслаждаться', author: 'Татьяна Мужицкая', clubId: 'cl1', color: '#cc5566', year: 2023 },
        { id: 'b289', title: 'Трудно быть богом', author: 'А. и Б. Стругацкие', clubId: 'cl1', color: '#445566', year: 2023 },
        { id: 'b290', title: 'Не рычите на собаку', author: 'Карен Прайор', clubId: 'cl1', color: '#669933', year: 2023 },
        { id: 'b291', title: 'Шоколад', author: 'Джоанн Харрис', clubId: 'cl1', color: '#553311', year: 2023 , coverUrl: 'https://ir.ozone.ru/s3/multimedia-8/wc500/6732582344.jpg'},
        { id: 'b292', title: 'Искусство любить', author: 'Эрих Фромм', clubId: 'cl1', color: '#aa3355', year: 2023 },
        { id: 'b293', title: 'Атлант расправил плечи', author: 'Айн Рэнд', clubId: 'cl1', color: '#776644', year: 2023 },
        { id: 'b294', title: 'Алмазный огранщик', author: 'Майкл Роуч', clubId: 'cl1', color: '#2277aa', year: 2023 },
        { id: 'b295', title: 'Великий Гэтсби', author: 'Фрэнсис Скотт Фицджеральд', clubId: 'cl1', color: '#aa9933', year: 2023 },
        { id: 'b296', title: 'Как читать книги', author: 'Мортимер Адлер', clubId: 'cl1', color: '#445588', year: 2023 },
        { id: 'b297', title: 'Книжный вор', author: 'Маркус Зусак', clubId: 'cl1', color: '#884444', year: 2023 },
        { id: 'b298', title: 'Не мешай себе жить', author: 'Марк Гоулстон', clubId: 'cl1', color: '#3399aa', year: 2023 },
        { id: 'b299', title: 'Задача трёх тел', author: 'Лю Цысинь', clubId: 'cl1', color: '#226688', year: 2023, coverUrl: 'https://www.podpisnie.ru/upload/resize_images/92979877/classic_1024x537_92979877.jpeg' },
        // 2024 (янв–дек): книги 31–42 (книги 39 и 42 уже есть в базе)
        { id: 'b300', title: 'Люди, которые играют в игры', author: 'Эрик Берн', clubId: 'cl1', color: '#446699', year: 2024 },
        { id: 'b301', title: 'Фантазии женщины средних лет', author: 'Анатолий Тосс', clubId: 'cl1', color: '#bb6688', year: 2024 },
        { id: 'b302', title: 'Атомные привычки', author: 'Джеймс Клир', clubId: 'cl1', color: '#e8a830', year: 2024, coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-6/wc1000/9294335214.jpg' },
        { id: 'b303', title: 'Мартин Иден', author: 'Джек Лондон', clubId: 'cl1', color: '#334455', year: 2024 },
        { id: 'b304', title: 'Эгоистичный ген', author: 'Ричард Докинз', clubId: 'cl1', color: '#335577', year: 2024 },
        { id: 'b305', title: 'Идиот', author: 'Ф.М. Достоевский', clubId: 'cl1', color: '#774455', year: 2024 },
        { id: 'b306', title: '7 навыков высокоэффективных людей', author: 'Стивен Кови', clubId: 'cl1', color: '#2266aa', year: 2024 },
        { id: 'b307', title: 'Мастер и Маргарита', author: 'Михаил Булгаков', clubId: 'cl1', color: '#332244', year: 2024 },
        // книга 39 (Сказать жизни ДА!) — уже есть как b22
        { id: 'b308', title: 'Стоунер', author: 'Джон Уильямс', clubId: 'cl1', color: '#5555aa', year: 2024, coverUrl: 'https://ia801705.us.archive.org/view_archive.php?archive=/29/items/l_covers_0008/l_covers_0008_31.zip&file=0008310729-L.jpg' },
        { id: 'b309', title: 'От хорошего к великому', author: 'Джим Коллинз', clubId: 'cl1', color: '#2244aa', year: 2024 },
        // книга 42 (Фауст) — уже есть как b21
        // Екатеринбург
        {
            id: 'b23', title: 'Рассказ продавщицы', author: 'Тэффи', clubId: 'cl6', color: '#88aadd', year: 2026,
            coverUrl: 'https://goods-photos.static1-sima-land.com/items/7358864/0/1600.jpg?v=1684858573',
        },
        {
            id: 'b24', title: 'Богатая жизнь', author: 'М.М. Зощенко', clubId: 'cl6', color: '#cc8844', year: 2026,
            coverUrl: 'https://ir.ozone.ru/multimedia/1003849375.jpg',
        },
        {
            id: 'b25', title: 'Нечаянная свадьба', author: 'А. Шаховской', clubId: 'cl6', color: '#44aa55', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/i?id=53ff22f2e7900226a0723187fa59f972_l-5204758-images-thumbs&n=13',
        },
        // SOK Екатеринбург
        {
            id: 'b26', title: 'Игрок', author: 'Ф.М. Достоевский', clubId: 'cl7', color: '#aa3333', year: 2026,
            coverUrl: 'https://www.moscowbooks.ru/image/book/509/orig/i509096.jpg?cu=20180101000000',
            location: 'Екатеринбург, Декабристов, 69',
        },
        {
            id: 'b27', title: 'Семь навыков высокоэффективных людей', author: 'С. Кови', clubId: 'cl7', color: '#3355aa', year: 2026,
            coverUrl: 'https://content.img-gorod.ru/pim/products/images/21/84/019a5dca-c0f3-73a0-ba10-3d8d30e32184.jpg?width=608&height=876&fit=bounds',
            location: 'Екатеринбург, Декабристов, 69',
        },
        {
            id: 'b28', title: 'Счастливый карман, полный денег', author: 'Д. Кэмерон Маканди', clubId: 'cl7', color: '#33aa55', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-3/wc2500/7328591667.jpg',
            location: 'Екатеринбург, Декабристов, 69',
        },
        {
            id: 'b73', title: 'Чайка Джонатан Ливингстон', author: 'Ричард Бах', clubId: 'cl7', color: '#55ccff', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/39848905.jpg',
            meetingDate: '2026-04',
            location: 'Екатеринбург, Декабристов, 69',
        },
        {
            id: 'b74', title: 'Мы', author: 'Евгений Замятин', clubId: 'cl20', color: '#dd3333', year: 2026,
            coverUrl: 'data:image/svg+xml;utf8,<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg" style="background:%23dd3333"><text x="30" y="80" font-family="Inter,sans-serif" font-weight="900" font-size="64" fill="%23fff">Мы</text><text x="30" y="130" font-family="Inter,sans-serif" font-size="28" fill="%23ffffff99">Е. Замятин</text></svg>',
            meetingDate: '2026-03-30',
            location: 'Екатеринбург',
            registerUrl: 'https://t.me/QticketsBuyBot/buy?startapp=221711'
        },
        {
            id: 'b29', title: 'О любви', author: 'А.П. Чехов', clubId: 'cl6', color: '#7755aa', year: 2026,
            coverUrl: 'https://cdn.respublica.ru/uploads/01/00/00/2m/0h/large_webp_7679497cc479cd4c.webp?1461332478',
        },
        {
            id: 'b30', title: 'Анна Каренина', author: 'Л.Н. Толстой', clubId: 'cl6', color: '#aa3333', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/172100.jpg',
        },
        {
            id: 'b28', title: 'Полинька Сакс', author: 'А. Дружинин', clubId: 'cl6', color: '#55aacc', year: 2026,
            coverUrl: 'https://ir.ozone.ru/multimedia/1010408258.jpg',
        },
        {
            id: 'b68', title: 'Вечно молоды', author: 'Ирина Гаврилова', clubId: 'cl6', color: '#88aabb', year: 2026,
            coverUrl: '/cover-gavrilov.jpg',
            meetingDate: '2026-03-12', meetingTime: '17:00 (МСК)',
            registerUrl: 'https://bububuschool.ru/book_club'
        },
        {
            id: 'b69', title: 'Сказка о молодильных яблоках...', author: 'А.Н. Толстой', clubId: 'cl6', color: '#cc6644', year: 2026,
            coverUrl: '/cover-apples.webp',
            meetingDate: '2026-03-19', meetingTime: '17:00 (МСК)',
            registerUrl: 'https://bububuschool.ru/book_club'
        },
        {
            id: 'b70', title: 'Конёк-Горбунок', author: 'П.П. Ершов', clubId: 'cl6', color: '#225588', year: 2026,
            coverUrl: '/cover-ershov.jpg',
            meetingDate: '2026-03-26', meetingTime: '17:00 (МСК)',
            registerUrl: 'https://bububuschool.ru/book_club'
        },
        // Школа Великих книг (Москва)
        { id: 'b31', title: 'Игры, в которые играют люди', author: 'Эрик Берн', clubId: 'cl8', color: '#cc5533', year: 2026, tag: 'книга1' },
        { id: 'b32', title: 'Люди, которые играют в игры', author: 'Эрик Берн', clubId: 'cl8', color: '#33cc55', year: 2026, tag: 'книга1' },
        { id: 'b33', title: 'Агрессия. Так называемое зло', author: 'Конрад Лоренц', clubId: 'cl8', color: '#bbaa22', year: 2026, tag: 'книга1' },
        { id: 'b34', title: 'Как читать книги', author: 'Мортимер Адлер', clubId: 'cl8', color: '#22aabb', year: 2026, tag: 'книга1' },
        { id: 'b35', title: 'Стратегия. Логика войны и мира', author: 'Эдвард Люттвак', clubId: 'cl8', color: '#aa44cc', year: 2026, tag: 'книга1' },
        { id: 'b36', title: 'Семиотика', author: 'Георгий Почепцов', clubId: 'cl8', color: '#4455aa', year: 2026, tag: 'книга1' },
        { id: 'b37', title: 'Миф машины', author: 'Льюис Мамфорд', clubId: 'cl8', color: '#a0a0a0', year: 2026, tag: 'книга1' },
        { id: 'b38', title: 'Морфология волшебной сказки', author: 'Владимир Пропп', clubId: 'cl8', color: '#f06060', year: 2026, tag: 'книга1' },
        { id: 'b39', title: 'Древний человек в городе', author: 'Александр Пятигорский', clubId: 'cl8', color: '#dfca65', year: 2026, tag: 'книга1' },
        { id: 'b40', title: 'В поисках чудесного', author: 'Петр Успенский', clubId: 'cl8', color: '#6688cc', year: 2026, tag: 'книга1' },
        { id: 'b41', title: 'Эгоистичный ген', author: 'Ричард Докинз', clubId: 'cl8', color: '#993333', year: 2026, tag: 'книга1' },
        { id: 'b42', title: 'Человек убеждённый', author: 'Эрик Хоффер', clubId: 'cl8', color: '#44aa88', year: 2026, tag: 'книга1' },
        // Книжный клуб Всмысле (Санкт-Петербург)
        {
            id: 'b43', title: 'Как научиться оптимизму', author: 'М. Селигман', clubId: 'cl9', color: '#3388cc', year: 2026,
            coverUrl: '/cover-seligman.jpg',
        },
        {
            id: 'b44', title: 'Невыносимая лёгкость бытия', author: 'М. Кундера', clubId: 'cl9', color: '#cc5599', year: 2026,
            coverUrl: '/cover-kundera.jpg',
        },
        {
            id: 'b45', title: 'Степной волк', author: 'Г. Гессе', clubId: 'cl9', color: '#886633', year: 2026,
            coverUrl: '/cover-steppenwolf.jpg',
        },
        // Между строк (Москва)
        {
            id: 'b46', title: 'Джеймс', author: 'П. Эверетт', clubId: 'cl10', color: '#22aa77', year: 2026,
            coverUrl: '/cover-james.jpg',
        },
        {
            id: 'b47', title: 'Мельница на Флоссе', author: 'Дж. Элиот', clubId: 'cl10', color: '#8855cc', year: 2026,
            coverUrl: '/cover-mill-floss.jpg',
        },
        // Skolkovo Alumni (ticker-only)
        {
            id: 'b50', title: 'Стратегия личности', author: '', clubId: 'cl11', color: '#666666', year: 2026,
            coverUrl: '/cover-strategy.jpg',
            meetingDate: '2026-03-12', meetingTime: '19:00–22:00',
            location: 'Кластер "Ломоносов", Раменский бульвар, 1 (м. Раменки, м. Университет)',
            registerUrl: 'https://migel-agency.timepad.ru/event/3851905/',
        },
        // Университет карьерного роста (ticker-only, hidden name)
        {
            id: 'b53', title: 'Клуб неисправимых оптимистов', author: 'Ж.-М. Генассия', clubId: 'cl13', color: '#556688', year: 2026,
            coverUrl: '/cover-optimists.jpg',
            meetingDate: '2026-03-15', meetingTime: '12:00–14:00',
            location: 'Ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club',
        },
        {
            id: 'b54', title: 'Приглашение на казнь', author: 'В.В. Набоков', clubId: 'cl13', color: '#774422', year: 2026,
            coverUrl: '/cover-invitation.jpg',
            meetingDate: '2026-03-29', meetingTime: '12:00–14:00',
            location: 'Ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club',
        },
        // Думай иначе (Тюмень)
        {
            id: 'b51', title: '12 недель в году', author: 'Б. Моран', clubId: 'cl12', color: '#cc6633', year: 2026,
            coverUrl: '/cover-12weeks.jpg',
        },
        {
            id: 'b52', title: 'Я ненавижу компромисс!', author: 'Кузавов', clubId: 'cl12', color: '#993300', year: 2026,
            coverUrl: '/cover-compromise.jpg',
        },
        // Книжный четверг (Москва)
        {
            id: 'b55', title: 'Триггеры', author: 'М. Голдсмит', clubId: 'cl14', color: '#aa5500', year: 2026,
            coverUrl: '/cover-triggers-goldsmith.jpg',
        },
        {
            id: 'b56', title: 'Изобретатель кроссовок', author: 'Дж. Фостер', clubId: 'cl14', color: '#3366aa', year: 2026,
            coverUrl: '/cover-sneaker.jpg',
        },
        {
            id: 'b266', title: 'Это не сработает', author: 'Марк Рэндольф', clubId: 'cl14', color: '#dd6644', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/63755262.jpg',
            meetingDate: '2026-05-27',
            meetingTime: '17:00',
            location: 'БЦ "Tower A", ауд. 807',
        },
        {
            id: 'b503', title: 'Ружья, микробы и сталь', author: 'Джаред Даймонд',
            clubId: 'cl14', color: '#7a5c2e', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1622708276i/58250776._SX600_.jpg',
            meetingDate: '2026-07-30',
            meetingTime: '17:00',
            location: 'БЦ «Tower A», аудитория 807',
            registerUrl: 'mailto:kudryavtceva_n@magnit.ru',
        },
        // Литературный клуб Синхронизации (Онлайн, central planet)
        {
            id: 'b57', title: 'Алиса в стране Чудес', author: 'Л. Кэрролл', clubId: 'cl15', color: '#ff33aa', year: 2026,
            coverUrl: '/cover-alice.jpg',
        },
        {
            id: 'b58', title: 'Госпожа Бовари', author: 'Г. Флобер', clubId: 'cl15', color: '#cc2244', year: 2026,
            coverUrl: '/cover-bovary.jpg',
        },
        {
            id: 'b59', title: 'Рассказ служанки', author: 'М. Этвуд', clubId: 'cl15', color: '#881122', year: 2026,
            coverUrl: '/cover-handmaid.jpg',
        },
        {
            id: 'b258', title: 'Одиссея', author: 'Гомер', clubId: 'cl15', color: '#1a6b8a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/multimedia/1017362956.jpg',
            selectedDate: '2026-05-16',
            meetingDate: '2026-06-29',
            registerUrl: 'https://online.synchronize.ru/literature/literaryclub',
        },
        {
            id: 'b259', title: 'Дюна', author: 'Фрэнк Герберт', clubId: 'cl15', color: '#c4a030', year: 2026,
            coverUrl: 'https://ia801701.us.archive.org/view_archive.php?archive=/4/items/l_covers_0011/l_covers_0011_48.zip&file=0011481354-L.jpg',
            selectedDate: '2026-05-16',
            meetingDate: '2026-06-29',
            registerUrl: 'https://online.synchronize.ru/literature/literaryclub',
        },
        {
            id: 'b260', title: 'Хоббит, или Туда и обратно', author: 'Дж. Р. Р. Толкин', clubId: 'cl15', color: '#2a6b3a', year: 2026,
            coverUrl: 'https://cv0.litres.ru/pub/c/cover/27822616.jpg',
            selectedDate: '2026-05-16',
            meetingDate: '2026-06-29',
            registerUrl: 'https://online.synchronize.ru/literature/literaryclub',
        },
        {
            id: 'b808', title: 'Имя розы', author: 'Умберто Эко',
            clubId: 'cl15', color: '#8b4513', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/11298693/hat5cb5543457833329f6872ce012748dfa/orig',
            meetingDate: '2026-10-12',
            registerUrl: 'https://online.synchronize.ru/literature/literaryclub',
        },
        {
            id: 'b807', title: 'Женщина в белом', author: 'Уилки Коллинз',
            clubId: 'cl15', color: '#e8e8e8', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1678279232i/84445105._SX600_.jpg',
            meetingDate: '2026-11-12',
            registerUrl: 'https://online.synchronize.ru/literature/literaryclub',
        },
        {
            id: 'b806', title: 'Имя мне — красный', author: 'Орхан Памук',
            clubId: 'cl15', color: '#c0392b', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/8673867.jpg',
            meetingDate: '2026-12-12',
            registerUrl: 'https://online.synchronize.ru/literature/literaryclub',
        },
        // Шалость удалась (Москва)
        {
            id: 'b60', title: 'Собиратели ракушек', author: 'Р. Пилчер', clubId: 'cl16', color: '#5599aa', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-k/wc1000/7402967480.jpg',
        },

        // Книжный клуб МГУ (Москва)
        {
            id: 'b62', title: 'Пан', author: 'Кнут Гамсун', clubId: 'cl17', color: '#44aa77', year: 2026,
            coverUrl: '/cover-pan.webp',
        },
        {
            id: 'b63', title: 'Возвращение в Брайдсхед', author: 'Ивлин Во', clubId: 'cl17', color: '#3366cc', year: 2026,
            coverUrl: '/cover-brideshead.jpg',
        },
        {
            id: 'b64', title: 'Воскресение', author: 'Л.Н. Толстой', clubId: 'cl17', color: '#1a4a1a', year: 2026,
            coverUrl: '/cover-voskresenie.jpg',
        },
        {
            id: 'b65', title: 'Все решено', author: 'Р. Сапольски', clubId: 'cl17', color: '#cc5533', year: 2026,
            coverUrl: '/cover-sapolsky.jpg',
            meetingDate: '2026-03-15', meetingTime: '15:00',
            location: 'г. Москва, ул. Новаторов, д. 14, корп. 1 (лекторий Библиотеки №172)',
            eventUrl: 'https://vk.com/wall-198987146_1480'
        },
        {
            id: 'b72', title: 'Щегол', author: 'Донна Тартт', clubId: 'cl17', color: '#2f4a7a', year: 2026,
            coverUrl: '/cover-goldfinch.jpg',
            meetingDate: '2026-03-29',
            location: 'Москва',
        },
        {
            id: 'b112', title: 'Доктор Фаустус', author: 'Томас Манн', clubId: 'cl17', color: '#663399', year: 2026,
            coverUrl: 'https://covers.openlibrary.org/b/isbn/0679600426-L.jpg?default=false',
            meetingDate: '2026-04-26', meetingTime: '15:00',
            location: 'г. Москва, ул. Новаторов, д. 14, корп. 1 (лекторий Библиотеки №172)',
            selectedDate: '2026-04-23'
        },
        {
            id: 'b265', title: 'Задача трёх тел', author: 'Лю Цысинь', clubId: 'cl17', color: '#aa33ff', year: 2026,
            coverUrl: 'https://www.podpisnie.ru/upload/resize_images/92979877/classic_1024x537_92979877.jpeg',
            location: 'г. Москва, ул. Новаторов, д. 14, корп. 1 (лекторий Библиотеки №172)',
        },
        {
            id: 'b267', title: 'Стамбул. Город воспоминаний', author: 'Орхан Памук', clubId: 'cl17', color: '#aa33ff', year: 2026,
            coverUrl: 'https://covers.openlibrary.org/b/id/8310170-L.jpg?default=false',
            meetingDate: '2026-05-31',
            location: 'г. Москва, ул. Новаторов, д. 14, корп. 1 (лекторий Библиотеки №172)',
        },
        // Книжный клуб SOK Спб (Санкт-Петербург)
        {
            id: 'b66', title: 'Дом сна', author: 'Джонатан Коу', clubId: 'cl18', color: '#334466', year: 2026,
            coverUrl: '/cover-coe.jpg',
        },
        {
            id: 'b67', title: 'Фигуры света', author: 'Сара Мосс', clubId: 'cl18', color: '#aa8877', year: 2026,
            coverUrl: '/cover-moss.jpg',
        },
        // Книжный клуб "На чердаке" (ticker-only)
        {
            id: 'b71', title: 'У медуз нет ушей', author: 'А. Розенфельд', clubId: 'cl19', color: '#3b6a8f', year: 2026,
            coverUrl: '/cover-meduza.jpg',
            meetingDate: '2026-03-29', meetingTime: '',
            location: 'Место не определено',
        },
        {
            id: 'b80', title: 'Братья Карамазовы', author: 'Ф.М. Достоевский', clubId: 'cl9', color: '#2244aa', year: 2026,
            coverUrl: '/cover-karamazov.jpg',
            meetingDate: '2026-04-07 19:00',
            location: 'Пространство SENO, Гороховая, 49',
            registerUrl: 'https://soobshchestvo-vsmysle.timepad.ru/event/3771085/?utm_source=tg&utm_medium=social&utm_campaign=20260407-knizhnyy-klub-vsmysle&utm_content=post&utm_term=vsmysle'
        },
        {
            id: 'b81', title: 'Сто лет одиночества', author: 'Габриэль Гарсиа Маркес', clubId: 'cl9', color: '#55aacc', year: 2026,
            coverUrl: '/cover-100-years.jpg',
            meetingDate: '2026-05-12 19:00',
            location: 'Пространство SENO, Гороховая, 49',
            registerUrl: 'https://soobshchestvo-vsmysle.timepad.ru/event/3881833/?utm_source=tg&utm_medium=social&utm_campaign=20260512-knizhnyy-klub-vsmysle&utm_content=post&utm_term=vsmysle'
        },
        {
            id: 'b82', title: 'Шантарам', author: 'Грегори Дэвид Робертс', clubId: 'cl9', color: '#cc5522', year: 2026,
            coverUrl: '/cover-shantaram.jpg',
            meetingDate: '2026-06-09 19:00',
            location: 'Пространство SENO, Гороховая, 49',
            registerUrl: 'https://soobshchestvo-vsmysle.timepad.ru/event/3881835/?utm_source=tg&utm_medium=social&utm_campaign=20260609-knizhnyy-klub-vsmysle&utm_content=post&utm_term=vsmysle'
        },
        {
            id: 'b83', title: 'Стоунер', author: 'Джон Уильямс', clubId: 'cl9', color: '#5555aa', year: 2026,
            coverUrl: 'https://ia801705.us.archive.org/view_archive.php?archive=/29/items/l_covers_0008/l_covers_0008_31.zip&file=0008310729-L.jpg',
            meetingDate: '2026-07-14 19:00',
            location: 'Пространство SENO, Гороховая, 49',
            registerUrl: 'https://soobshchestvo-vsmysle.timepad.ru/event/3881836/?utm_source=tg&utm_medium=social&utm_campaign=20260714-knizhnyy-klub-vsmysle&utm_content=post&utm_term=vsmysle'
        },
        {
            id: 'b84', title: 'Коллекционер', author: 'Джон Фаулз', clubId: 'cl9', color: '#aa4455', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/70929622.jpg',
            meetingDate: '2026-08-11 19:00',
            location: 'Пространство SENO, Гороховая, 49',
            registerUrl: 'https://soobshchestvo-vsmysle.timepad.ru/event/3881837/?utm_source=tg&utm_medium=social&utm_campaign=20260811-knizhnyy-klub-vsmysle&utm_content=post&utm_term=vsmysle'
        },
        {
            id: 'b85', title: 'Имя мне — красный', author: 'Орхан Памук', clubId: 'cl10', color: '#ffd700', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/8673867.jpg',
            meetingDate: '2026-04-22',
            meetingTime: '18:30',
            location: 'капсула № 2',
            registerUrl: 'https://bookclubsk1126.events.sk.ru/',
            isNobel: true
        },
        {
            id: 'b86', title: 'Утешительная партия игры в петанк', author: 'Анна Гавальда', clubId: 'cl16', color: '#88aabb', year: 2026,
            coverUrl: 'https://cv0.litres.ru/pub/c/cover/6508213.jpg',
            meetingDate: '2026-04-05',
            meetingTime: '12:00',
            location: 'Chère Maman (Трубная 26, корп.1)'
        },
        {
            id: 'b502', title: 'Завет воды', author: 'Абрахам Вергезе',
            clubId: 'cl16', color: '#2a6655', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/70795744.jpg',
            meetingDate: '2026-07-18',
            location: 'Онлайн',
        },
        {
            id: 'b87', title: 'Герой нашего времени', author: 'М.Ю. Лермонтов', clubId: 'cl7', color: '#998877', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/172009.jpg',
            meetingDate: '2026-04-16',
            meetingTime: '18:30',
            location: '1 этаж | конференц-зал'
        },
        {
            id: 'b113', title: 'Мой сосед-миллионер', author: 'Уильям Данко, Томас Стенли', clubId: 'cl7', color: '#2255aa', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/get-mpic/16479329/2a0000019b21981d972edf6a33ebb37596c1/orig',
            selectedDate: '2026-04-16',
            meetingDate: '2026-05-12',
            location: '1 этаж | конференц-зал'
        },
        {
            id: 'b122', title: 'Атомные привычки', author: 'Джеймс Клир', clubId: 'cl7', color: '#e8a830', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-6/wc1000/9294335214.jpg',
            meetingDate: '2026-06-25',
            location: '1 этаж | конференц-зал',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events'
        },
        {
            id: 'b89', title: 'Перевал в середине пути. Как преодолеть...', author: 'Джеймс Холлис', clubId: 'cl1', color: '#44aa88', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/9368218.jpg',
            meetingDate: '2026-05-28',
            meetingTime: '19:00',
            location: 'SOK Рыбаков Тауэр, 103 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events',
            isAnniversary: true
        },
        {
            id: 'b310', title: 'Чемодан', author: 'Сергей Довлатов', clubId: 'cl1', color: '#8B6914', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1681458123i/119450152._SX600_.jpg',
            meetingDate: '2026-06-25',
            meetingTime: '19:00',
            location: 'SOK Рыбаков Тауэр, 103 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events;coworking_id=1;location_id=14;widget=1;ids=;lang=ru;id=1325',
        },
        {
            id: 'b120', title: 'Шантарам', author: 'Грегори Дэвид Робертс', clubId: 'cl1', color: '#cc5522', year: 2026,
            coverUrl: '/cover-shantaram.jpg',
            selectedDate: '2026-05-04',
            meetingDate: '2026-08-27',
            meetingTime: '19:00',
            location: 'SOK Рыбаков Тауэр, 103 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events'
        },
        {
            id: 'b501', title: 'Нетворкинг для разведчиков. Как извлечь пользу из любого знакомства', author: 'Андрей Безруков', clubId: 'cl1', color: '#bb44ff', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/66635352.jpg',
            meetingDate: '2026-07-30',
            meetingTime: '19:00',
            location: 'SOK Рыбаков Тауэр, 103 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events'
        },
        {
            id: 'b830', title: 'Накопительный эффект', author: 'Даррен Харди',
            clubId: 'cl1', color: '#bb44ff', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1744194599i/231210719._SX600_.jpg',
            meetingDate: '2026-09-25',
            meetingTime: '19:00',
            location: 'SOK Рыбаков Тауэр, 103 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events'
        },
        {
            id: 'b90', title: 'Креативные засранцы. Творческий майндсет...', author: 'Дмитрий Николаев', clubId: 'cl10', color: '#ffcc00', year: 2026,
            coverUrl: '',
            meetingDate: '2026-04-24',
            meetingTime: '19:00–22:00',
            location: 'Дом Атлантов, Романов пер., 4, стр. 2',
            registerUrl: 'https://migel-agency.timepad.ru/event/3897313/',
            isAuthorMeet: true
        },
        {
            id: 'b312', title: 'Глазами клоуна', author: 'Генрих Бёлль', clubId: 'cl10', color: '#cc3333', year: 2026,
            coverUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS30XDt0Rr2BOr9TuDnzip7QapxFIq_LvlQfrdWSe7IAg&s=10',
            meetingDate: '2026-06-18',
            meetingTime: '18:30',
            location: 'капсула Малевича',
            registerUrl: 'https://bookclubsk1179.events.sk.ru/',
            isNobel: true,
        },
        {
            id: 'b504', title: 'Рассечение Стоуна', author: 'Абрахам Вергезе',
            clubId: 'cl10', color: '#3a5f7a', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/19038244.jpg',
            meetingDate: '2026-08-26',
            meetingTime: '18:30',
            location: 'Технопарк «Сколково», капсула №2',
            registerUrl: 'https://bookclubsk1177.events.sk.ru/',
        },
        {
            id: 'b91', title: 'Творцы совпадений', author: 'Йоав Блум', clubId: 'cl18', color: '#bb44ff', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/38978435.jpg',
            meetingDate: '2026-04-22',
            meetingTime: '19:00',
            location: '2 этаж, 201 переговорная',
            registerUrl: 'https://t.me/bookclubsok_spb'
        },
        {
            id: 'b114', title: 'Протагонист', author: 'Ася Володина', clubId: 'cl18', color: '#bb44ff', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/69152536.jpg',
            meetingDate: '2026-05-20',
            meetingTime: '19:00',
            location: '2 этаж, 201 переговорная',
            registerUrl: 'https://t.me/bookclubsok_spb'
        },
        {
            id: 'b311', title: 'Тайный дневник Верити', author: 'Колин Гувер', clubId: 'cl18', color: '#bb44ff', year: 2026,
            coverUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRrlcQ52bE42IwTidIolbD1QNZbDAow8VsyiJAKf0y7ow&s=10',
            meetingDate: '2026-06-24',
            meetingTime: '19:00',
            location: '2 этаж, 201 переговорная',
            registerUrl: 'https://my.sok.works/uu/#/booking/coworking-events;coworking_id=1;location_id=11;widget=1;ids=;lang=ru;id=1317',
        },
        {
            id: 'b507', title: 'Сезон отравленных плодов', author: 'Вера Богданова',
            clubId: 'cl18', color: '#6a1f3a', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/67176513.jpg',
            meetingDate: '2026-07-30',
            meetingTime: '19:00',
            location: '2 этаж, 201 переговорная',
            registerUrl: 'https://t.me/bookclubsok_spb',
        },
        {
            id: 'b92', title: 'К востоку от Эдема', author: 'Джон Стейнбек', clubId: 'cl13', color: '#aa4466', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-8/6666103664.jpg',
            meetingDate: '2026-04-12',
            meetingTime: '12:00–14:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club#popup:embedcode2007'
        },
        {
            id: 'b93', title: 'О чем я молчала', author: 'Азар Нафиси', clubId: 'cl13', color: '#aa4466', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/70579882.jpg',
            meetingDate: '2026-04-26',
            meetingTime: '12:00–14:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club#popup:embedcode0607'
        },
        {
            id: 'b261', title: 'Госпожа Бовари', author: 'Гюстав Флобер', clubId: 'cl13', color: '#7a3a6e', year: 2026,
            coverUrl: '/cover-bovary.jpg',
            selectedDate: '2026-05-15',
            meetingDate: '2026-06-07',
            meetingTime: '12:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club#popup:embedcode0308'
        },
        {
            id: 'b262', title: 'Понедельник начинается в субботу', author: 'А. и Б. Стругацкие', clubId: 'cl13', color: '#2a5a8c', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-n/wc1000/7303189847.jpg',
            meetingDate: '2026-05-24',
            meetingTime: '12:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club',
            genreRibbon: 'Фантастика'
        },
        {
            id: 'b326', title: 'Первая любовь', author: 'Иван Тургенев', clubId: 'cl13', color: '#6a4a3c', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1746530799i/233056495._SX600_.jpg',
            meetingDate: '2026-06-21',
            meetingTime: '12:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club'
        },
        {
            id: 'b327', title: 'Записки перед казнью', author: 'Даня Кукафка', clubId: 'cl13', color: '#4a2c2a', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1747654559i/234471589._SX600_.jpg',
            meetingDate: '2026-07-05',
            meetingTime: '12:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club'
        },
        {
            id: 'b328', title: 'Каторга', author: 'Валентин Пикуль', clubId: 'cl13', color: '#3a4a5a', year: 2026,
            coverUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcScZZGkw4Bw8kc9GZ2mJ5bUHBW_oXe8Py2pkmoFkEbyJBhBN2a8ciCS99_H&s=10',
            meetingDate: '2026-07-19',
            meetingTime: '12:00',
            location: 'ресторан в центре Москвы',
            registerUrl: 'https://career-university.ru/reading_club'
        },
        {
            id: 'b831', title: 'Крестный отец', author: 'Марио Пьюзо', clubId: 'cl13', color: '#1a1a2e', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-5/wc1000/7039483529.jpg',
            meetingDate: '2026-08-30',
            meetingTime: '12:00-14:00',
            location: 'Институт карьерного развития Москва',
            registerUrl: 'https://career-university.ru/reading_club'
        },
        {
            id: 'b94', title: 'Читая Лолиту в Тегеране', author: 'Азар Нафиси', clubId: 'cl19', color: '#778899', year: 2026,
            isClubTop: true,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover_200/68053183.jpg',
            meetingDate: '2026-04-26',
            location: 'уточняется',
            registerUrl: 'https://t.me/ariadna_by'
        },
        {
            id: 'b95', title: 'Скупой рыцарь', author: 'Александр Пушкин', clubId: 'cl6', color: '#ffaaaa', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/173025.jpg',
            meetingDate: '2026-04-09',
            location: 'онлайн',
            registerUrl: 'https://bububuschool.ru/book_club#!/tab/702186737-4',
            selectedDate: '2026-04-03'
        },
        {
            id: 'b96', title: 'Бешеные деньги', author: 'Александр Островский', clubId: 'cl6', color: '#aaffaa', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/127131.jpg',
            meetingDate: '2026-04-16',
            location: 'онлайн',
            registerUrl: 'https://bububuschool.ru/book_club#!/tab/702186737-4',
            selectedDate: '2026-04-03'
        },
        {
            id: 'b97', title: 'Двести франков с процентами', author: 'Сергей Довлатов', clubId: 'cl6', color: '#aaaaff', year: 2026,
            coverUrl: 'data:image/svg+xml;utf8,<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg" style="background:%23aaaaff"><text x="30" y="80" font-family="Inter,sans-serif" font-weight="900" font-size="46" fill="%23fff">Двести</text><text x="30" y="135" font-family="Inter,sans-serif" font-weight="900" font-size="46" fill="%23fff">франков</text><text x="30" y="190" font-family="Inter,sans-serif" font-weight="900" font-size="46" fill="%23fff">с процентами</text><text x="30" y="250" font-family="Inter,sans-serif" font-size="28" fill="%23ffffffaa">С. Довлатов</text></svg>',
            meetingDate: '2026-04-23',
            location: 'онлайн',
            selectedDate: '2026-04-03'
        },
        // Книжный клуб Евгении Власенко — основные книги 2026
        { id: 'b98',  title: 'Царствие мне небесное',  author: 'Вера Богданова',      clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1774780508i/250379090._SX600_.jpg',
            selectedDate: '2026-03-19',
            meetingDate: '2026-04-19' },
        { id: 'b99',  title: 'Землеедка',               author: 'Долорес Рейес',       clubId: 'cl21', color: '#ff88cc', year: 2026 },
        { id: 'b100', title: 'А леса у нас тихие',      author: 'Алена Селютина',      clubId: 'cl21', color: '#88ccff', year: 2026 },
        { id: 'b101', title: 'В Буйнакске немного нервно', author: 'Алиса Ганиева',   clubId: 'cl21', color: '#ffcc88', year: 2026 },
        { id: 'b102', title: 'Кайрос',                  author: 'Дженни Эрпенбек',    clubId: 'cl21', color: '#88ffcc', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/73294988.jpg' },
        { id: 'b103', title: 'Мост',                    author: 'Джессика Энтони',    clubId: 'cl21', color: '#ffaa44', year: 2026,
            coverUrl: 'https://books.google.com/books/content?id=NUW9EQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api' },
        { id: 'b104', title: 'Участь Мэри Роуз',        author: 'Кэролайн Блэквуд',   clubId: 'cl21', color: '#ff6688', year: 2026 },
        { id: 'b105', title: 'Путешествие на край жизни', author: 'Тезер Озлю',       clubId: 'cl21', color: '#aaffee', year: 2026,
            coverUrl: 'https://cv0.litres.ru/pub/c/cover/73429533.jpg' },
        { id: 'b106', title: 'Крууга',                  author: 'Анна Лужбина',       clubId: 'cl21', color: '#ddaaff', year: 2026,
            coverUrl: 'https://cv0.litres.ru/pub/c/cover/73011332.jpg' },
        // Книжный клуб Евгении Власенко — лучшие книги клуба по годам
        {
            id: 'b107', title: 'Саспыга', author: 'Карина Шаинян', clubId: 'cl21', color: '#aa88dd', year: 2025,
            isBestOfClub: true, bestYear: 2025,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1748516286i/235294288._SX600_.jpg',
        },
        {
            id: 'b108', title: 'Кадавры', author: 'Алексей Поляринов', clubId: 'cl21', color: '#aa88dd', year: 2024,
            isBestOfClub: true, bestYear: 2024,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1731612460i/221524743._SX600_.jpg',
        },
        {
            id: 'b109', title: 'Руки женщин моей семьи были не для письма', author: 'Егана Джаббарова', clubId: 'cl21', color: '#aa88dd', year: 2023,
            isBestOfClub: true, bestYear: 2023,
            coverUrl: 'https://cv0.litres.ru/pub/c/cover/70093306.jpg',
        },
        {
            id: 'b110', title: 'Читая "Лолиту" в Тегеране', author: 'Азар Нафиси', clubId: 'cl21', color: '#aa88dd', year: 2022,
            isBestOfClub: true, bestYear: 2022, isClubTop: true,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover_200/68053183.jpg',
        },
        {
            id: 'b111', title: 'Конец света, моя любовь', author: 'Алла Горбунова', clubId: 'cl21', color: '#aa88dd', year: 2021,
            isBestOfClub: true, bestYear: 2021,
            coverUrl: 'https://cv0.litres.ru/pub/c/cover/56434904.jpg',
        },
        { id: 'b115', title: 'Эдем', author: 'Аудур Ава Олафсдоттир', clubId: 'cl21', color: '#cc88ff', year: 2026 },
        { id: 'b116', title: 'Хроники пепельной весны. Магма ведьм', author: 'Анна Старобинец', clubId: 'cl21', color: '#cc88ff', year: 2026 },
        { id: 'b117', title: 'Мга', author: 'Дарья Промч', clubId: 'cl21', color: '#cc88ff', year: 2026 },
        { id: 'b815', title: 'Память о наших мечтах', author: 'Кентен Шарье', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-x/wc1000/12261583293.jpg', meetingDate: '2026-07-26' },
        { id: 'b816', title: 'Когда заходит солнце. Семейство Томаса Манна в Санари', author: 'Флориан Иллиес', clubId: 'cl21', color: '#cc88ff', year: 2026 },
        { id: 'b817', title: 'Dendrarium. Пять садов заключённого Дягтерева', author: '', clubId: 'cl21', color: '#cc88ff', year: 2026 },
        { id: 'b818', title: 'Луч', author: 'Даниил Туровский', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://individuum.ru/upload/iblock/cfa/l8rmqzqqezrubdzd3wude9rlmintmzgs.png', meetingDate: '2026-06-28' },
        { id: 'b819', title: 'Ручная кладь', author: 'Алёна Кирсанова', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-r/wc1000/9396842859.jpg' },
        { id: 'b820', title: 'Гурии', author: 'Камель Дауд', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-4/wc1000/11676311896.jpg' },
        { id: 'b821', title: 'Комо', author: 'Срджан Валяревич', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-8/wc1000/10215469952.jpg' },
        { id: 'b822', title: 'Только дальний свет фар', author: 'Илья Мамаев-Найлз', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-q/wc1000/9189654830.jpg', meetingDate: '2026-05-31' },
        { id: 'b823', title: 'Нам нужны новые имена', author: 'НоВайолет Булавайо', clubId: 'cl21', color: '#cc88ff', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-j/wc1000/12945260647.jpg', meetingDate: '2026-05-03' },
        { id: 'b118', title: 'Сценаристка', author: 'Светлана Павлова', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b119', title: 'Желтые обои. Женландия', author: 'Шарлотта Перкинс Гилман', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'bm120', title: 'Центр принятия и адаптации', author: 'Ольга Дмитриева', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b121', title: 'Terra nullius', author: 'Егана Джаббарова', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'bm122', title: 'Плакальщица', author: 'Вэньянь Лу', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b123', title: 'Археологи', author: 'Вячеслав Ставецкий', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b124', title: 'Сделаны из вины', author: 'Йоанна Элми', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b125', title: 'Лысая', author: 'Маша Константиниди', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b126', title: 'Средний возраст', author: 'Яна Верзун', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b127', title: 'Ее сторона истории', author: 'Альба де Сеспедес', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b128', title: 'Жизнь не-Ивана', author: 'Белла Арфуди', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b129', title: 'Bookship. Последний книжный магазин во Вселенной', author: 'Мария Закрученко', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b130', title: 'Сахарная пудра', author: 'Маргарита Полонская', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b131', title: 'Потерянная эпопея', author: 'Алис Зенитер', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b132', title: 'Там мое королевство', author: 'Ася Демишкевич', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b133', title: 'Обширная территория', author: 'Симон Лопес Трухильо', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b134', title: 'Не река', author: 'Сельва Альмада', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b135', title: 'Такого света в мире не было до появления N.', author: 'Оксана Васякина', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b136', title: 'Знаки безразличия', author: 'Анна Бабина', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b137', title: 'Пинега', author: 'Варвара Заборцева', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b138', title: 'Последний лист', author: 'Анна Баснер', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b139', title: 'Улица Холодова', author: 'Евгения Некрасова', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b140', title: 'Сначала женщины и дети', author: 'Алина Грабовски', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b141', title: 'Непокои', author: 'Маргарита Ронжина', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b142', title: 'Ночь между июлем и августом', author: 'Дарья Золотова', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b143', title: 'День города', author: 'Надежда Лидваль', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b144', title: 'Астронавты', author: 'Лаура Ферреро', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b145', title: 'Где. Повесть о Второй карабахской войне', author: 'Коля Степанян', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b146', title: 'Верю / не верю', author: 'Сборник рассказов', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b147', title: 'Письма с острова', author: 'Татьяна Бонч-Осмоловская', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b148', title: 'Латинист', author: 'Марк Принс', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b149', title: 'Отвлекаясь', author: 'Федерика Де Паолис', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b150', title: 'Табия тридцать два', author: 'Алексей Конаков', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b151', title: 'Сгинь', author: 'Настасья Реньжина', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b152', title: 'Собакистан. Сад костей', author: 'Виталий Терлецкий и Катя', clubId: 'cl21', color: '#cc88ff', year: 2025 },
        { id: 'b153', title: 'Дуа за неверного', author: 'Егана Джаббарова', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b154', title: 'Песнь пророка', author: 'Пол Линч', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b155', title: 'Побеги', author: 'Ирина Костарева', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b156', title: 'Рассеяние', author: 'Александр Стесин', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b157', title: 'Выбор воды', author: 'Гала Узрютова', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b158', title: 'Корни: о сплетеньях жизни и семейных тайнах', author: 'Кио Маклир', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b159', title: 'Белград', author: 'Надя Алексеева', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b160', title: 'Шмель', author: 'Аня Гетьман', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b161', title: 'Курорт', author: 'Антон Секисова', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b162', title: 'Необитаемая', author: 'Татьяна Млынчик', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b163', title: 'Развод', author: 'Сьюзен Таубес', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b164', title: 'Сад против времени. В поисках рая для всех', author: 'Оливия Лэнг', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b165', title: 'Лес', author: 'Светлана Тюльбашева', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b166', title: 'Птица скорби', author: 'Мубанга Калимамуквенто', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b167', title: 'Ковентри', author: 'Рейчел Каск', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b168', title: 'Яд', author: 'Таня Коврижка', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b169', title: 'Один и ОК. Как мы учимся быть сами по себе', author: 'Даниэл Шрайбер', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b170', title: 'Под рекой', author: 'Ася Демишкевич', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b171', title: 'Чужая сторона', author: 'Ольга Харитонова', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b172', title: 'Пустые дома', author: 'Бренда Наварро', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b173', title: 'Красные часы', author: 'Лени Зумас', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b174', title: 'Ничто, кроме сердца', author: 'Гриша Пророков', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b175', title: 'Аптечка номер 4', author: 'Булат Ханов', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b176', title: 'Ученичество или книга наслаждений', author: 'Клариси Лиспектор', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b177', title: 'Элена знает', author: 'Клаудиа Пиньейро', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b178', title: 'Так громко, так тихо', author: 'Лена Буркова', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b179', title: 'Течения', author: 'Даша Благова', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b180', title: 'Моя любимая страна', author: 'Елена Костюченко', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b181', title: 'Суть вещи', author: 'Алена Алексина', clubId: 'cl21', color: '#cc88ff', year: 2024 },
        { id: 'b182', title: 'Спригнфилд', author: 'Сергей Давыдов', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b183', title: 'Дислексия', author: 'Светлана Олонцева', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b184', title: 'Смерть в Персии', author: 'Аннемари Шварценбах', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b185', title: 'чорны лес', author: 'тони лашден', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b186', title: 'Голод', author: 'Светлана Павлова', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b187', title: 'Я желаю пепла своему дому', author: 'Даша Серенко', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b188', title: 'Залив терпения', author: 'Мария Ныркова', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b189', title: 'Новая семья: Гостевой брак, лоскутная семья и другие форматы отношений в современном мире', author: 'Светлана Кольчик', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b190', title: 'Пропавшие наши сердца', author: 'Селеста Инг', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b191', title: 'Ваша жестянка сломалась', author: 'Алла Горбунова', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b192', title: 'Хорея', author: 'Марина Кочан', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b193', title: 'Как слышно', author: 'Артем Роганов', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b194', title: 'Последний день лета', author: 'Андрей Подшибякин', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b195', title: 'Мама, я съела слона', author: 'Дарья Месропова', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b196', title: 'Скоро Москва', author: 'Анна Шипилова', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b197', title: 'Полунощница', author: 'Надя Алексеева', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b198', title: 'Инцелы. Как девственники становятся террористами', author: 'Стефан Краковски', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b199', title: 'И в горе, и в радости', author: 'Мег Мэйсон', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b200', title: 'До самого рая', author: 'Ханья Янагихара', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b201', title: 'Роза', author: 'Оксана Васякина', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b202', title: 'Год порно', author: 'Илья Мамаев-Найлз', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b203', title: 'Нация прозака', author: 'Элизабет Вурцель', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b204', title: 'Величайшее благо', author: 'Оливия Мэннинг', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b205', title: 'Золотинка', author: 'Евгения Некрасова', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b206', title: 'Мальчишки из “Никеля”', author: 'Колсон Уайтхед', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b207', title: 'Пловцы', author: 'Джули Оцука', clubId: 'cl21', color: '#cc88ff', year: 2023 },
        { id: 'b208', title: 'Лисьи броды', author: 'Анна Старобинец', clubId: 'cl21', color: '#cc88ff', year: 2023 , coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-p/wc1000/9776160493.jpg'},
        { id: 'b209', title: 'Закрытые. Жизнь гомосексуалов в советском союзе', author: 'Рустам Александер', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b210', title: 'Сообщники', author: 'Сборник рассказов', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b211', title: 'Прекрасный мир, где же ты', author: 'Салли Руни', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b212', title: 'Протагонист', author: 'Ася Володина', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b213', title: 'Холодные глаза', author: 'Ислам Ханипаев', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b214', title: 'Нора', author: 'Хироко Оямада', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b215', title: 'Саша, привет!', author: 'Дмитрий Данилов', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b216', title: 'Троя против всех', author: 'Александр Стесин', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b217', title: 'Южный ветер', author: 'Даша Благова', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b218', title: 'Отец смотрит на Запад', author: 'Екатерина Манойло', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b219', title: 'Выше ноги от земли', author: 'Михаил Турбин', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b220', title: 'Вторжение', author: 'Марго Гритт', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b221', title: 'Оккульттрегер', author: 'Алексей Сальников', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b222', title: 'Типа я', author: 'Ислам Ханипаев', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b223', title: 'Святой папочка', author: 'Патрисия Локвуд', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b224', title: 'Зверобой', author: 'Ксения Буржская', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b225', title: 'Ибупрофен', author: 'Булат Ханов', clubId: 'cl21', color: '#cc88ff', year: 2022 },
        { id: 'b226', title: 'Рана', author: 'Оксана Васякина', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b227', title: 'Памяти памяти', author: 'Мария Степанова', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b228', title: 'Веди свой плуг по костям мертвецов', author: 'Ольга Токарчук', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b229', title: 'Кожа', author: 'Евгения Некрасова', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b230', title: 'Павел Чжан и прочие речные твари', author: 'Вера Богданова', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b231', title: 'Аллегро Пастель', author: 'Лейф Рандт', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b232', title: 'Равноправные. История искусства, женской дружбы и эмансипации в 1960-х', author: 'Мэгги Доэрти', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b233', title: 'Мисс Исландия', author: 'Аудур Ава Олафсдоттир', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b234', title: 'Девочки и институции', author: 'Дарья Серенко', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b235', title: 'Взрослые люди', author: 'Марие Ауберт', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b236', title: 'Семья. О генеалогии, отцовстве и любви', author: 'Дани Шапиро', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b237', title: 'Страстоцвет, или Петербургские подоконники', author: 'Ольга Кушлина', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b238', title: 'Кролиководство', author: 'Бинни Киршенбаум', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b239', title: 'Смерти.net', author: 'Татьяна Замировская', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b240', title: 'Дом иллюзий', author: 'Кармен Мария Мачадо', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b241', title: 'Подтексты', author: 'Евгения Волункова', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b242', title: 'Нулевые', author: 'Роман Сенчин', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b243', title: 'Секция плавания для пьющих в одиночестве', author: 'Саша Карин', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b244', title: 'Мой белый', author: 'Ксения Буржская', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b245', title: 'Покров-17', author: 'Александр Пелевин', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b246', title: 'Невероятные происшествия в женской камере №3', author: 'Кира Ярмыш', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b247', title: 'Плейлист волонтера', author: 'Мршавко Штапич', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b248', title: 'Ты - будущее', author: 'Галина Рымбу', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b249', title: 'Мы так говорим', author: 'Мария Бобылева', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b250', title: 'Кто-нибудь видел мою девчонку', author: 'Карина Добротворская', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        { id: 'b251', title: 'Адвент', author: 'Ксения Букша', clubId: 'cl21', color: '#cc88ff', year: 2021 },
        {
            id: 'b252', title: 'Мальчик на деревянном ящике', author: 'Леон Лейсон', clubId: 'cl20', color: '#cc2222', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1764695004i/244699043._SX600_.jpg',
            meetingDate: '2026-05-13',
            meetingTime: '19:00',
            location: 'уточняется',
            selectedDate: '2026-04-21'
        },
        {
            id: 'b253', title: 'Рождение звука', author: 'Чак Паланик', clubId: 'cl20', color: '#cc2222', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/67185533.jpg',
            meetingDate: '2026-05-27',
            meetingTime: '19:00',
            location: 'уточняется',
            selectedDate: '2026-05-01'
        },
        {
            id: 'b254', title: 'Возвращение', author: 'Андрей Платонов', clubId: 'cl6', color: '#f3b066', year: 2026,
            meetingDate: '2026-05-14',
            selectedDate: '2026-05-03',
            registerUrl: 'https://clck.su/PuiLo'
        },
        {
            id: 'b255', title: 'Алёша Бесконвойный', author: 'Василий Шукшин', clubId: 'cl6', color: '#f3b066', year: 2026,
            meetingDate: '2026-05-21',
            selectedDate: '2026-05-03',
            registerUrl: 'https://clck.su/PuiLo'
        },
        {
            id: 'b256', title: 'Письмо ангела-хранителя', author: 'Марк Твен', clubId: 'cl6', color: '#f3b066', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1581526684i/51203811._SX600_.jpg',
            meetingDate: '2026-05-28',
            selectedDate: '2026-05-03',
            registerUrl: 'https://clck.su/PuiLo'
        },
        {
            id: 'b257', title: 'Проект «Аве мария»', author: 'Энди Вейер', clubId: 'cl19', color: '#778899', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1635554081i/59483154._SX600_.jpg',
            meetingDate: '2026-05-24',
            selectedDate: '2026-04-28',
            location: 'Кафе «Скворец», Малая Бронная, 4',
            registerUrl: 'https://t.me/book_club_bookstore',
            genreRibbon: 'Фантастика'

        },

        {
            id: 'b263', title: 'Бабушка велела кланяться и передать, что просит прощения', author: 'Фредрик Бакман', clubId: 'cl20', color: '#cc2222', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/5448575/hat3982ecd5cff58799cd3154a35a96422b/orig',
            meetingDate: '2026-06-17',
            meetingTime: '19:00',
            location: 'Екатеринбург',
            review: 'Вчера прошла встреча клуба по книге Ф.Бакмана «Бабушка велела кланяться и передать, что просит прощения» \nПосле Паланика нам необходим был сеанс реабилитации и кажется, книга с этим справилась 🙏 Обсужденте получилось тёплым, уютным, где-то может скучающим😁 \n\nВоспоминания про своих бабушек и дедушек, как они жили, справлялись и рассказы про своих детей и правила их воспитания (вообще полыхательная 🔥 тема)  для меня это как-то наполнило встречу разнопоколенческими историями и проблемами. Очевидная вещь, что в каждом поколении с одной стороны, много общего, с другой есть свои нюансы.  В любом случае одному иногда сложнее преодолеть трудности «взрослого человека», поэтому всегда приглашаю встречаться в клубе, хоть чуточку разделить свои переживания с другими 🙏\n\nВсем спасибо за встречу 🐺♥️'
        },
        {
            id: 'b264', title: 'Унесённые ветром', author: 'Маргарет Митчелл', clubId: 'cl20', color: '#cc2222', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/66706014.jpg',
            meetingDate: '2026-06-29',
            meetingTime: '19:00',
            location: 'Екатеринбург'
        },
        {
            id: 'b505', title: 'Яма', author: 'Александр Куприн',
            clubId: 'cl20', color: '#8b1a1a', year: 2026,
            coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Kuprin_The_Pit.jpg',
            meetingDate: '2026-07-20',
            meetingTime: '19:00',
            isAnniversary: true,
        },
        {
            id: 'b506', title: 'Увидимся в августе', author: 'Габриэль Гарсиа Маркес',
            clubId: 'cl20', color: '#c8860a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-s/wc1000/9214883920.jpg',
            meetingDate: '2026-08-17',
            meetingTime: '19:00',
            location: 'Екатеринбург',
        },
        {
            id: 'b508', title: 'Дневники княжон Романовых', author: 'Хелен Раппапорт',
            clubId: 'cl20', color: '#7a3b2e', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-b/wc1000/6770247779.jpg',
            meetingDate: '2026-08-24',
            meetingTime: '19:00',
            location: 'Екатеринбург',
        },
        // ── Читули (cl22, Москва) ────────────────────────────────
        // Прочитанные книги 2025
        { id: 'b313', title: 'Авиатор', author: 'Евгений Водолазкин', clubId: 'cl22', color: '#334466', year: 2025, coverUrl: 'https://cv0.litres.ru/pub/c/cover/18910175.jpg', rating: 7.9 },
        { id: 'b314', title: 'Русские музы', author: '', clubId: 'cl22', color: '#885544', year: 2025 },
        { id: 'b315', title: 'Люба, исполняющая желания', author: '', clubId: 'cl22', color: '#cc6688', year: 2025 },
        { id: 'b316', title: 'Невьянская башня', author: 'Алексей Иванов', clubId: 'cl22', color: '#886644', year: 2025, coverUrl: 'https://cdn.litres.ru/pub/c/cover/183714.jpg', rating: 8.6 },
        // События 2026
        {
            id: 'b317', title: 'Вера и Доверие: как расслабиться и позволить Жизни заботиться о тебе', author: 'Ирина Захарченко',
            clubId: 'cl22', color: '#aa8855', year: 2026,
            meetingDate: '2026-04-02', meetingTime: '19:30',
            registerUrl: 'https://chityli.ru', isAuthorMeet: true,
        },
        {
            id: 'b318', title: 'Птичий город за облаками', author: 'Энтони Дорр',
            clubId: 'cl22', color: '#5577aa', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover_415/67226106.jpg',
            rating: 7.7,
        },
        {
            id: 'b319', title: 'Обрыв', author: 'Иван Гончаров',
            clubId: 'cl22', color: '#556644', year: 2026,
            coverUrl: 'https://ir.ozone.ru/multimedia/1005808702.jpg',
            rating: 8.0,
        },
        {
            id: 'b320', title: 'Скажи жизни ДА!', author: 'Виктор Франкл',
            clubId: 'cl22', color: '#2266aa', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/get-mpic/16497166/2a0000019a4690e3013cfe177d5286f45c61/orig',
            meetingDate: '2026-05-05', meetingTime: '19:30',
            registerUrl: 'https://chityli.ru',
        },
        {
            id: 'b321', title: 'Два брата', author: 'Бен Элтон',
            clubId: 'cl22', color: '#445566', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/11029706.jpg',
            rating: 7.2,
        },
        {
            id: 'b322', title: 'Чайный дворец', author: 'Элизабет Херман',
            clubId: 'cl22', color: '#997744', year: 2026,
            meetingDate: '2026-05-27', meetingTime: '19:00',
            registerUrl: 'https://chityli.ru',
        },
        {
            id: 'b323', title: 'Bookship. Последний книжный магазин во Вселенной', author: 'Мария Закрученко',
            clubId: 'cl22', color: '#335577', year: 2026,
            coverUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-MM0kAQrmlhWZAtNH3cAbW-It2JTGuYVXcikIhrhv1yX0DaSxViuAMqau&s=10',
            meetingDate: '2026-06-16', meetingTime: '19:30',
            registerUrl: 'https://chityli.ru', isAuthorMeet: true,
        },
        {
            id: 'b325', title: '11/22/63', author: 'Стивен Кинг',
            clubId: 'cl22', color: '#882222', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/4986890.jpg',
            rating: 8.7,
            genreRibbon: 'Фантастика',
        },
        {
            id: 'b824', title: 'По ветру', author: 'Яна Миа',
            clubId: 'cl22', color: '#7b5ea7', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-6/wc1000/8286906282.jpg',
            meetingDate: '2026-08-13', meetingTime: '19:30',
            location: 'м. Маяковская',
            price: '1100₽',
            registerUrl: 'https://chityli.ru',
            isAuthorMeet: true,
        },
        {
            id: 'b500', title: 'Цитадель', author: 'Арчибальд Кронин',
            clubId: 'cl22', color: '#5c3a1a', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/7414340.jpg',
            meetingDate: '2026-08-20', meetingTime: '19:00',
            location: 'м. Сретенский бульвар',
            host: 'Елена',
            registerUrl: 'https://chityli.ru',
        },
        {
            id: 'b600',
            title: 'Вечер разных книг',
            clubId: 'cl22', color: '#3d2a4a', year: 2026,
            coverUrl: '/cover-chityli-sept.jpg',
            meetingDate: '2026-09-09', meetingTime: '19:30-21:30',
            location: 'Центр Москвы',
            price: '500₽',
            registerUrl: 'https://chityli.ru',
            genreRibbon: 'Спецформат',
            eventIcon: '🧘',
        },
        {
            id: 'b825',
            title: 'Жизнь Василия Кандинского',
            clubId: 'cl22', color: '#c45c34', year: 2026,
            coverUrl: 'https://i.pinimg.com/736x/47/90/a5/4790a51de6e2472833298da2ae9187db.jpg',
            meetingDate: '2026-09-25', meetingTime: '19:00',
            location: 'м. Китай-город',
            price: '2000₽',
            seats: 8,
            registerUrl: 'https://chityli.ru',
            genreRibbon: 'Лекция',
        },
        // ── На чердаке (cl19, Москва) ─────────────────────────────
        {
            id: 'b601',
            title: 'Поющие в терновнике', author: 'Колин Маккалоу',
            clubId: 'cl19', color: '#8B1A1A', year: 2026,
            coverUrl: '/cover-thorns.jpg',
            meetingDate: '2026-07-19',
            location: 'Сад Эрмитаж, Москва',
        },
        // ── SOK Екатеринбург (cl7) ────────────────────────────────
        {
            id: 'b602',
            title: 'Омон Ра', author: 'Виктор Пелевин',
            clubId: 'cl7', color: '#cc2200', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-u/wc1000/6597138738.jpg',
            meetingDate: '2026-07-22',
            isAnniversary: true,
        },
        // ── Лама (cl24, Москва) ───────────────────────────────────
        {
            id: 'b700',
            title: 'Камера обскура', author: 'Владимир Набоков',
            clubId: 'cl24', color: '#5a8ab8', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-x/wc1000/8542958757.jpg',
            meetingDate: '2026-07-30',
            registerUrl: 'https://lamabookclub.ru/#popup:start',
        },
        {
            id: 'b839', title: 'Ваш покорный слуга кот', author: 'Нацумэ Сосэки',
            clubId: 'cl24', color: '#3a5a3a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-w/wc1000/7328629100.jpg',
            meetingDate: '2026-08-06',
            registerUrl: 'https://lamabookclub.ru/08-09',
        },
        {
            id: 'b840', title: 'Женщина в песках', author: 'Кобо Абэ',
            clubId: 'cl27', color: '#c9a84c', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-f/wc1000/8112992307.jpg',
            meetingDate: '2026-08-28',
            location: 'Дубай',
        },
        {
            id: 'b841', title: 'Чума', author: 'Камю',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b842', title: 'Идиот', author: 'Достоевский',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b843', title: 'Мартин Иден', author: 'Джек Лондон',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b844', title: 'Географ глобус пропил', author: 'Иванов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b845', title: 'Калигула', author: 'Камю',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b846', title: 'Финансист', author: 'Драйзер',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b847', title: 'Зона', author: 'Довлатов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b848', title: 'Шантарам', author: 'Дэвид Робинсон',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: '/cover-shantaram.jpg',
        },
        {
            id: 'b849', title: 'Лолита', author: 'Набоков',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b850', title: 'Солярис', author: 'Лем',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b851', title: 'Белая гвардия', author: 'Булгаков',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b852', title: 'Братья Карамазовы', author: 'Достоевский',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: '/cover-karamazov.jpg',
        },
        {
            id: 'b853', title: 'Клара и Солнце', author: 'Исигуро',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b854', title: 'Центр тяжести', author: 'Поляринов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b855', title: '«Голос греха»', author: '',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b856', title: 'Демиан', author: 'Гессе',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b857', title: 'Сто лет одиночества', author: 'Маркес',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: '/cover-100-years.jpg',
        },
        {
            id: 'b858', title: 'Кинг – обсуждение творчества', author: 'Стивен',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b859', title: 'Трудно быть богом', author: 'Стругацкие',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b860', title: 'Макбет', author: 'Шекспир',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b861', title: 'Темные аллеи', author: 'Бунин',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b862', title: 'Библия', author: '',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b863', title: 'Казаков рассказы', author: 'Юрий',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b864', title: 'Норвежский лес', author: 'Мураками',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b865', title: 'Поправка-22', author: 'Хеллер',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b866', title: 'Маус: рассказы выжившего', author: 'Шпигельман',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b867', title: 'Мухи', author: 'Сартр',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b868', title: 'Триумфальная арка', author: 'Ремарк',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b869', title: 'Процесс', author: 'Кафка',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b870', title: 'Transhumanism Inc.', author: 'Пелевин',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b871', title: 'Маскарад', author: 'Лермонтов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b872', title: 'Над пропастью во ржи', author: 'Сэлинджер',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b873', title: 'Звук и ярость', author: 'Фолкнер',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b874', title: 'Нечего бояться', author: 'Барнс',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b875', title: 'Бесы', author: 'Достоевский',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b876', title: 'Рассказы', author: 'Чехов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b877', title: 'Последнее желание', author: 'Сапковский',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b878', title: 'Синяя борода', author: 'Воннегут',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b879', title: 'Что делать?', author: 'Чернышевский',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b880', title: 'принц, Вредные советы, Чучело', author: 'Маленький',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b881', title: 'народов мира', author: 'Сказки',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b882', title: 'Краткая история человечества', author: 'Харари',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b883', title: 'Сердце тьмы', author: 'Конрад',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b884', title: 'Автостопом по галактике', author: 'Адамс',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b885', title: 'Второй пол', author: 'Симона де Бовуар',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b886', title: 'Орландо', author: 'Вирджиния Вулф',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b887', title: 'Гордость и предубеждение', author: 'Джейн Остин',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b888', title: 'О вселенной в двух словах', author: 'Хокинг',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b889', title: 'Невыносимая легкость бытия', author: 'Кундер',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/133165.jpg',
        },
        {
            id: 'b890', title: 'Бегство от свободы', author: 'Фромм',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b891', title: 'Будденброки', author: 'Манн',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b892', title: 'Одноэтажная Америка', author: 'Ильф и Петров',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b893', title: 'Семь грехов памяти', author: 'Шектер Дэниел',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b894', title: 'Обрыв', author: 'Гончаров',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://ir.ozone.ru/multimedia/1005808702.jpg',
        },
        {
            id: 'b895', title: 'Доктор Живаго', author: 'Пастернак',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b896', title: 'Заводной апельсин', author: 'Берджесс',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b897', title: 'Плаха', author: 'Айтматов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b898', title: 'Чайка по имени Джонатан Ливингстон', author: 'Бах',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b899', title: 'Андреев Рассказы', author: 'Леонид',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b900', title: 'Ребенок Розмари', author: 'Айра Левин',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b901', title: 'Сон смешного человека', author: 'Достоевский',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b902', title: 'Государь', author: 'Макиавелли',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b903', title: 'Убить пересмешника', author: 'Харпер Ли',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b904', title: 'Человек, который принял жену за шляпу', author: 'Оливер Сакс',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b905', title: 'Москва-Петушки', author: 'Ерофеев',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b906', title: 'Хрупкое равновесие', author: 'Мистри',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b907', title: 'Мастер и Маргарита', author: 'Булгаков',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b908', title: 'Цветы для Элджернона', author: 'Киз',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b909', title: 'И грянул гром', author: 'Брэдбери',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b910', title: 'Школа для дураков', author: 'Соколов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b911', title: 'Анна Каренина', author: 'Толстой',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/172100.jpg',
        },
        {
            id: 'b912', title: 'Понедельник начинается в субботу', author: 'Стругацкие',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-n/wc1000/7303189847.jpg',
        },
        {
            id: 'b913', title: 'Жареные зеленые помидоры в кафе «Полустанок', author: 'Фэнни Флэгг',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b914', title: 'В дороге', author: 'Дж. Керуак',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b915', title: 'Роман с кокаином', author: 'М. Агеев',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b916', title: 'Лягушки', author: 'Мо Янь',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b917', title: 'Атлант расправил плечи', author: 'Айн Рэнд',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b918', title: 'Унесенные ветром', author: 'Маргарет Митчелл',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b919', title: 'Убийство на улице Морг', author: 'Эдгар Аллан По',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b920', title: 'Золотой храм', author: 'Юкио Мисима',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b921', title: 'Тысячеликий герой', author: 'Джозеф Кэмпбелл',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b922', title: 'Праздник, который всегда с тобой', author: 'Эрнест Хемингуэй',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b923', title: 'Мечтают ли андроиды об электроовцах?', author: 'Филипп К. Дик',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b924', title: 'О дивный новый мир', author: 'Олдос Хаксли',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b925', title: 'Милый друг', author: 'Ги де Мопассан',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b926', title: 'Раковый корпус', author: 'А. И. Солженицын',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b927', title: 'Пять четвертинок апельсина', author: 'Джоанн Харрис',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b928', title: 'Из пушки на Луну', author: 'Жюль Верн',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b929', title: 'Сказать жизни «Да!', author: 'Виктор Франкл',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b930', title: 'Дар', author: 'В. В. Набоков',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/151371.jpg',
        },
        {
            id: 'b931', title: 'Сиддхартха', author: 'Герман Гессе',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b932', title: 'Женщина в песках', author: 'Кобо Абэ',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-f/wc1000/8112992307.jpg',
        },
        {
            id: 'b933', title: 'Иуда Искариот', author: 'Л. Андреев',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b934', title: 'Имя розы', author: 'Умберто Эко',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/11298693/hat5cb5543457833329f6872ce012748dfa/orig',
        },
        {
            id: 'b935', title: 'Снежный цветок и заветный веер', author: 'Лиза Си',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b936', title: 'Дракула', author: 'Брэм Стокер',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b937', title: 'Опасные связи', author: 'Шодерло де Лакло',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b938', title: 'Мелкий бес', author: 'Федор Сологуб',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b939', title: 'Петровы в гриппе и вокруг него', author: 'Алексей Сальников',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b940', title: 'Все решено: жизнь без свободы воли', author: 'Роберт Сапольски',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: '/cover-sapolsky.jpg',
        },
        {
            id: 'b941', title: 'Тень', author: 'Евгений Шварц',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b942', title: 'Задача трех тел', author: 'Лю Цысинь',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b943', title: 'Три сестры', author: 'Антон Чехов',
            clubId: 'cl17', color: '#aa33ff',
        },
        {
            id: 'b944', title: 'Чапаев и пустота', author: 'Виктор Пелевин',
            clubId: 'cl17', color: '#aa33ff',
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-0/wc500/8450969580.jpg',
            meetingDate: '2026-08-30 15:00', meetingTime: '15:00',
            location: 'Сад расходящихся Петек',
            registerUrl: 'https://t.me/bookclub_msu',
        },
        {
            id: 'b836', title: 'Пикник на обочине', author: 'Братья Стругацкие',
            clubId: 'cl24', color: '#2a3a2a', year: 2026,
            meetingDate: '2026-08-25', meetingTime: '20:00',
            registerUrl: 'https://lamabookclub.ru/08-09',
         coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-c/wc2500/8209483032.jpg',},
        {
            id: 'b837', title: '451 градус по Фаренгейту', author: 'Рэй Брэдбери',
            clubId: 'cl24', color: '#8a3a1a', year: 2026,
            meetingDate: '2026-09-08', meetingTime: '20:00',
            registerUrl: 'https://lamabookclub.ru/08-09',
         coverUrl: 'https://ir.ozone.ru/s3/multimedia-z/wc1000/6078471107.jpg',},
        {
            id: 'b838', title: 'Человек, который смеётся', author: 'Виктор Гюго',
            clubId: 'cl24', color: '#1a1a2a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-6/wc1000/9095651790.jpg',
            meetingDate: '2026-09-24',
            registerUrl: 'https://lamabookclub.ru/08-09',
        },
        // ── Bukva Book Club (cl25, Белград) ──────────────────────────
        // Прочитанные книги 2026
        { id: 'b800', title: 'Любите ли Вы Брамса?', author: 'Франсуаза Саган',
            clubId: 'cl25', color: '#7a4e8c', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/121819.jpg' },
        // b801 удалён — «Сезон отравленных плодов» Богдановой относится к cl18 (SOK СПб, b507)
        { id: 'b802', title: 'Кремулятор', author: 'Саша Филипенко',
            clubId: 'cl25', color: '#2a2a2a', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/67806672.jpg' },
        // События
        {
            id: 'b803', title: 'Двадцать четыре часа из жизни женщины', author: 'Стефан Цвейг',
            clubId: 'cl25', color: '#4a3060', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/69472504.jpg',
            meetingDate: '2026-08-01',
            meetingTime: '15:00',
            registerUrl: 'https://t.me/bukva_registration_bot',
        },
        {
            id: 'b832', title: 'Жареные зелёные помидоры в кафе «Полустанок»', author: 'Флэгг Фэнни',
            clubId: 'cl25', color: '#3d6b2e', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-l/wc1000/9446859921.jpg',
            meetingDate: '2026-09-05',
            meetingTime: '15:00',
            registerUrl: 'https://t.me/bukva_registration_bot',
        },
        {
            id: 'b833', title: 'Ночь в Лиссабоне', author: 'Эрих Мария Ремарк',
            clubId: 'cl25', color: '#1a2a4a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-z/wc1000/7155788147.jpg',
            meetingDate: '2026-09-12',
            meetingTime: '15:00',
            registerUrl: 'https://t.me/bukva_registration_bot',
        },
        {
            id: 'b834', title: 'Мастер страшного суда', author: 'Лео Перуц',
            clubId: 'cl25', color: '#2a1a3a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-4/wc1000/6326999776.jpg',
            meetingDate: '2026-09-19',
            meetingTime: '15:00',
            registerUrl: 'https://t.me/bukva_registration_bot',
        },
        {
            id: 'b835', title: 'Сеансы одновременного чтения', author: 'Горан Петрович',
            clubId: 'cl25', color: '#3a2a1a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-1/wc1000/7440918985.jpg',
            meetingDate: '2026-09-26',
            meetingTime: '12:00',
            registerUrl: 'https://t.me/bukva_registration_bot',  },
        {
            id: 'b804', title: 'Книжный своп',
            clubId: 'cl25', color: '#7ec8a0', year: 2026,
            coverUrl: '/bukva.jpg',
            meetingDate: '2026-08-15',
            meetingTime: '15:00',
            genreRibbon: 'Спецформат',
            isAnniversary: true,
            registerUrl: 'https://t.me/bukva_registration_bot',
        },
        // ── Bookz Club (cl26, Москва) ────────────────────────────────
        // Прочитанные книги 2026
        {
            id: 'b814', title: 'Музей невинности', author: 'Орхан Памук',
            clubId: 'cl26', color: '#8b2a2a', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-6/wc1000/8355778242.jpg',
            selectedDate: '2026-07',
        },
        {
            id: 'b809', title: 'Невыносимая легкость бытия', author: 'Милан Кундера',
            clubId: 'cl26', color: '#7a5c8a', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/133165.jpg',
            meetingDate: '2026-08-15',
            registerUrl: 'http://bookzclub.ru/',
        },
        {
            id: 'b810', title: 'Федр', author: 'Платон',
            clubId: 'cl26', color: '#b5a642', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/37110815.jpg',
            meetingDate: '2026-08-29',
            registerUrl: 'http://bookzclub.ru/',
        },
        {
            id: 'b811', title: 'Детство. Отрочество. Юность', author: 'Лев Толстой',
            clubId: 'cl26', color: '#4a6741', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-t/wc1000/7000413164.jpg',
            meetingDate: '2026-10-03',
            location: 'Тула',
            genreRibbon: 'Спецформат',
            registerUrl: 'http://bookzclub.ru/',
        },
        {
            id: 'b812', title: 'Ставок больше нет', author: 'Жан-Поль Сартр',
            clubId: 'cl26', color: '#2a2a3a', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/155290.jpg',
            meetingDate: '2026-10-31',
            registerUrl: 'http://bookzclub.ru/',
        },
        {
            id: 'b813', title: 'Бильярд в половине десятого', author: 'Генрих Бёлль',
            clubId: 'cl26', color: '#1a3a5c', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/68707956.jpg',
            meetingDate: '2026-11-28',
            registerUrl: 'http://bookzclub.ru/',
        },
            {
            id: 'b945', title: 'Лавр', author: 'Евгений Водолазкин',
            clubId: 'cl9', color: '#55aaff',
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-1-7/wc500/8243423359.jpg',
            meetingDate: '2026-09-08 19:00', meetingTime: '19:00',
            registerUrl: 'https://vsmysle.spb.ru/services/knizhnyy-klub-vsmysle-lavr-evgeniy-vodolazkin/',
            price: '1500 ₽',
        },

        {
            id: 'b901', title: 'Йеллоуфейс', author: 'Ребекка Куанг',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b902', title: 'Всё рушится', author: 'Чинуа Ачебе',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b903', title: 'Дом духов', author: 'Исабель Альенде',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b904', title: 'Зима в Лиссабоне', author: 'Антонио Муньос Молина',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: 'https://avatars.mds.yandex.net/get-goods_pic/15427954/hat545fee11d5723eda2c75d9b0176302f7/orig',
        },
        {
            id: 'b905', title: 'Доктор Живаго', author: 'Борис Пастернак',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b906', title: 'Тайная история', author: 'Донна Тартт',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b907', title: 'Павел Чжан и прочие лесные твари', author: 'Вера Богданова',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b908', title: 'Жена башмачника', author: 'Адриана Трижиани',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b909', title: 'Клуб любителей книг и пирогов из картофельных очистков', author: 'Шаффер и Бэрроуз',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b910', title: 'Полночная библиотека', author: 'Мэтт Хейг',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b911', title: 'С неба упали три яблока', author: 'Наринэ Абгарян',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b912', title: 'Кадавры', author: 'Алексей Поляринов',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1731612460i/221524743._SX600_.jpg',
        },
        {
            id: 'b913', title: 'Клара и Солнце', author: 'Кадзуо Исигуро',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b914', title: 'Фигуры света', author: 'Сара Мосс',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: '/cover-moss.jpg',
        },
        {
            id: 'b915', title: 'К востоку от Эдема', author: 'Джон Стейнбек',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: 'https://ir.ozone.ru/s3/multimedia-8/6666103664.jpg',
        },
        {
            id: 'b916', title: 'Искупление', author: 'Элис Макдермотт',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b917', title: 'Пой, даже если не знаешь слов', author: 'Бьянка Мараис',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b918', title: 'Финансист', author: 'Теодор Драйзер',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b919', title: 'Оливер Твист', author: 'Чарльз Диккенс',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b920', title: 'Поменяй воду цветам', author: 'Валери Перрен',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b921', title: 'Зимний солдат', author: 'Дэниэл Мейсон',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b922', title: 'Медвежий угол', author: 'Фредрик Бакман',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b923', title: 'Город женщин', author: 'Элизабет Гилберт',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b924', title: 'Американская грязь', author: 'Джанин Камминс',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b925', title: 'Перл', author: 'Шан Хьюз',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b926', title: 'Уроки химии', author: 'Бонни Гармус',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b927', title: 'Завет воды', author: 'Абрахам Вергезе',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: 'https://cdn.litres.ru/pub/c/cover/70795744.jpg',
        },
        {
            id: 'b928', title: 'Клуб неисправимых оптимистов', author: 'Жан-Мишель Генассия',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: '/cover-optimists.jpg',
        },
        {
            id: 'b929', title: 'Piccola Сицилия', author: 'Даниэль Шпек',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b930', title: 'Сочувствующий', author: 'Вьет Тхань Нгуен',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b931', title: 'Мир глазами Гарпа', author: 'Джон Ирвинг',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b932', title: 'Хранительница историй', author: 'Салли Пейдж',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b933', title: 'Женщина в белом', author: 'Уилки Коллинз',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1678279232i/84445105._SX600_.jpg',
        },
        {
            id: 'b934', title: 'Оккульттрегер', author: 'Алексей Сальников',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b935', title: 'Возлюбленная', author: 'Тони Морисон',
            clubId: 'cl27', color: '#d4a853', year: 2026,
        },
        {
            id: 'b936', title: 'Щегол', author: 'Донна Тартт',
            clubId: 'cl27', color: '#d4a853', year: 2026,
            coverUrl: '/cover-goldfinch.jpg',
        },
    ],

};

let _db = null;

function applyMigrations(db) {
    const goldfinch = db?.books?.find((book) => book.id === 'b72');
    if (goldfinch && goldfinch.coverUrl !== '/cover-goldfinch.jpg') {
        goldfinch.coverUrl = '/cover-goldfinch.jpg';
    }
    // Fix b501 (Нетворкинг для разведчиков) — restore correct cover after ID collision
    const b501 = db?.books?.find((book) => book.id === 'b501');
    if (b501) {
        b501.coverUrl = 'https://cdn.litres.ru/pub/c/cover/66635352.jpg';
        delete b501.genreRibbon;
        delete b501.price;
    }
    // Fix b502 (Завет воды) — restore correct cover after ID collision
    const b502 = db?.books?.find((book) => book.id === 'b502');
    if (b502) {
        b502.coverUrl = 'https://cdn.litres.ru/pub/c/cover/70795744.jpg';
        delete b502.genreRibbon;
        delete b502.price;
    }
    // Force auto-cover and remove registerUrl for b97
    const b97 = db?.books?.find((book) => book.id === 'b97');
    if (b97) {
        b97.coverUrl = 'data:image/svg+xml;utf8,<svg width="400" height="600" xmlns="http://www.w3.org/2000/svg" style="background:%23aaaaff"><text x="30" y="80" font-family="Inter,sans-serif" font-weight="900" font-size="46" fill="%23fff">Двести</text><text x="30" y="135" font-family="Inter,sans-serif" font-weight="900" font-size="46" fill="%23fff">франков</text><text x="30" y="190" font-family="Inter,sans-serif" font-weight="900" font-size="46" fill="%23fff">с процентами</text><text x="30" y="250" font-family="Inter,sans-serif" font-size="28" fill="%23ffffffaa">С. Довлатов</text></svg>';
        delete b97.registerUrl;
    }
    // Sync coverUrl for b98 (Вера Богданова)
    const b98 = db?.books?.find((book) => book.id === 'b98');
    if (b98 && !b98.coverUrl) {
        b98.coverUrl = 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1774780508i/250379090._SX600_.jpg';
    }
    // Clear incorrect cover for b254 (Возвращение, Платонов)
    const b254 = db?.books?.find((book) => book.id === 'b254');
    if (b254) delete b254.coverUrl;
    // Force correct covers — эти книги могли оказаться в кэше без coverUrl
    // (добавлены в SEED до того как обложка была назначена)
    const b120 = db?.books?.find((book) => book.id === 'b120');
    if (b120) b120.coverUrl = '/cover-shantaram.jpg';
    const b807 = db?.books?.find((book) => book.id === 'b807');
    if (b807) b807.coverUrl = 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1678279232i/84445105._SX600_.jpg';
    const b813 = db?.books?.find((book) => book.id === 'b813');
    if (b813) b813.coverUrl = 'https://cdn.litres.ru/pub/c/cover/4956.jpg';
    const b830 = db?.books?.find((book) => book.id === 'b830');
    if (b830) b830.coverUrl = 'https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1744194599i/231210719._SX600_.jpg';
    // Upgrade cl13 from ticker-only to a real planet
    const cl13cached = db.clubs.find(c => c.id === 'cl13');
    if (cl13cached) {
        cl13cached.name = 'Институт карьерного роста';
        cl13cached.members = 150;
        delete cl13cached.tickerOnly;
    }
    // Ensure new city c8 exists
    if (!db.venues) db.venues = [];
    if (!db.cities.find(c => c.id === 'c8')) {
        db.cities.push({ id: 'c8', name: 'Онлайн', population: 500000, color: '#cc88ff', hideSun: true });
    }
    // Ensure new club cl21 exists, sync members count and archetype
    const cl21cached = db.clubs.find(c => c.id === 'cl21');
    if (!cl21cached) {
        const seedCl21 = SEED.clubs.find(c => c.id === 'cl21');
        if (seedCl21) {
            db.clubs.push(JSON.parse(JSON.stringify(seedCl21)));
        }
    } else {
        cl21cached.members = 3250;
        cl21cached.hasLogo = true;
        const seedCl21 = SEED.clubs.find(c => c.id === 'cl21');
        if (seedCl21) {
            cl21cached.archetype = seedCl21.archetype;
        }
    }
    // Ensure cl22 (Читули) archetype is updated from SEED
    const cl22cached = db.clubs.find(c => c.id === 'cl22');
    if (cl22cached) {
        const seedCl22 = SEED.clubs.find(c => c.id === 'cl22');
        if (seedCl22) {
            cl22cached.archetype = seedCl22.archetype;
        }
    }
    // Ensure cl1 (SOK Москва) archetype is updated from SEED
    const cl1cached = db.clubs.find(c => c.id === 'cl1');
    if (cl1cached) {
        const seedCl1 = SEED.clubs.find(c => c.id === 'cl1');
        if (seedCl1) {
            cl1cached.archetype = seedCl1.archetype;
        }
    }
    // Ensure new club cl23 (Book Events) exists, sync members count and info
    const cl23cached = db.clubs.find(c => c.id === 'cl23');
    if (!cl23cached) {
        const seedCl23 = SEED.clubs.find(c => c.id === 'cl23');
        if (seedCl23) {
            db.clubs.push(JSON.parse(JSON.stringify(seedCl23)));
        }
    } else {
        cl23cached.members = 120;
        cl23cached.hasLogo = true;
        cl23cached.founded = '21 января 2018 года';
        cl23cached.color = '#f5a2b3';
        cl23cached.name = 'Книжный клуб Book Events';
        cl23cached.directionNote = 'Клуб предлагает к обсуждению книги разных направлений — классического и современного — чтобы не было перекоса в одно из них.';
        const seedCl23 = SEED.clubs.find(c => c.id === 'cl23');
        if (seedCl23) {
            cl23cached.archetype = seedCl23.archetype;
        }
    }
    // Filter cl23 books in local cache to only keep the first 50
    if (db.books) {
        const allowedCl23Ids = new Set();
        for (let i = 400; i <= 492; i++) {
            allowedCl23Ids.add('b' + i);
        }
        // Also allow new 2026 Book Events
        ['b826','b827','b828','b829'].forEach(id => allowedCl23Ids.add(id));
        db.books = db.books.filter(book => {
            if (book.clubId === 'cl23') {
                return allowedCl23Ids.has(book.id);
            }
            return true;
        });
    }
    // Sync any new books from SEED that are missing from cached DB
    SEED.books.forEach(seedBook => {
        if (!db.books.find(b => b.id === seedBook.id)) {
            db.books.push({ ...seedBook });
        } else {
            // Also update fields that may have changed
            const existing = db.books.find(b => b.id === seedBook.id);
            if (seedBook.coverUrl) existing.coverUrl = seedBook.coverUrl;
            if (seedBook.isNobel !== undefined) existing.isNobel = seedBook.isNobel;
            if (seedBook.isBestOfClub !== undefined) existing.isBestOfClub = seedBook.isBestOfClub;
            if (seedBook.bestYear !== undefined) existing.bestYear = seedBook.bestYear;
            if (seedBook.isClubTop !== undefined) existing.isClubTop = seedBook.isClubTop;
            if (seedBook.meetingDate) existing.meetingDate = seedBook.meetingDate;
            if (seedBook.meetingTime) existing.meetingTime = seedBook.meetingTime;
            if (seedBook.registerUrl) existing.registerUrl = seedBook.registerUrl;
            if (seedBook.location) existing.location = seedBook.location;
            if (seedBook.host) existing.host = seedBook.host;
            if (seedBook.selectedDate) existing.selectedDate = seedBook.selectedDate;
            if (seedBook.genreRibbon) existing.genreRibbon = seedBook.genreRibbon;
            if (seedBook.eventIcon) existing.eventIcon = seedBook.eventIcon;
            if (seedBook.price) existing.price = seedBook.price;
            if (seedBook.review) existing.review = seedBook.review;
        }
    });
    return db;
}

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return applyMigrations(JSON.parse(raw));
    } catch (_) { }
    return applyMigrations(JSON.parse(JSON.stringify(SEED)));
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
}

function uid() {
    return Math.random().toString(36).slice(2, 9);
}

export function getDB() {
    if (!_db) _db = load();
    return _db;
}

export function addCity({ name, population, color }) {
    const db = getDB();
    const city = { id: uid(), name, population: Number(population), color };
    db.cities.push(city);
    save();
    return city;
}

export function addClub({ name, cityId, members, color }) {
    const db = getDB();
    const club = { id: uid(), name, cityId, members: Number(members), color };
    db.clubs.push(club);
    save();
    return club;
}

export function addBook({ title, author, clubId, color, coverUrl }) {
    const db = getDB();
    const book = { id: uid(), title, author: author || '', clubId, color, coverUrl: coverUrl || '' };
    db.books.push(book);
    save();
    return book;
}
