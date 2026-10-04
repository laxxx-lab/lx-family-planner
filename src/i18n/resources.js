// Übersetzungskataloge für alle Sprachen.
// Bewusst statische Importe statt import.meta.glob: So lässt sich diese Datei
// auch außerhalb von Vite laden (z. B. in Node-Tests, die Hooks importieren).
// Neuer Namespace? Hier für JEDE Sprache eintragen – scripts/check-i18n.js
// prüft, dass alle Sprachen dieselben Schlüssel enthalten.
import deAdmin from './locales/de/admin.json' with { type: 'json' };
import deAdminCloud from './locales/de/adminCloud.json' with { type: 'json' };
import deAuth from './locales/de/auth.json' with { type: 'json' };
import deBoard from './locales/de/board.json' with { type: 'json' };
import deCalendar from './locales/de/calendar.json' with { type: 'json' };
import deChat from './locales/de/chat.json' with { type: 'json' };
import deChrome from './locales/de/chrome.json' with { type: 'json' };
import deCommon from './locales/de/common.json' with { type: 'json' };
import deContext from './locales/de/context.json' with { type: 'json' };
import deDashboard from './locales/de/dashboard.json' with { type: 'json' };
import deFamilyLife from './locales/de/familyLife.json' with { type: 'json' };
import deFamilyMail from './locales/de/familyMail.json' with { type: 'json' };
import deFamilyTree from './locales/de/familyTree.json' with { type: 'json' };
import deMeals from './locales/de/meals.json' with { type: 'json' };
import deNotifications from './locales/de/notifications.json' with { type: 'json' };
import deProfile from './locales/de/profile.json' with { type: 'json' };
import deShared from './locales/de/shared.json' with { type: 'json' };
import deShopping from './locales/de/shopping.json' with { type: 'json' };
import deTasks from './locales/de/tasks.json' with { type: 'json' };
import deWidgets from './locales/de/widgets.json' with { type: 'json' };

import enAdmin from './locales/en/admin.json' with { type: 'json' };
import enAdminCloud from './locales/en/adminCloud.json' with { type: 'json' };
import enAuth from './locales/en/auth.json' with { type: 'json' };
import enBoard from './locales/en/board.json' with { type: 'json' };
import enCalendar from './locales/en/calendar.json' with { type: 'json' };
import enChat from './locales/en/chat.json' with { type: 'json' };
import enChrome from './locales/en/chrome.json' with { type: 'json' };
import enCommon from './locales/en/common.json' with { type: 'json' };
import enContext from './locales/en/context.json' with { type: 'json' };
import enDashboard from './locales/en/dashboard.json' with { type: 'json' };
import enFamilyLife from './locales/en/familyLife.json' with { type: 'json' };
import enFamilyMail from './locales/en/familyMail.json' with { type: 'json' };
import enFamilyTree from './locales/en/familyTree.json' with { type: 'json' };
import enMeals from './locales/en/meals.json' with { type: 'json' };
import enNotifications from './locales/en/notifications.json' with { type: 'json' };
import enProfile from './locales/en/profile.json' with { type: 'json' };
import enShared from './locales/en/shared.json' with { type: 'json' };
import enShopping from './locales/en/shopping.json' with { type: 'json' };
import enTasks from './locales/en/tasks.json' with { type: 'json' };
import enWidgets from './locales/en/widgets.json' with { type: 'json' };

import frAdmin from './locales/fr/admin.json' with { type: 'json' };
import frAdminCloud from './locales/fr/adminCloud.json' with { type: 'json' };
import frAuth from './locales/fr/auth.json' with { type: 'json' };
import frBoard from './locales/fr/board.json' with { type: 'json' };
import frCalendar from './locales/fr/calendar.json' with { type: 'json' };
import frChat from './locales/fr/chat.json' with { type: 'json' };
import frChrome from './locales/fr/chrome.json' with { type: 'json' };
import frCommon from './locales/fr/common.json' with { type: 'json' };
import frContext from './locales/fr/context.json' with { type: 'json' };
import frDashboard from './locales/fr/dashboard.json' with { type: 'json' };
import frFamilyLife from './locales/fr/familyLife.json' with { type: 'json' };
import frFamilyMail from './locales/fr/familyMail.json' with { type: 'json' };
import frFamilyTree from './locales/fr/familyTree.json' with { type: 'json' };
import frMeals from './locales/fr/meals.json' with { type: 'json' };
import frNotifications from './locales/fr/notifications.json' with { type: 'json' };
import frProfile from './locales/fr/profile.json' with { type: 'json' };
import frShared from './locales/fr/shared.json' with { type: 'json' };
import frShopping from './locales/fr/shopping.json' with { type: 'json' };
import frTasks from './locales/fr/tasks.json' with { type: 'json' };
import frWidgets from './locales/fr/widgets.json' with { type: 'json' };

import esAdmin from './locales/es/admin.json' with { type: 'json' };
import esAdminCloud from './locales/es/adminCloud.json' with { type: 'json' };
import esAuth from './locales/es/auth.json' with { type: 'json' };
import esBoard from './locales/es/board.json' with { type: 'json' };
import esCalendar from './locales/es/calendar.json' with { type: 'json' };
import esChat from './locales/es/chat.json' with { type: 'json' };
import esChrome from './locales/es/chrome.json' with { type: 'json' };
import esCommon from './locales/es/common.json' with { type: 'json' };
import esContext from './locales/es/context.json' with { type: 'json' };
import esDashboard from './locales/es/dashboard.json' with { type: 'json' };
import esFamilyLife from './locales/es/familyLife.json' with { type: 'json' };
import esFamilyMail from './locales/es/familyMail.json' with { type: 'json' };
import esFamilyTree from './locales/es/familyTree.json' with { type: 'json' };
import esMeals from './locales/es/meals.json' with { type: 'json' };
import esNotifications from './locales/es/notifications.json' with { type: 'json' };
import esProfile from './locales/es/profile.json' with { type: 'json' };
import esShared from './locales/es/shared.json' with { type: 'json' };
import esShopping from './locales/es/shopping.json' with { type: 'json' };
import esTasks from './locales/es/tasks.json' with { type: 'json' };
import esWidgets from './locales/es/widgets.json' with { type: 'json' };

import itAdmin from './locales/it/admin.json' with { type: 'json' };
import itAdminCloud from './locales/it/adminCloud.json' with { type: 'json' };
import itAuth from './locales/it/auth.json' with { type: 'json' };
import itBoard from './locales/it/board.json' with { type: 'json' };
import itCalendar from './locales/it/calendar.json' with { type: 'json' };
import itChat from './locales/it/chat.json' with { type: 'json' };
import itChrome from './locales/it/chrome.json' with { type: 'json' };
import itCommon from './locales/it/common.json' with { type: 'json' };
import itContext from './locales/it/context.json' with { type: 'json' };
import itDashboard from './locales/it/dashboard.json' with { type: 'json' };
import itFamilyLife from './locales/it/familyLife.json' with { type: 'json' };
import itFamilyMail from './locales/it/familyMail.json' with { type: 'json' };
import itFamilyTree from './locales/it/familyTree.json' with { type: 'json' };
import itMeals from './locales/it/meals.json' with { type: 'json' };
import itNotifications from './locales/it/notifications.json' with { type: 'json' };
import itProfile from './locales/it/profile.json' with { type: 'json' };
import itShared from './locales/it/shared.json' with { type: 'json' };
import itShopping from './locales/it/shopping.json' with { type: 'json' };
import itTasks from './locales/it/tasks.json' with { type: 'json' };
import itWidgets from './locales/it/widgets.json' with { type: 'json' };

import nlAdmin from './locales/nl/admin.json' with { type: 'json' };
import nlAdminCloud from './locales/nl/adminCloud.json' with { type: 'json' };
import nlAuth from './locales/nl/auth.json' with { type: 'json' };
import nlBoard from './locales/nl/board.json' with { type: 'json' };
import nlCalendar from './locales/nl/calendar.json' with { type: 'json' };
import nlChat from './locales/nl/chat.json' with { type: 'json' };
import nlChrome from './locales/nl/chrome.json' with { type: 'json' };
import nlCommon from './locales/nl/common.json' with { type: 'json' };
import nlContext from './locales/nl/context.json' with { type: 'json' };
import nlDashboard from './locales/nl/dashboard.json' with { type: 'json' };
import nlFamilyLife from './locales/nl/familyLife.json' with { type: 'json' };
import nlFamilyMail from './locales/nl/familyMail.json' with { type: 'json' };
import nlFamilyTree from './locales/nl/familyTree.json' with { type: 'json' };
import nlMeals from './locales/nl/meals.json' with { type: 'json' };
import nlNotifications from './locales/nl/notifications.json' with { type: 'json' };
import nlProfile from './locales/nl/profile.json' with { type: 'json' };
import nlShared from './locales/nl/shared.json' with { type: 'json' };
import nlShopping from './locales/nl/shopping.json' with { type: 'json' };
import nlTasks from './locales/nl/tasks.json' with { type: 'json' };
import nlWidgets from './locales/nl/widgets.json' with { type: 'json' };

import plAdmin from './locales/pl/admin.json' with { type: 'json' };
import plAdminCloud from './locales/pl/adminCloud.json' with { type: 'json' };
import plAuth from './locales/pl/auth.json' with { type: 'json' };
import plBoard from './locales/pl/board.json' with { type: 'json' };
import plCalendar from './locales/pl/calendar.json' with { type: 'json' };
import plChat from './locales/pl/chat.json' with { type: 'json' };
import plChrome from './locales/pl/chrome.json' with { type: 'json' };
import plCommon from './locales/pl/common.json' with { type: 'json' };
import plContext from './locales/pl/context.json' with { type: 'json' };
import plDashboard from './locales/pl/dashboard.json' with { type: 'json' };
import plFamilyLife from './locales/pl/familyLife.json' with { type: 'json' };
import plFamilyMail from './locales/pl/familyMail.json' with { type: 'json' };
import plFamilyTree from './locales/pl/familyTree.json' with { type: 'json' };
import plMeals from './locales/pl/meals.json' with { type: 'json' };
import plNotifications from './locales/pl/notifications.json' with { type: 'json' };
import plProfile from './locales/pl/profile.json' with { type: 'json' };
import plShared from './locales/pl/shared.json' with { type: 'json' };
import plShopping from './locales/pl/shopping.json' with { type: 'json' };
import plTasks from './locales/pl/tasks.json' with { type: 'json' };
import plWidgets from './locales/pl/widgets.json' with { type: 'json' };

import zhAdmin from './locales/zh/admin.json' with { type: 'json' };
import zhAdminCloud from './locales/zh/adminCloud.json' with { type: 'json' };
import zhAuth from './locales/zh/auth.json' with { type: 'json' };
import zhBoard from './locales/zh/board.json' with { type: 'json' };
import zhCalendar from './locales/zh/calendar.json' with { type: 'json' };
import zhChat from './locales/zh/chat.json' with { type: 'json' };
import zhChrome from './locales/zh/chrome.json' with { type: 'json' };
import zhCommon from './locales/zh/common.json' with { type: 'json' };
import zhContext from './locales/zh/context.json' with { type: 'json' };
import zhDashboard from './locales/zh/dashboard.json' with { type: 'json' };
import zhFamilyLife from './locales/zh/familyLife.json' with { type: 'json' };
import zhFamilyMail from './locales/zh/familyMail.json' with { type: 'json' };
import zhFamilyTree from './locales/zh/familyTree.json' with { type: 'json' };
import zhMeals from './locales/zh/meals.json' with { type: 'json' };
import zhNotifications from './locales/zh/notifications.json' with { type: 'json' };
import zhProfile from './locales/zh/profile.json' with { type: 'json' };
import zhShared from './locales/zh/shared.json' with { type: 'json' };
import zhShopping from './locales/zh/shopping.json' with { type: 'json' };
import zhTasks from './locales/zh/tasks.json' with { type: 'json' };
import zhWidgets from './locales/zh/widgets.json' with { type: 'json' };

const namespaces = {
  admin: { de: deAdmin, en: enAdmin, fr: frAdmin, es: esAdmin, it: itAdmin, nl: nlAdmin, pl: plAdmin, zh: zhAdmin },
  adminCloud: { de: deAdminCloud, en: enAdminCloud, fr: frAdminCloud, es: esAdminCloud, it: itAdminCloud, nl: nlAdminCloud, pl: plAdminCloud, zh: zhAdminCloud },
  auth: { de: deAuth, en: enAuth, fr: frAuth, es: esAuth, it: itAuth, nl: nlAuth, pl: plAuth, zh: zhAuth },
  board: { de: deBoard, en: enBoard, fr: frBoard, es: esBoard, it: itBoard, nl: nlBoard, pl: plBoard, zh: zhBoard },
  calendar: { de: deCalendar, en: enCalendar, fr: frCalendar, es: esCalendar, it: itCalendar, nl: nlCalendar, pl: plCalendar, zh: zhCalendar },
  chat: { de: deChat, en: enChat, fr: frChat, es: esChat, it: itChat, nl: nlChat, pl: plChat, zh: zhChat },
  chrome: { de: deChrome, en: enChrome, fr: frChrome, es: esChrome, it: itChrome, nl: nlChrome, pl: plChrome, zh: zhChrome },
  common: { de: deCommon, en: enCommon, fr: frCommon, es: esCommon, it: itCommon, nl: nlCommon, pl: plCommon, zh: zhCommon },
  context: { de: deContext, en: enContext, fr: frContext, es: esContext, it: itContext, nl: nlContext, pl: plContext, zh: zhContext },
  dashboard: { de: deDashboard, en: enDashboard, fr: frDashboard, es: esDashboard, it: itDashboard, nl: nlDashboard, pl: plDashboard, zh: zhDashboard },
  familyLife: { de: deFamilyLife, en: enFamilyLife, fr: frFamilyLife, es: esFamilyLife, it: itFamilyLife, nl: nlFamilyLife, pl: plFamilyLife, zh: zhFamilyLife },
  familyMail: { de: deFamilyMail, en: enFamilyMail, fr: frFamilyMail, es: esFamilyMail, it: itFamilyMail, nl: nlFamilyMail, pl: plFamilyMail, zh: zhFamilyMail },
  familyTree: { de: deFamilyTree, en: enFamilyTree, fr: frFamilyTree, es: esFamilyTree, it: itFamilyTree, nl: nlFamilyTree, pl: plFamilyTree, zh: zhFamilyTree },
  meals: { de: deMeals, en: enMeals, fr: frMeals, es: esMeals, it: itMeals, nl: nlMeals, pl: plMeals, zh: zhMeals },
  notifications: { de: deNotifications, en: enNotifications, fr: frNotifications, es: esNotifications, it: itNotifications, nl: nlNotifications, pl: plNotifications, zh: zhNotifications },
  profile: { de: deProfile, en: enProfile, fr: frProfile, es: esProfile, it: itProfile, nl: nlProfile, pl: plProfile, zh: zhProfile },
  shared: { de: deShared, en: enShared, fr: frShared, es: esShared, it: itShared, nl: nlShared, pl: plShared, zh: zhShared },
  shopping: { de: deShopping, en: enShopping, fr: frShopping, es: esShopping, it: itShopping, nl: nlShopping, pl: plShopping, zh: zhShopping },
  tasks: { de: deTasks, en: enTasks, fr: frTasks, es: esTasks, it: itTasks, nl: nlTasks, pl: plTasks, zh: zhTasks },
  widgets: { de: deWidgets, en: enWidgets, fr: frWidgets, es: esWidgets, it: itWidgets, nl: nlWidgets, pl: plWidgets, zh: zhWidgets }
};

const LANGUAGES = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl', 'zh'];

export const resources = Object.fromEntries(
  LANGUAGES.map(language => [
    language,
    Object.fromEntries(
      Object.entries(namespaces).map(([namespace, bundles]) => [
        namespace,
        bundles[language]
      ])
    )
  ])
);

export default resources;
