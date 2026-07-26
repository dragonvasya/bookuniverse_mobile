/**
 * quiz.js — Мобильный Quiz «Подобрать клуб».
 * Весь алгоритм (BOOK_TAGS, TAG_TO_THEME, THEME_TO_INTEREST, computeProfile,
 * CLUB_THEME_VECTORS, cosineSim) скопирован 1-в-1 из desktop/src/quiz.js.
 * Переписан только UI: вместо modal — inline в #quiz-container.
 */

import { getDB } from '@db';

// ── Reaction coefficients (из quiz.js) ──────────────────────────────
const REACTION_WEIGHTS = {
    favorite: 3,
    liked:    2,
    ok:       1,
    disliked: -2,
    dropped:  -3,
};

// ── Book → Tags (полностью из quiz.js) ──────────────────────────────
const BOOK_TAGS = {
    '1984':                     { 'государство':5, 'контроль':5, 'социальное устройство':5, 'сопротивление':4, 'трансформация общества':4, 'манипуляция':5, 'индивидуализм':3 },
    'Мастер и Маргарита':       { 'добро и зло':5, 'Бог':4, 'сопротивление':4, 'творчество':4, 'власть':3, 'ответственность':4, 'романтические отношения':3 },
    'Три товарища':             { 'товарищество':5, 'верность':5, 'романтические отношения':5, 'утрата':4, 'война':3, 'жертвенность':4, 'доверие':4 },
    'Братья Карамазовы':        { 'Бог':5, 'сомнение':5, 'ответственность':5, 'добро и зло':5, 'род':4, 'совесть':5, 'духовность':5, 'самоанализ':4 },
    'Мартин Иден':              { 'амбиции':5, 'признание':5, 'успех':4, 'карьера':4, 'одиночество':4, 'независимость':4, 'поиск себя':3 },
    'Маленький принц':          { 'поиск себя':4, 'одиночество':4, 'принятие':4, 'близость':3, 'утрата':3, 'предназначение':3 },
    'Задача трёх тел':          { 'научный метод':5, 'технология':5, 'космос':5, 'открытие':4, 'космические цивилизации':5, 'долгосрочное будущее':4, 'риск':3 },
    'Анна Каренина':            { 'романтические отношения':5, 'род':4, 'ответственность':4, 'социальное устройство':3, 'страсть':4, 'верность':3 },
    'Атлант расправил плечи':   { 'индивидуализм':5, 'независимость':5, 'амбиции':5, 'успех':5, 'лидерство':4, 'сопротивление':4, 'карьера':4 },
    'Преступление и наказание': { 'добро и зло':5, 'совесть':5, 'ответственность':5, 'бессознательное':4, 'самоанализ':4, 'эмоции':3, 'справедливость':4 },
    'Дюна':                     { 'власть':5, 'стратегия':5, 'влияние':5, 'империи':5, 'развитие обществ':4, 'долгосрочное будущее':4, 'принятие решений':4 },
    'Тихий Дон':                { 'война':5, 'эпоха':5, 'поколения':4, 'род':4, 'романтические отношения':3, 'традиции':4, 'революция':4 },
    'Идиот':                    { 'добро и зло':5, 'совесть':5, 'духовность':4, 'романтические отношения':3, 'эмоции':4, 'принятие':4, 'личность':4 },
    'Солярис':                  { 'космос':5, 'научный метод':3, 'самоанализ':5, 'бессознательное':5, 'личность':4, 'сомнение':4, 'открытие':3 },
    'Алхимик':                  { 'поиск себя':5, 'предназначение':5, 'духовный путь':4, 'одиночество':3, 'принятие':3, 'экзистенциальный поиск':4 },
    'Степной волк':             { 'индивидуализм':5, 'одиночество':5, 'самоанализ':4, 'кризис':4, 'поиск себя':4, 'личность':4, 'бессознательное':3 },
    'Демиан':                   { 'взросление':5, 'поиск себя':5, 'духовный путь':4, 'самоанализ':4, 'личность':4, 'сомнение':3, 'бессознательное':3 },
    'Перевал в середине пути':  { 'поиск себя':5, 'кризис':5, 'самоанализ':5, 'духовный путь':4, 'предназначение':4, 'самостоятельность':4, 'личность':4 },
    'Гордость и предубеждение': { 'романтические отношения':5, 'принятие':4, 'личность':4, 'социальное устройство':3, 'доверие':3, 'верность':3 },
    'Норвежский лес':           { 'романтические отношения':5, 'утрата':5, 'одиночество':4, 'эмоции':4, 'взросление':4, 'бессознательное':3 },
    'До встречи с тобой':       { 'близость':5, 'романтические отношения':5, 'утрата':5, 'принятие':4, 'эмоции':4 },
    'Искусство любить':         { 'близость':5, 'романтические отношения':5, 'принятие':5, 'доверие':4, 'духовность':3, 'самоанализ':4, 'эмоции':4 },
    'Источник':                 { 'творчество':5, 'самовыражение':5, 'независимость':5, 'призвание':5, 'мастерство':4, 'индивидуализм':5, 'признание':3 },
    'Финансист':                { 'успех':5, 'карьера':5, 'амбиции':4, 'влияние':4, 'стратегия':3, 'власть':3 },
    'Атомные привычки':         { 'продуктивность':5, 'эффективность':5, 'результат':5, 'труд':4, 'мотивация':4, 'самостоятельность':3, 'успех':3 },
    'Антихрупкость':            { 'риск':5, 'рациональность':5, 'принятие решений':4, 'стратегия':4, 'эффективность':4, 'технология':2, 'прогноз':3 },
    'Стоунер':                  { 'призвание':5, 'труд':5, 'одиночество':4, 'личность':4, 'самоанализ':4, 'совесть':3, 'опыт':4 },
    'Мы':                       { 'государство':5, 'контроль':5, 'технологический прогресс':3, 'социальное устройство':5, 'сопротивление':4, 'индивидуализм':4, 'трансформация общества':4 },
    'Скотный двор':             { 'государство':5, 'власть':5, 'манипуляция':5, 'революция':4, 'контроль':4, 'социальное устройство':4, 'коллектив':3 },
    'Архипелаг ГУЛАГ':          { 'государство':5, 'насилие':4, 'сопротивление':5, 'эпоха':5, 'ответственность':4, 'совесть':4, 'травма':4 },
    'Государь':                 { 'власть':5, 'стратегия':5, 'принятие решений':5, 'влияние':4, 'политика':4, 'лидерство':3 },
    'Повелитель мух':           { 'социальное устройство':5, 'добро и зло':5, 'насилие':4, 'контроль':3, 'бессознательное':3, 'коллектив':4 },
    'Тёмный лес':               { 'космические цивилизации':5, 'стратегия':5, 'риск':5, 'долгосрочное будущее':5, 'космос':5, 'принятие решений':4, 'развитие обществ':3 },
    'Гиперион':                 { 'космические цивилизации':5, 'религия':4, 'духовность':3, 'империи':4, 'история человечества':4, 'долгосрочное будущее':4 },
    'Основание':                { 'космические цивилизации':5, 'история человечества':5, 'стратегия':4, 'долгосрочное будущее':5, 'технология':3, 'развитие обществ':4 },
    'Конец вечности':           { 'технология':4, 'принятие решений':5, 'эпоха':4, 'долгосрочное будущее':4, 'риск':4, 'научный метод':3 },
    'Контакт':                  { 'научный метод':5, 'открытие':5, 'космос':5, 'технология':4, 'космические цивилизации':4, 'рациональность':4 },
    'Война и мир':              { 'война':5, 'эпоха':5, 'род':4, 'поколения':4, 'ответственность':3, 'романтические отношения':3 },
    'Доктор Живаго':            { 'эпоха':5, 'революция':4, 'романтические отношения':4, 'личность':4, 'одиночество':3, 'поколения':3 },
    'Женщины Лазаря':           { 'поколения':5, 'эпоха':4, 'романтические отношения':3, 'родители':4, 'утрата':3, 'ответственность':3 },
    'Люди, которые всегда со мной': { 'поколения':4, 'эпоха':3, 'родители':4, 'дети':4, 'память':3, 'близость':3 },
    'Глиняный мост':            { 'поколения':4, 'родители':4, 'эпоха':3, 'доверие':3, 'ответственность':3 },
};

const TAG_TO_THEME = {
    'государство':              [{ t: 'Власть',          w: 0.9 }, { t: 'Общество',       w: 0.4 }],
    'контроль':                 [{ t: 'Власть',          w: 1.0 }],
    'манипуляция':              [{ t: 'Власть',          w: 0.8 }],
    'политика':                 [{ t: 'Власть',          w: 0.8 }],
    'насилие':                  [{ t: 'Власть',          w: 0.6 }],
    'революция':                [{ t: 'Власть',          w: 0.5 }, { t: 'История',         w: 0.8 }],
    'коллектив':                [{ t: 'Общество',        w: 0.7 }],
    'социальное устройство':    [{ t: 'Общество',        w: 1.0 }],
    'трансформация общества':   [{ t: 'Будущее',         w: 0.8 }, { t: 'Общество',       w: 0.5 }],
    'технологический прогресс': [{ t: 'Будущее',         w: 0.8 }, { t: 'Наука',          w: 0.5 }],
    'индивидуализм':            [{ t: 'Свобода',         w: 0.9 }, { t: 'Самореализация', w: 0.5 }],
    'независимость':            [{ t: 'Свобода',         w: 1.0 }],
    'самовыражение':            [{ t: 'Свобода',         w: 0.7 }, { t: 'Творчество',     w: 0.6 }],
    'сопротивление':            [{ t: 'Свобода',         w: 0.8 }],
    'романтические отношения':  [{ t: 'Любовь',          w: 1.0 }, { t: 'Отношения',      w: 0.7 }],
    'страсть':                  [{ t: 'Любовь',          w: 0.8 }],
    'близость':                 [{ t: 'Любовь',          w: 0.5 }, { t: 'Отношения',      w: 0.9 }],
    'доверие':                  [{ t: 'Отношения',       w: 0.9 }],
    'товарищество':             [{ t: 'Дружба',          w: 1.0 }],
    'верность':                 [{ t: 'Дружба',          w: 0.8 }, { t: 'Отношения',      w: 0.4 }],
    'жертвенность':             [{ t: 'Мораль',          w: 0.7 }, { t: 'Дружба',         w: 0.5 }],
    'утрата':                   [{ t: 'Смысл жизни',    w: 0.6 }, { t: 'Психология',      w: 0.4 }],
    'принятие':                 [{ t: 'Смысл жизни',    w: 0.7 }, { t: 'Психология',      w: 0.5 }],
    'поколения':                [{ t: 'Семья',           w: 0.9 }, { t: 'История',         w: 0.5 }],
    'род':                      [{ t: 'Семья',           w: 1.0 }, { t: 'История',         w: 0.4 }],
    'родители':                 [{ t: 'Семья',           w: 0.9 }],
    'дети':                     [{ t: 'Семья',           w: 0.9 }],
    'память':                   [{ t: 'Семья',           w: 0.5 }, { t: 'История',         w: 0.5 }],
    'традиции':                 [{ t: 'Семья',           w: 0.6 }, { t: 'История',         w: 0.6 }],
    'добро и зло':              [{ t: 'Мораль',          w: 1.0 }],
    'совесть':                  [{ t: 'Мораль',          w: 1.0 }],
    'ответственность':          [{ t: 'Мораль',          w: 0.9 }],
    'справедливость':           [{ t: 'Мораль',          w: 0.8 }],
    'Бог':                      [{ t: 'Вера',            w: 1.0 }],
    'сомнение':                 [{ t: 'Вера',            w: 0.6 }, { t: 'Смысл жизни',    w: 0.5 }],
    'духовность':               [{ t: 'Вера',            w: 0.8 }, { t: 'Смысл жизни',    w: 0.4 }],
    'религия':                  [{ t: 'Вера',            w: 0.9 }],
    'духовный путь':            [{ t: 'Вера',            w: 0.5 }, { t: 'Смысл жизни',    w: 0.7 }],
    'творчество':               [{ t: 'Творчество',      w: 1.0 }],
    'призвание':                [{ t: 'Творчество',      w: 0.7 }, { t: 'Самореализация', w: 0.5 }],
    'мастерство':               [{ t: 'Творчество',      w: 0.6 }, { t: 'Самореализация', w: 0.5 }],
    'амбиции':                  [{ t: 'Самореализация',  w: 0.9 }],
    'успех':                    [{ t: 'Самореализация',  w: 0.8 }, { t: 'Достижения',     w: 0.6 }],
    'карьера':                  [{ t: 'Самореализация',  w: 0.7 }, { t: 'Достижения',     w: 0.5 }],
    'признание':                [{ t: 'Самореализация',  w: 0.7 }],
    'лидерство':                [{ t: 'Лидерство',       w: 0.9 }, { t: 'Самореализация', w: 0.4 }],
    'труд':                     [{ t: 'Достижения',      w: 0.8 }],
    'результат':                [{ t: 'Достижения',      w: 0.8 }],
    'эффективность':            [{ t: 'Достижения',      w: 0.7 }],
    'мотивация':                [{ t: 'Психология',      w: 0.8 }],
    'продуктивность':           [{ t: 'Достижения',      w: 0.7 }],
    'личность':                 [{ t: 'Психология',      w: 1.0 }],
    'эмоции':                   [{ t: 'Психология',      w: 0.8 }],
    'бессознательное':          [{ t: 'Психология',      w: 0.8 }],
    'самоанализ':               [{ t: 'Психология',      w: 0.8 }],
    'травма':                   [{ t: 'Психология',      w: 0.8 }],
    'поиск себя':               [{ t: 'Взросление',      w: 0.9 }, { t: 'Смысл жизни',    w: 0.5 }],
    'самостоятельность':        [{ t: 'Взросление',      w: 0.8 }],
    'опыт':                     [{ t: 'Взросление',      w: 0.8 }],
    'кризис':                   [{ t: 'Взросление',      w: 0.6 }, { t: 'Смысл жизни',    w: 0.7 }],
    'взросление':               [{ t: 'Взросление',      w: 1.0 }],
    'одиночество':              [{ t: 'Смысл жизни',    w: 0.7 }, { t: 'Психология',      w: 0.4 }],
    'предназначение':           [{ t: 'Смысл жизни',    w: 0.9 }],
    'экзистенциальный поиск':   [{ t: 'Смысл жизни',    w: 1.0 }],
    'влияние':                  [{ t: 'Лидерство',       w: 1.0 }],
    'стратегия':                [{ t: 'Лидерство',       w: 0.8 }],
    'принятие решений':         [{ t: 'Лидерство',       w: 0.8 }],
    'власть':                   [{ t: 'Лидерство',       w: 0.7 }, { t: 'Власть',          w: 0.8 }],
    'научный метод':            [{ t: 'Наука',           w: 1.0 }],
    'открытие':                 [{ t: 'Наука',           w: 0.9 }],
    'технология':               [{ t: 'Наука',           w: 0.8 }, { t: 'Будущее',         w: 0.4 }],
    'рациональность':           [{ t: 'Наука',           w: 0.7 }],
    'прогноз':                  [{ t: 'Будущее',         w: 1.0 }],
    'риск':                     [{ t: 'Будущее',         w: 0.6 }],
    'космос':                   [{ t: 'Наука',           w: 0.5 }, { t: 'Будущее',         w: 0.6 }],
    'развитие обществ':         [{ t: 'Цивилизации',    w: 1.0 }],
    'космические цивилизации':  [{ t: 'Цивилизации',    w: 0.8 }],
    'история человечества':     [{ t: 'Цивилизации',    w: 0.8 }, { t: 'История',         w: 0.7 }],
    'долгосрочное будущее':     [{ t: 'Цивилизации',    w: 0.7 }, { t: 'Будущее',         w: 0.5 }],
    'империи':                  [{ t: 'Цивилизации',    w: 0.7 }],
    'эпоха':                    [{ t: 'История',         w: 0.9 }],
    'война':                    [{ t: 'История',         w: 0.8 }],
};

const THEME_TO_INTEREST = {
    'Смысл жизни':    { Человек:0.3, Свобода:0.2, Духовность:1.0 },
    'Самореализация': { Человек:0.2, Самореализация:1.0, Влияние:0.3, Свобода:0.5, Творчество:0.4 },
    'Любовь':         { Человек:0.5, Отношения:1.0, Семья:0.2 },
    'Отношения':      { Человек:0.7, Отношения:1.0, Семья:0.2 },
    'Дружба':         { Человек:0.5, Отношения:0.9, Семья:0.2 },
    'Семья':          { Человек:0.2, Отношения:0.3, Семья:1.0, Общество:0.2 },
    'Власть':         { Самореализация:0.2, Влияние:1.0, Свобода:-0.3, Общество:0.7 },
    'Свобода':        { Человек:0.2, Самореализация:0.4, Свобода:1.0, Творчество:0.3 },
    'Вера':           { Человек:0.2, Духовность:1.0 },
    'Мораль':         { Человек:0.5, Отношения:0.2, Духовность:0.7, Общество:0.2 },
    'Общество':       { Влияние:0.3, Общество:1.0, Будущее:0.2 },
    'История':        { Семья:0.5, Влияние:0.2, Общество:0.8, Будущее:0.2 },
    'Будущее':        { Общество:0.2, Будущее:1.0 },
    'Наука':          { Человек:0.2, Будущее:1.0 },
    'Творчество':     { Человек:0.2, Самореализация:0.5, Свобода:0.3, Творчество:1.0 },
    'Лидерство':      { Самореализация:0.3, Влияние:1.0, Общество:0.3 },
    'Взросление':     { Человек:0.8, Отношения:0.2, Самореализация:0.3, Свобода:0.3, Духовность:0.2 },
    'Психология':     { Человек:1.0, Отношения:0.4, Самореализация:0.2, Духовность:0.2 },
    'Достижения':     { Самореализация:1.0, Влияние:0.4, Свобода:0.2 },
    'Цивилизации':    { Влияние:0.3, Общество:0.7, Будущее:0.8 },
};

const THEME_TO_MOTIVATION = {
    'Смысл жизни':    { 'Поиск себя':1.0, 'Нравственный выбор':0.4, 'Понимание человека':0.4 },
    'Самореализация': { 'Поиск себя':0.3, 'Самореализация':1.0, 'Влияние':0.3, 'Свобода':0.5 },
    'Любовь':         { 'Близость':1.0, 'Понимание человека':0.2, 'Понимание общества':0.5 },
    'Отношения':      { 'Близость':1.0, 'Понимание человека':0.2, 'Понимание общества':0.8 },
    'Дружба':         { 'Близость':1.0, 'Понимание человека':0.2, 'Понимание общества':0.4 },
    'Семья':          { 'Близость':0.4, 'Семья и корни':1.0, 'Понимание человека':0.1 },
    'Власть':         { 'Самореализация':0.2, 'Влияние':1.0, 'Понимание общества':0.8 },
    'Свобода':        { 'Поиск себя':0.2, 'Самореализация':0.5, 'Свобода':1.0 },
    'Вера':           { 'Поиск себя':0.8, 'Нравственный выбор':0.8, 'Понимание человека':0.2 },
    'Мораль':         { 'Поиск себя':0.4, 'Нравственный выбор':1.0, 'Понимание человека':0.3 },
    'Общество':       { 'Влияние':0.2, 'Понимание общества':1.0, 'Познание будущего':0.2 },
    'История':        { 'Семья и корни':0.5, 'Понимание общества':0.8, 'Познание будущего':0.2 },
    'Будущее':        { 'Понимание общества':0.2, 'Познание будущего':1.0 },
    'Наука':          { 'Понимание человека':0.1, 'Познание будущего':1.0 },
    'Творчество':     { 'Поиск себя':0.2, 'Самореализация':0.8, 'Свобода':0.2 },
    'Лидерство':      { 'Самореализация':0.4, 'Влияние':1.0, 'Понимание общества':0.3 },
    'Взросление':     { 'Поиск себя':0.8, 'Самореализация':0.3, 'Свобода':0.3, 'Понимание человека':0.5 },
    'Психология':     { 'Поиск себя':0.6, 'Близость':0.2, 'Нравственный выбор':0.3, 'Понимание человека':1.0 },
    'Достижения':     { 'Самореализация':1.0, 'Влияние':0.4, 'Свобода':0.1 },
    'Цивилизации':    { 'Влияние':0.2, 'Понимание общества':0.7, 'Познание будущего':1.0 },
};

const INTEREST_TO_BRANCH = {
    'Человек':        'a',
    'Духовность':     'a',
    'Отношения':      'b',
    'Семья':          'e',
    'Самореализация': 'c',
    'Творчество':     'c',
    'Влияние':        'g',
    'Свобода':        'g',
    'Общество':       'g',
    'Будущее':        'd',
};

const INTEREST_META = {
    'Человек':        { icon: '🧠', label: 'Человек и психология' },
    'Отношения':      { icon: '❤️', label: 'Отношения' },
    'Семья':          { icon: '🏠', label: 'Семья и корни' },
    'Самореализация': { icon: '🚀', label: 'Самореализация' },
    'Влияние':        { icon: '⚡', label: 'Власть и влияние' },
    'Свобода':        { icon: '🕊️', label: 'Свобода' },
    'Духовность':     { icon: '✨', label: 'Духовность и смысл' },
    'Общество':       { icon: '🏛️', label: 'Общество и история' },
    'Будущее':        { icon: '🔭', label: 'Наука и будущее' },
    'Творчество':     { icon: '🎨', label: 'Творчество' },
};

const MOTIVATION_META = {
    'Поиск себя':         { icon: '🪞', label: 'Поиск себя' },
    'Самореализация':     { icon: '🏆', label: 'Самореализация' },
    'Близость':           { icon: '🤝', label: 'Близость' },
    'Семья и корни':      { icon: '🌳', label: 'Семья и корни' },
    'Влияние':            { icon: '⚡', label: 'Влияние' },
    'Свобода':            { icon: '🕊️', label: 'Свобода' },
    'Нравственный выбор': { icon: '⚖️', label: 'Нравственный выбор' },
    'Понимание человека': { icon: '🧠', label: 'Понимание человека' },
    'Понимание общества': { icon: '🏛️', label: 'Понимание общества' },
    'Познание будущего':  { icon: '🔭', label: 'Познание будущего' },
};

const CLUB_THEME_VECTORS = {
    'cl1':  { 'Психология':0.30, 'Самореализация':0.25, 'Смысл жизни':0.20, 'Достижения':0.15, 'Будущее':0.10 },
    'cl8':  { 'Психология':0.30, 'Наука':0.25, 'Общество':0.20, 'Мораль':0.15, 'Вера':0.10 },
    'cl21': { 'История':0.40, 'Общество':0.20, 'Семья':0.20, 'Психология':0.10, 'Любовь':0.10 },
    'cl22': { 'История':0.40, 'Общество':0.25, 'Психология':0.20, 'Любовь':0.15 },
    'cl23': { 'Психология':0.28, 'История':0.18, 'Мораль':0.17, 'Любовь':0.12, 'Смысл жизни':0.10, 'Отношения':0.10, 'Взросление':0.05 },
    'cl15': { 'Психология':0.25, 'Смысл жизни':0.20, 'История':0.20, 'Общество':0.20, 'Взросление':0.15 },
    'cl9':  { 'Любовь':0.30, 'Психология':0.25, 'История':0.20, 'Семья':0.15, 'Мораль':0.10 },
    'cl10': { 'Мораль':0.25, 'Смысл жизни':0.25, 'Психология':0.25, 'Общество':0.15, 'Вера':0.10 },
};

const COVERS = {
    'l1_1':  'https://covers.openlibrary.org/b/id/7222246-L.jpg',
    'l1_2':  'https://covers.openlibrary.org/b/id/8226083-L.jpg',
    'l1_3':  'https://covers.openlibrary.org/b/id/8231489-L.jpg',
    'l1_4':  'https://covers.openlibrary.org/b/id/8739173-L.jpg',
    'l1_5':  'https://covers.openlibrary.org/b/id/8739137-L.jpg',
    'l1_7':  'https://covers.openlibrary.org/b/id/12625046-L.jpg',
    'l1_8':  'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    'l1_9':  'https://covers.openlibrary.org/b/id/12967172-L.jpg',
    'l1_10': 'https://covers.openlibrary.org/b/id/8231582-L.jpg',
    'l1_11': 'https://covers.openlibrary.org/b/id/8086822-L.jpg',
    'l1_12': 'https://covers.openlibrary.org/b/id/8739157-L.jpg',
    'l2_a_1':'https://covers.openlibrary.org/b/id/8739133-L.jpg',
    'l2_a_2':'https://covers.openlibrary.org/b/id/8226001-L.jpg',
    'l2_a_4':'https://covers.openlibrary.org/b/id/8342568-L.jpg',
    'l2_c_3':'https://covers.openlibrary.org/b/id/10556302-L.jpg',
    'l2_c_4':'https://covers.openlibrary.org/b/id/10717358-L.jpg',
    'l2_g_2':'https://covers.openlibrary.org/b/id/8575651-L.jpg',
    'l2_d_1':'https://covers.openlibrary.org/b/id/8231640-L.jpg',
    'l2_d_2':'https://covers.openlibrary.org/b/id/8342600-L.jpg',
    'l2_d_3':'https://covers.openlibrary.org/b/id/8342596-L.jpg',
    'l2_e_1':'https://covers.openlibrary.org/b/id/8739157-L.jpg',
};

const QUIZ_DATA = {
    level1: [
        { id: 'l1_1',  title: '1984',                     author: 'Джордж Оруэлл' },
        { id: 'l1_2',  title: 'Мастер и Маргарита',       author: 'Михаил Булгаков' },
        { id: 'l1_3',  title: 'Три товарища',             author: 'Эрих Мария Ремарк' },
        { id: 'l1_4',  title: 'Братья Карамазовы',        author: 'Фёдор Достоевский' },
        { id: 'l1_5',  title: 'Мартин Иден',              author: 'Джек Лондон' },
        { id: 'l1_6',  title: 'Маленький принц',          author: 'Антуан де Сент-Экзюпери' },
        { id: 'l1_7',  title: 'Задача трёх тел',          author: 'Лю Цысинь' },
        { id: 'l1_8',  title: 'Анна Каренина',            author: 'Лев Толстой' },
        { id: 'l1_9',  title: 'Атлант расправил плечи',   author: 'Айн Рэнд' },
        { id: 'l1_10', title: 'Преступление и наказание', author: 'Фёдор Достоевский' },
        { id: 'l1_11', title: 'Дюна',                     author: 'Фрэнк Герберт' },
        { id: 'l1_12', title: 'Тихий Дон',                author: 'Михаил Шолохов' },
    ],
    level2: {
        a: [
            { id: 'l2_a_1', title: 'Идиот',                   author: 'Фёдор Достоевский' },
            { id: 'l2_a_2', title: 'Солярис',                  author: 'Станислав Лем' },
            { id: 'l2_a_3', title: 'Алхимик',                  author: 'Пауло Коэльо' },
            { id: 'l2_a_4', title: 'Степной волк',             author: 'Герман Гессе' },
            { id: 'l2_a_5', title: 'Демиан',                   author: 'Герман Гессе' },
            { id: 'l2_a_6', title: 'Перевал в середине пути',  author: 'Джеймс Холлис' },
        ],
        b: [
            { id: 'l2_b_1', title: 'Гордость и предубеждение', author: 'Джейн Остин' },
            { id: 'l2_b_2', title: 'Норвежский лес',           author: 'Харуки Мураками' },
            { id: 'l2_b_3', title: 'До встречи с тобой',       author: 'Джоджо Мойес' },
            { id: 'l2_b_4', title: 'Искусство любить',         author: 'Эрих Фромм' },
        ],
        c: [
            { id: 'l2_c_1', title: 'Источник',       author: 'Айн Рэнд' },
            { id: 'l2_c_2', title: 'Финансист',      author: 'Теодор Драйзер' },
            { id: 'l2_c_3', title: 'Атомные привычки', author: 'Джеймс Клир' },
            { id: 'l2_c_4', title: 'Антихрупкость',  author: 'Нассим Талеб' },
            { id: 'l2_c_5', title: 'Стоунер',        author: 'Джон Уильямс' },
        ],
        g: [
            { id: 'l2_g_1', title: 'Мы',             author: 'Евгений Замятин' },
            { id: 'l2_g_2', title: 'Скотный двор',   author: 'Джордж Оруэлл' },
            { id: 'l2_g_3', title: 'Архипелаг ГУЛАГ', author: 'Александр Солженицын' },
            { id: 'l2_g_4', title: 'Государь',       author: 'Никколо Макиавелли' },
            { id: 'l2_g_5', title: 'Повелитель мух', author: 'Уильям Голдинг' },
        ],
        d: [
            { id: 'l2_d_1', title: 'Тёмный лес',    author: 'Лю Цысинь' },
            { id: 'l2_d_2', title: 'Гиперион',       author: 'Дэн Симмонс' },
            { id: 'l2_d_3', title: 'Основание',      author: 'Айзек Азимов' },
            { id: 'l2_d_4', title: 'Конец вечности', author: 'Айзек Азимов' },
            { id: 'l2_d_5', title: 'Контакт',        author: 'Карл Саган' },
        ],
        e: [
            { id: 'l2_e_1', title: 'Война и мир',               author: 'Лев Толстой' },
            { id: 'l2_e_2', title: 'Доктор Живаго',             author: 'Борис Пастернак' },
            { id: 'l2_e_3', title: 'Женщины Лазаря',            author: 'Марина Степнова' },
            { id: 'l2_e_4', title: 'Люди, которые всегда со мной', author: 'Наринэ Абгарян' },
            { id: 'l2_e_5', title: 'Глиняный мост',             author: 'Маркус Зусак' },
        ],
    },
};

// ── State ─────────────────────────────────────────────────────────────
let state = {
    step: 0, // 0=start, 1=step1, 2=step2, 3=results
    cardIndex: 0,
    cards: [],
    reactionsL1: {},
    reactionsL2: {},
    winningBranches: [],
};

// ── Helpers ───────────────────────────────────────────────────────────
function getStringColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return `linear-gradient(145deg, hsl(${hue},45%,22%), hsl(${(hue+40)%360},40%,30%))`;
}

function normalize(str) {
    return str.toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9]/g,'');
}

function getCoverUrl(book) {
    const db = getDB();
    const qn = normalize(book.title);
    let best = null, bestScore = 0;
    db.books.forEach(dbBook => {
        if (!dbBook.coverUrl || !dbBook.title) return;
        const dn = normalize(dbBook.title);
        let score = 0;
        if (dn === qn) score = 100;
        else if (dn.includes(qn) || qn.includes(dn)) score = 80;
        else {
            const q60 = qn.slice(0, Math.floor(qn.length * 0.6));
            const d60 = dn.slice(0, Math.floor(dn.length * 0.6));
            if (q60 && d60 && q60 === d60) score = 60;
        }
        if (score > bestScore) { bestScore = score; best = dbBook; }
    });
    if (best && bestScore >= 60) return best.coverUrl;
    return COVERS[book.id] || null;
}

function computeProfile(reactionsById) {
    const allBooks = [...QUIZ_DATA.level1, ...Object.values(QUIZ_DATA.level2).flat()];
    const themes = {};
    Object.entries(reactionsById).forEach(([id, reaction]) => {
        const coeff = REACTION_WEIGHTS[reaction];
        if (coeff === undefined) return;
        const book = allBooks.find(b => b.id === id);
        if (!book) return;
        const tags = BOOK_TAGS[book.title];
        if (!tags) return;
        Object.entries(tags).forEach(([tag, tw]) => {
            const contribs = TAG_TO_THEME[tag];
            if (!contribs) return;
            contribs.forEach(({ t, w }) => { themes[t] = (themes[t] || 0) + tw * coeff * w; });
        });
    });
    const interests = {};
    Object.entries(themes).forEach(([theme, ts]) => {
        if (ts <= 0) return;
        const c = THEME_TO_INTEREST[theme]; if (!c) return;
        Object.entries(c).forEach(([k, w]) => { if (w > 0) interests[k] = (interests[k] || 0) + ts * w; });
    });
    const motivations = {};
    Object.entries(themes).forEach(([theme, ts]) => {
        if (ts <= 0) return;
        const c = THEME_TO_MOTIVATION[theme]; if (!c) return;
        Object.entries(c).forEach(([k, w]) => { if (w > 0) motivations[k] = (motivations[k] || 0) + ts * w; });
    });
    return { themes, interests, motivations };
}

function cosineSim(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0, magA = 0, magB = 0;
    keys.forEach(k => {
        const va = a[k] || 0, vb = b[k] || 0;
        dot += va * vb; magA += va * va; magB += vb * vb;
    });
    return (magA && magB) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// ── Render helpers ────────────────────────────────────────────────────
function getContainer() { return document.getElementById('quiz-container'); }

function renderStart() {
    const c = getContainer();
    c.innerHTML = `
        <div class="m-quiz-start">
            <div class="m-quiz-start-icon">🪄</div>
            <h2>Подобрать клуб</h2>
            <p>Ответьте на вопросы о книгах, которые вы читали,<br>и мы найдём клуб, идеально совпадающий с вашим вкусом.</p>
            <button class="m-quiz-start-btn" id="quiz-start-btn">
                Начать подбор <i class="ph ph-arrow-right"></i>
            </button>
        </div>`;
    document.getElementById('quiz-start-btn').addEventListener('click', startQuiz);
}

function startQuiz() {
    state = { step: 1, cardIndex: 0, cards: [...QUIZ_DATA.level1], reactionsL1: {}, reactionsL2: {}, winningBranches: [] };
    renderCarousel();
}

function startStep2() {
    // Find winning branches from step1 reactions
    const profile = computeProfile(state.reactionsL1);
    const sorted = Object.entries(profile.interests).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
    const usedBranches = new Set(); const branches = [];
    for (const [interest] of sorted) {
        const br = INTEREST_TO_BRANCH[interest];
        if (br && !usedBranches.has(br)) { usedBranches.add(br); branches.push(br); if (branches.length >= 2) break; }
    }
    state.winningBranches = branches.length ? branches : ['a','b'];

    let pool = [];
    state.winningBranches.forEach(br => { pool = pool.concat(QUIZ_DATA.level2[br] || []); });
    const seen = new Set();
    pool = pool.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; });
    pool.sort(() => Math.random() - 0.5);
    state.step = 2;
    state.cards = pool.slice(0, 8);
    state.cardIndex = 0;
    renderCarousel();
}

function renderCarousel() {
    const c = getContainer();
    c.innerHTML = '';

    const isStep1 = state.step === 1;
    const reactions = isStep1 ? state.reactionsL1 : state.reactionsL2;
    const book = state.cards[state.cardIndex];
    const total = state.cards.length;
    const reacted = Object.keys(reactions).length;
    const needed = 5;
    const canProceed = reacted >= needed;

    // Header
    const header = document.createElement('div');
    header.className = 'm-quiz-header';
    header.innerHTML = `
        <div class="m-quiz-step-label">${isStep1 ? 'Шаг 1 из 2' : 'Шаг 2 из 2'}</div>
        <div class="m-quiz-title">${isStep1 ? 'Что вы уже читали?' : 'Уточним вкус'}</div>
        <div class="m-quiz-sub">${reacted < needed
            ? `Отметьте хотя бы ${needed} книг — ${reacted} из ${needed}`
            : `Отмечено: ${reacted} · можно продолжить`}</div>
        <div class="m-quiz-progress">
            <div class="m-quiz-progress-fill" style="width:${Math.round((state.cardIndex / total) * 100)}%"></div>
        </div>`;
    c.appendChild(header);

    // Card
    const cardWrap = document.createElement('div');
    cardWrap.className = 'm-quiz-card-wrap';

    const card = document.createElement('div');
    card.className = 'm-quiz-card';
    const coverUrl = getCoverUrl(book);
    if (coverUrl) {
        const img = document.createElement('img');
        img.className = 'm-quiz-card-img';
        img.src = coverUrl;
        img.onerror = () => { img.remove(); card.style.background = getStringColor(book.title); };
        card.appendChild(img);
    } else {
        card.style.background = getStringColor(book.title);
    }
    const overlay = document.createElement('div');
    overlay.className = 'm-quiz-card-overlay';
    card.appendChild(overlay);

    const counter = document.createElement('div');
    counter.className = 'm-quiz-card-counter';
    counter.textContent = `${state.cardIndex + 1} / ${total}`;
    card.appendChild(counter);

    const info = document.createElement('div');
    info.className = 'm-quiz-card-info';
    info.innerHTML = `<div class="m-quiz-card-title">${book.title}</div><div class="m-quiz-card-author">${book.author || ''}</div>`;
    card.appendChild(info);

    // Stamp if reacted
    const currentReaction = reactions[book.id];
    if (currentReaction) {
        const stampData = {
            favorite: { e:'❤️', l:'Любимая' }, liked:    { e:'👍', l:'Понравилась' },
            ok:       { e:'😐', l:'Нормально' }, disliked: { e:'👎', l:'Не зашла' },
            dropped:  { e:'🚫', l:'Бросил' },
        }[currentReaction];
        const stamp = document.createElement('div');
        stamp.className = `m-quiz-stamp ${currentReaction}`;
        stamp.innerHTML = `<span>${stampData.e}</span> <span>${stampData.l}</span>`;
        card.appendChild(stamp);
    }

    cardWrap.appendChild(card);
    c.appendChild(cardWrap);

    // Reactions
    const reactionsWrap = document.createElement('div');
    reactionsWrap.className = 'm-quiz-reactions';
    [
        { type:'favorite', emoji:'❤️', label:'Любимая' },
        { type:'liked',    emoji:'👍', label:'Понравилась' },
        { type:'ok',       emoji:'😐', label:'Нормально' },
        { type:'disliked', emoji:'👎', label:'Не зашла' },
        { type:'dropped',  emoji:'🚫', label:'Бросил' },
    ].forEach(({ type, emoji, label }) => {
        const btn = document.createElement('button');
        btn.className = 'm-quiz-reaction-btn' + (currentReaction === type ? ' active' : '');
        btn.innerHTML = `<span class="emoji">${emoji}</span><span>${label}</span>`;
        btn.addEventListener('click', () => {
            if (currentReaction === type) { delete reactions[book.id]; }
            else { reactions[book.id] = type; }
            if (!currentReaction && state.cardIndex < total - 1) {
                setTimeout(() => { state.cardIndex++; renderCarousel(); }, 280);
            } else { renderCarousel(); }
        });
        reactionsWrap.appendChild(btn);
    });
    c.appendChild(reactionsWrap);

    // Nav row
    const nav = document.createElement('div');
    nav.className = 'm-quiz-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'm-quiz-nav-btn';
    prevBtn.innerHTML = '<i class="ph ph-arrow-left"></i>';
    prevBtn.disabled = state.cardIndex === 0;
    prevBtn.addEventListener('click', () => { state.cardIndex--; renderCarousel(); });
    nav.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'm-quiz-nav-btn';
    nextBtn.innerHTML = '<i class="ph ph-arrow-right"></i>';
    nextBtn.disabled = state.cardIndex === total - 1;
    nextBtn.addEventListener('click', () => { state.cardIndex++; renderCarousel(); });
    nav.appendChild(nextBtn);
    c.appendChild(nav);

    // Proceed button
    if (canProceed) {
        const proceedWrap = document.createElement('div');
        proceedWrap.className = 'm-quiz-proceed-wrap';
        const proceedBtn = document.createElement('button');
        proceedBtn.className = 'm-quiz-proceed-btn';
        if (isStep1) {
            proceedBtn.innerHTML = `Продолжить <i class="ph ph-arrow-right"></i>`;
            proceedBtn.addEventListener('click', startStep2);
        } else {
            proceedBtn.innerHTML = `Показать результат <i class="ph ph-sparkle"></i>`;
            proceedBtn.addEventListener('click', renderResults);
        }
        proceedWrap.appendChild(proceedBtn);
        c.appendChild(proceedWrap);
    }
}

function renderResults() {
    const c = getContainer();
    c.innerHTML = '';

    const allReactions = { ...state.reactionsL1, ...state.reactionsL2 };
    const profile = computeProfile(allReactions);

    // Scroll area
    const scroll = document.createElement('div');
    scroll.className = 'm-quiz-results';

    // Header inside results
    const hdr = document.createElement('div');
    hdr.className = 'm-quiz-header';
    hdr.innerHTML = `
        <div class="m-quiz-step-label">Результат</div>
        <div class="m-quiz-title">🎯 Ваш профиль</div>
        <div class="m-quiz-sub">На основе ваших реакций</div>`;
    c.appendChild(hdr);

    // ── Interests section ──
    const sortedInterests = Object.entries(profile.interests)
        .filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,5);
    const maxInt = sortedInterests[0]?.[1] || 1;

    const intSec = document.createElement('div');
    intSec.className = 'm-quiz-results-section';
    intSec.innerHTML = '<div class="m-quiz-results-heading">🧩 Интересы</div>';
    sortedInterests.forEach(([key, val]) => {
        const meta = INTEREST_META[key] || { icon:'•', label: key };
        const pct = Math.round((val / maxInt) * 100);
        intSec.insertAdjacentHTML('beforeend', `
            <div class="m-quiz-stat-row">
                <div class="m-quiz-stat-label">${meta.icon} ${meta.label}</div>
                <div class="m-quiz-stat-bar-bg">
                    <div class="m-quiz-stat-bar-fg m-quiz-bar-interest" style="width:0%" data-w="${pct}%"></div>
                </div>
                <div class="m-quiz-stat-pct">${pct}%</div>
            </div>`);
    });
    scroll.appendChild(intSec);

    // ── Motivations section ──
    const sortedMot = Object.entries(profile.motivations)
        .filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,4);
    const maxMot = sortedMot[0]?.[1] || 1;

    const motSec = document.createElement('div');
    motSec.className = 'm-quiz-results-section';
    motSec.innerHTML = '<div class="m-quiz-results-heading">💡 Зачем вы читаете</div>';
    sortedMot.forEach(([key, val]) => {
        const meta = MOTIVATION_META[key] || { icon:'•', label: key };
        const pct = Math.round((val / maxMot) * 100);
        motSec.insertAdjacentHTML('beforeend', `
            <div class="m-quiz-stat-row">
                <div class="m-quiz-stat-label">${meta.icon} ${meta.label}</div>
                <div class="m-quiz-stat-bar-bg">
                    <div class="m-quiz-stat-bar-fg m-quiz-bar-motivation" style="width:0%" data-w="${pct}%"></div>
                </div>
                <div class="m-quiz-stat-pct">${pct}%</div>
            </div>`);
    });
    scroll.appendChild(motSec);

    // ── Club matches ──
    const db = getDB();
    const activeClubs = db.clubs.filter(cl => db.books.filter(b => b.clubId === cl.id).length >= 10);
    const userThemes = {};
    const themesArr = Object.entries(profile.themes).filter(([,v]) => v > 0);
    const themeMax = Math.max(...themesArr.map(([,v]) => v), 1);
    themesArr.forEach(([t, v]) => { userThemes[t] = v / themeMax; });

    const clubsScored = activeClubs.map(club => {
        let clubVec = CLUB_THEME_VECTORS[club.id];
        if (!clubVec) {
            let hash = 0;
            for (let i = 0; i < club.name.length; i++) hash = club.name.charCodeAt(i) + ((hash << 5) - hash);
            const themes = ['Психология','Смысл жизни','История','Общество','Мораль'];
            const ti = Math.abs(hash) % themes.length;
            clubVec = { [themes[ti]]: 0.5, [themes[(ti+1)%themes.length]]: 0.3 };
        }
        const sim = cosineSim(userThemes, clubVec);
        const archetypeLabel = club.archetype ? club.archetype.title : '📚 ' + club.name;
        return { club, sim, archetypeLabel };
    }).sort((a,b) => b.sim - a.sim).slice(0, 3);

    const matchSec = document.createElement('div');
    matchSec.className = 'm-quiz-results-section';
    matchSec.innerHTML = '<div class="m-quiz-results-heading">👥 Похожи на вас</div>';

    clubsScored.forEach((m, i) => {
        const bookCount = db.books.filter(b => b.clubId === m.club.id).length;
        const matchPct = Math.round(m.sim * 100);
        const row = document.createElement('div');
        row.className = 'm-quiz-match';
        row.innerHTML = `
            <div class="m-quiz-match-badge">#${i+1}</div>
            <div class="m-quiz-match-info">
                <div class="m-quiz-match-name">${m.club.name}</div>
                <div class="m-quiz-match-archetype">${m.archetypeLabel}</div>
                <div class="m-quiz-match-meta">${bookCount} книг · совпадение ${matchPct}%</div>
            </div>
            <button class="m-quiz-match-go" data-club-id="${m.club.id}">Смотреть</button>`;
        matchSec.appendChild(row);
    });
    scroll.appendChild(matchSec);

    // Restart
    const restartWrap = document.createElement('div');
    restartWrap.className = 'm-quiz-restart';
    restartWrap.innerHTML = `<button class="m-quiz-restart-btn" id="quiz-restart-btn">Пройти заново</button>`;
    scroll.appendChild(restartWrap);

    c.appendChild(scroll);

    // Animate bars
    requestAnimationFrame(() => requestAnimationFrame(() => {
        c.querySelectorAll('.m-quiz-stat-bar-fg[data-w]').forEach(el => { el.style.width = el.dataset.w; });
    }));

    // Wire buttons
    document.getElementById('quiz-restart-btn')?.addEventListener('click', () => renderStart());

    c.querySelectorAll('.m-quiz-match-go').forEach(btn => {
        btn.addEventListener('click', () => {
            // Switch to clubs tab and open the club detail
            const clubId = btn.dataset.clubId;
            document.querySelector('[data-page="clubs"]')?.click();
            // Small delay for page switch
            setTimeout(() => {
                const card = document.querySelector(`.m-club-card[data-club-id="${clubId}"]`);
                if (card) card.click();
            }, 100);
        });
    });
}

// ── Init ──────────────────────────────────────────────────────────────
export function initQuiz() {
    renderStart();
}
