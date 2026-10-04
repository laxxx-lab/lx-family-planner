const RELEASE_NOTES = {
  '1.21.4': {
  "version": "1.21.4",
  "eyebrow": "Mehr Sprachen für die Familie",
  "title": "Chinesisch optional, Deutsch weiterhin Standard",
  "intro": "Vereinfachtes Chinesisch ergänzt die Sprachauswahl. Die Kalender- und Wanddisplay-Korrekturen aus 1.21.3 sind enthalten.",
  "highlights": [
    {
      "id": "chinese-language",
      "title": "Chinesisch frei auswählbar",
      "description": "Vereinfachtes Chinesisch ist vor der Anmeldung und in der Oberfläche verfügbar."
    },
    {
      "id": "german-default",
      "title": "Deutsch bleibt die Standardsprache",
      "description": "Bestehende Installationen und die persönliche Sprachwahl bleiben erhalten."
    },
    {
      "id": "webdav-translations",
      "title": "WebDAV-Einrichtung übersetzt",
      "description": "Beschriftungen und Meldungen der WebDAV-Einrichtung verwenden die gewählte Sprache."
    }
  ],
  "closing": "Bestehende Daten und Sprachpräferenzen bleiben erhalten.",
  "localizations": {
    "en": {
      "eyebrow": "More languages for families",
      "title": "Optional Chinese, German remains the default",
      "intro": "Simplified Chinese joins the language selector. This release includes the calendar and wall-display fixes from 1.21.3.",
      "highlights": [
        {
          "id": "chinese-language",
          "title": "Select Simplified Chinese",
          "description": "Chinese is available before login and throughout the interface."
        },
        {
          "id": "german-default",
          "title": "German remains the default",
          "description": "Existing installations and personal language choices are preserved."
        },
        {
          "id": "webdav-translations",
          "title": "Translated WebDAV setup",
          "description": "WebDAV labels and setup messages follow the selected language."
        }
      ],
      "closing": "Existing data and language preferences are preserved."
    },
    "zh": {
      "eyebrow": "为家庭提供更多语言",
      "title": "中文可选，德语仍为默认语言",
      "intro": "现在可以选择简体中文。本版本包含 1.21.3 的日历权限和墙面显示修复。",
      "highlights": [
        {
          "id": "chinese-language",
          "title": "选择简体中文",
          "description": "登录前和应用界面中都可以选择中文。"
        },
        {
          "id": "german-default",
          "title": "默认语言仍为德语",
          "description": "已有安装和个人语言选择保持不变。"
        },
        {
          "id": "webdav-translations",
          "title": "WebDAV 设置已翻译",
          "description": "WebDAV 标签和设置提示使用所选语言。"
        }
      ],
      "closing": "已有数据和语言偏好保持不变。"
    }
  }
},
  '1.21.3': {
    version: '1.21.3',
    eyebrow: 'Sicherer planen, Wandansicht leichter bedienen',
    title: 'Kalenderrechte und Wanddisplay korrigiert',
    intro: 'Kalenderänderungen sind Erwachsenen vorbehalten. Das Wanddisplay zeigt Familienaufgaben und erlaubt den sicheren Profilwechsel.',
    highlights: [
      { id: 'calendar-permissions', title: 'Kalenderrechte auch auf dem Server', description: 'Kinder lesen den Kalender. Nur Erwachsene ändern Termine und importieren Kalenderdateien.' },
      { id: 'wall-display-controls', title: 'Wandansicht mit Profilwechsel und Themes', description: 'Profile wechseln, Theme speichern, Kacheln anpassen und Familienaufgaben ansehen.' },
      { id: 'notification-theme-fixes', title: 'Lesbare Buttons und passende Fehlermeldungen', description: 'Theme-Kontraste und übersetzte Sternefehler sind korrigiert. Android bietet die Aktivierung auch nach einer früheren Ablehnung an.' }
    ],
    closing: 'Bestehende Familieninhalte bleiben erhalten. Native Android-Meldungen benötigen eine eingerichtete Firebase-Verbindung auf eurem Server.',
    localizations: {
      en: {
        eyebrow: 'Safer planning, easier wall displays',
        title: 'Calendar permissions and wall display fixes',
        intro: 'Calendar changes require adults. Wall displays show family tasks and support secure profile switching.',
        highlights: [
          { id: 'calendar-permissions', title: 'Calendar permissions enforced on the server', description: 'Children can read the calendar. Only adults change events and import calendar files.' },
          { id: 'wall-display-controls', title: 'Profile switching and themes on wall displays', description: 'Switch profiles, save themes, customize tiles and view family tasks.' },
          { id: 'notification-theme-fixes', title: 'Readable buttons and translated errors', description: 'Theme contrast and star redemption errors are corrected. Android offers activation after a previous permission denial.' }
        ],
        closing: 'Existing family data is preserved. Native Android notifications require Firebase credentials on your server.'
      }
    }
  },
  '1.21.2': {
    version: '1.21.2',
    eyebrow: 'Ruhiger planen, leichter bedienen',
    title: 'Essensplan und mobile Eingaben bleiben im richtigen Takt',
    intro:
      'Der Essensplan unterscheidet jetzt Wochen zuverlässig, während mobile Eingaben auch mit geöffneter Tastatur erreichbar bleiben.',
    highlights: [
      {
        id: 'ios-dialog-viewport',
        title: 'Eingaben bleiben auf dem iPhone erreichbar',
        description:
          'Schnell hinzufügen und Familie verwalten richten sich am sichtbaren Bereich aus. Die Tastatur verschiebt nicht mehr die Seite im Hintergrund.'
      },
      {
        id: 'weekly-meal-plans',
        title: 'Ein Essensplan pro Woche',
        description:
          'Vor- und zurückblättern trennt Gerichte sauber nach Kalenderwoche. Bestehende Einträge bleiben in der aktuellen Woche sichtbar.'
      },
      {
        id: 'bring-background-sync',
        title: 'Bring! bleibt im Hintergrund aktuell',
        description:
          'Verbundene Listen werden regelmäßig und fehlertolerant abgeglichen. Stundenplan-Farben sind außerdem auf einen Blick deutlicher.'
      },
    ],
    closing:
      'Bestehende Familieninhalte, Bring!-Verbindungen, Essenspläne und Einstellungen bleiben erhalten.',
    localizations: {
      en: {
        eyebrow: 'Calmer planning, easier input',
        title: 'Meal plans and mobile input stay in step',
        intro:
          'Meal plans now distinguish weeks reliably, while mobile forms remain reachable with the keyboard open.',
        highlights: [
          {
            id: 'ios-dialog-viewport',
            title: 'Forms stay reachable on iPhone',
            description:
              'Quick Add and family settings follow the visible viewport, so the keyboard no longer shifts the page behind them.'
          },
          {
            id: 'weekly-meal-plans',
            title: 'One meal plan per week',
            description:
              'Moving back and forward keeps dishes separated by calendar week. Existing entries remain visible in the current week.'
          },
          {
            id: 'bring-background-sync',
            title: 'Bring! stays current in the background',
            description:
              'Connected lists sync regularly with failure isolation. Timetable subject colours are also clearer at a glance.'
          },
        ],
        closing:
          'Existing family content, Bring! connections, meal plans and settings remain intact.'
      },
      zh: {
        eyebrow: '更从容的计划，更轻松的输入',
        title: '备餐计划与手机输入齐头并进',
        intro:
          '备餐计划现在能可靠区分周次，键盘弹出时手机端表单依然可用。',
        highlights: [
          {
            id: 'ios-dialog-viewport',
            title: 'iPhone 上表单依然触手可及',
            description:
              '快捷添加和家庭设置会跟随可视区域，键盘弹出时不再把页面挤到背后。'
          },
          {
            id: 'weekly-meal-plans',
            title: '每周一份备餐计划',
            description:
              '前后切换时菜品按自然周区分，现有条目仍保留在本周可见。'
          },
          {
            id: 'bring-background-sync',
            title: 'Bring! 在后台保持同步',
            description:
              '已连接的清单会定期同步并隔离失败。课程表科目颜色也更一目了然。'
          },
        ],
        closing:
          '现有家庭内容、Bring! 连接、备餐计划和设置保持不变。'
      }
    }
  },
  '1.21.1': {
    version: '1.21.1',
    eyebrow: 'Sicherheitsupdate für externe Dienste',
    title: 'Rezept, Kalender und Cloud sind jetzt besser geschützt',
    intro:
      'Externe Servernamen werden vor dem Verbinden geprüft und die Verbindung bleibt danach an die geprüfte Adresse gebunden.',
    highlights: [
      {
        id: 'pinned-outbound-connections',
        title: 'Geschützte externe Abrufe',
        description:
          'Rezeptseiten und Bilder werden nur noch über die zuvor geprüfte Serveradresse geladen. Weiterleitungen werden erneut geprüft.'
      },
      {
        id: 'safer-cloud-and-calendar-sync',
        title: 'Cloud und Kalender im gleichen Schutz',
        description:
          'Kalender-Feeds, WebDAV, CalDAV und Nextcloud nutzen nun denselben geschützten Verbindungsweg – auch bei Synology.'
      },
    ],
    closing:
      'Deine bestehenden Kalender, Cloud-Verbindungen, Familieninhalte und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'Security update for external services',
        title: 'Recipes, calendars and cloud connections are better protected',
        intro:
          'External server names are verified before connecting, and each connection stays bound to the verified address.',
        highlights: [
          {
            id: 'pinned-outbound-connections',
            title: 'Protected external downloads',
            description:
              'Recipe pages and images are only loaded through the previously verified server address. Redirects are checked again.'
          },
          {
            id: 'safer-cloud-and-calendar-sync',
            title: 'Cloud and calendars use the same protection',
            description:
              'Calendar feeds, WebDAV, CalDAV and Nextcloud now share the protected connection path, including Synology.'
          },
        ],
        closing:
          'Your existing calendars, cloud connections, family content and settings remain unchanged.'
      },
      zh: {
        eyebrow: '外部服务安全更新',
        title: '食谱、日历和云连接得到更好保护',
        intro:
          '连接前会先验证外部服务器名称，每个连接保持绑定到已验证的地址。',
        highlights: [
          {
            id: 'pinned-outbound-connections',
            title: '受保护的外部下载',
            description:
              '食谱页面和图片仅通过之前验证过的服务器地址加载，重定向会再次检查。'
          },
          {
            id: 'safer-cloud-and-calendar-sync',
            title: '云与日历同享保护',
            description:
              '日历订阅、WebDAV、CalDAV 和 Nextcloud 现共用受保护的连接通道，包括群晖。'
          },
        ],
        closing:
          '现有日历、云连接、家庭内容和设置保持不变。'
      }
    }
  },
  '1.21.0': {
    version: '1.21.0',
    eyebrow: 'Mehr Überblick im Stundenplan',
    title: 'Fächer sind jetzt sofort besser erkennbar',
    intro:
      'Jedes Fach kann seine eigene Farbe behalten – sichtbar genug für den schnellen Blick, aber weiterhin angenehm ruhig.',
    highlights: [
      {
        id: 'timetable-subject-colours',
        title: 'Eine Farbe pro Fach',
        description:
          'Eine ausgewählte Fachfarbe gilt im Stundenplan eines Kindes für alle Stunden dieses Fachs. Die Palette bietet sechzehn abgestimmte Farben.'
      },
      {
        id: 'timetable-colour-visibility',
        title: 'Klarer sehen, ohne bunte Blöcke',
        description:
          'Farbstreifen, passender Rahmen und eine leichte Tönung machen Fächer schneller unterscheidbar. Der Plan bleibt dabei gut lesbar.'
      },
    ],
    closing:
      'Bestehende Stunden, Fachfarben, Termine und Kinderprofile bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'A clearer timetable at a glance',
        title: 'Subjects are now much easier to recognise',
        intro:
          'Each subject can keep its own colour – visible enough for a quick glance while the timetable stays calm.',
        highlights: [
          {
            id: 'timetable-subject-colours',
            title: 'One colour per subject',
            description:
              'A chosen subject colour applies to every lesson of that subject in a child’s timetable. The palette offers sixteen curated choices.'
          },
          {
            id: 'timetable-colour-visibility',
            title: 'Clearer, without colour blocks',
            description:
              'A colour edge, matching outline and light tint make subjects faster to distinguish while the timetable remains easy to read.'
          },
        ],
        closing:
          'Existing lessons, subject colours, events and child profiles remain unchanged.'
      },
      zh: {
        eyebrow: '课程表一目了然',
        title: '科目现在好认多了',
        intro:
          '每个科目都可以有自己的颜色——一眼可辨，课程表依然简洁。',
        highlights: [
          {
            id: 'timetable-subject-colours',
            title: '一科一色',
            description:
              '选定的科目颜色会应用到孩子课程表中该科目的所有课程，调色板提供十六种精选配色。'
          },
          {
            id: 'timetable-colour-visibility',
            title: '更清晰，不再用色块',
            description:
              '色条、配套描边与浅底色让科目更快区分，课程表依然清晰易读。'
          },
        ],
        closing:
          '现有课程、科目颜色、日程和孩子档案保持不变。'
      }
    }
  },
  '1.20.3': {
    version: '1.20.3',
    eyebrow: 'Kleiner Einkaufs-Hotfix',
    title: 'Der Einkauf ist auf einen Blick verständlich',
    intro:
      'Typische Lebensmittel und Haushaltsartikel erhalten passende Symbole, damit die Liste schneller lesbar wird.',
    highlights: [
      {
        id: 'shopping-product-icons',
        title: 'Passende Symbole für typische Produkte',
        description:
          'Eier, Butter, Milch, Käse, Brot, Obst, Gemüse, Nudeln, Getränke und Haushaltsartikel sind an eigenen Symbolen erkennbar.'
      },
      {
        id: 'shopping-icons-everywhere',
        title: 'Überall gleich gut erkennbar',
        description:
          'Katalog, Einkaufsliste, Dashboard und Küchenansicht verwenden dieselbe Produktzuordnung. Eigene Symbole bleiben erhalten.'
      },
    ],
    closing:
      'Einkaufslisten, Mengen, Kategorien und bewusst vergebene eigene Symbole bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'A small shopping hotfix',
        title: 'Shopping is easier to scan at a glance',
        intro:
          'Common food and household items now receive fitting icons, making the list faster to read.',
        highlights: [
          {
            id: 'shopping-product-icons',
            title: 'Fitting icons for common products',
            description:
              'Eggs, butter, milk, cheese, bread, fruit, vegetables, pasta, drinks and household supplies each have recognisable icons.'
          },
          {
            id: 'shopping-icons-everywhere',
            title: 'Consistent everywhere',
            description:
              'The catalog, shopping list, dashboard and kitchen display use the same product mapping. Custom icons stay untouched.'
          },
        ],
        closing:
          'Shopping lists, quantities, categories and intentional custom icons remain unchanged.'
      },
      zh: {
        eyebrow: '购物小修补',
        title: '购物清单一眼扫清',
        intro:
          '常用食品和日用品现在有了贴切的图标，清单更快扫读。',
        highlights: [
          {
            id: 'shopping-product-icons',
            title: '常用商品配上贴切图标',
            description:
              '鸡蛋、黄油、牛奶、奶酪、面包、水果、蔬菜、意面、饮料和日用品各有易认的图标。'
          },
          {
            id: 'shopping-icons-everywhere',
            title: '处处一致',
            description:
              '商品目录、购物清单、仪表盘和厨房显示屏使用同一套商品映射，自定义图标不受影响。'
          },
        ],
        closing:
          '购物清单、数量、分类和自定义图标保持不变。'
      }
    }
  },
  '1.20.2': {
    version: '1.20.2',
    eyebrow: 'Kleiner Android-Hotfix',
    title: 'Die Familienreise bleibt vollständig im Blick',
    intro:
      'Auf dem Handy sind jetzt alle Bereiche der Familienreise sofort sichtbar und bequem antippbar.',
    highlights: [
      {
        id: 'mobile-family-journey-menu',
        title: 'Alle Bereiche ohne Seitwärts-Suchen',
        description:
          'Wochenblick, Routinen, Taschengeld, Schule, Telefonbuch, Abstimmen und Sicherheit liegen als kompaktes Zwei-Zeilen-Menü vor.'
      },
      {
        id: 'mobile-family-journey-touch-targets',
        title: 'Leicht auf dem Handy bedienen',
        description:
          'Die Navigation bleibt beim Scrollen erreichbar und bietet für jeden Bereich eine ausreichend große Touch-Fläche.'
      },
    ],
    closing:
      'Alle Familieninhalte, Fächer, Kontakte, Termine und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'A small Android hotfix',
        title: 'The Family Journey stays fully in view',
        intro:
          'Every Family Journey area is now immediately visible and easy to tap on a phone.',
        highlights: [
          {
            id: 'mobile-family-journey-menu',
            title: 'Every area without sideways searching',
            description:
              'Weekly view, routines, pocket money, school, phone book, polls and safety are arranged in a compact two-row menu.'
          },
          {
            id: 'mobile-family-journey-touch-targets',
            title: 'Easy to use on a phone',
            description:
              'The navigation remains available while scrolling and gives every area a sufficiently large touch target.'
          },
        ],
        closing:
          'All family content, subjects, contacts, events and settings remain unchanged.'
      },
      zh: {
        eyebrow: 'Android 小修补',
        title: 'Family Journey 全景尽收',
        intro:
          'Family Journey 的每个板块现在在手机上一目了然、轻点可达。',
        highlights: [
          {
            id: 'mobile-family-journey-menu',
            title: '每个板块无需横滑寻找',
            description:
              '周视图、日常习惯、零花钱、学校、电话簿、投票和安全以紧凑的两行菜单呈现。'
          },
          {
            id: 'mobile-family-journey-touch-targets',
            title: '手机上更好用',
            description:
              '滚动时导航保持可用，每个板块都有足够大的触控区域。'
          },
        ],
        closing:
          '所有家庭内容、科目、联系人、日程和设置保持不变。'
      }
    }
  },
  '1.20.1': {
    version: '1.20.1',
    eyebrow: 'Kleines Update für einen klaren Familienalltag',
    title: 'Telefonbuch und Stundenplan sind jetzt aufgeräumter',
    intro:
      'Wichtige Kontakte liegen direkt bei eurer Familie, und der Stundenplan bleibt auch mit Farben angenehm ruhig.',
    highlights: [
      {
        id: 'family-phone-book',
        title: 'Telefonbuch direkt in LX',
        description:
          'Eltern können wichtige Kontakte wie Schule, Arztpraxis, Notfallnummern und Dienstleistungen mit Telefon, E-Mail, Adresse und Notiz zentral hinterlegen.'
      },
      {
        id: 'timetable-colour-system',
        title: 'Ruhige Fächerfarben',
        description:
          'Der Stundenplan nutzt eine abgestimmte, professionelle Farbpalette. Farben setzen nur kleine Akzente und lenken nicht vom Unterricht ab.'
      },
      {
        id: 'safe-subject-colours',
        title: 'Einheitlich auf jedem Gerät',
        description:
          'Neue Fächerfarben werden vom Server auf die feste Palette geprüft. So bleibt der Stundenplan bei allen Familienmitgliedern klar und konsistent.'
      },
    ],
    closing:
      'Bestehende Kontakte, Fächer, Termine, Profile und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'A small update for a clearer family day',
        title: 'The phone book and timetable are now tidier',
        intro:
          'Important contacts now live right with your family, while the timetable stays calm even with colours.',
        highlights: [
          {
            id: 'family-phone-book',
            title: 'Phone book directly in LX',
            description:
              'Parents can keep important contacts such as schools, doctors, emergency numbers and services with their phone, email, address and notes in one place.'
          },
          {
            id: 'timetable-colour-system',
            title: 'Calm subject colours',
            description:
              'The timetable uses a refined, professional colour palette. Colours add small accents without distracting from lessons.'
          },
          {
            id: 'safe-subject-colours',
            title: 'Consistent on every device',
            description:
              'The server validates new subject colours against the fixed palette, keeping the timetable clear and consistent for every family member.'
          },
        ],
        closing:
          'Existing contacts, subjects, events, profiles and settings remain unchanged.'
      },
      zh: {
        eyebrow: '小更新，家庭日更清晰',
        title: '电话簿和课程表更整洁了',
        intro:
          '重要联系人现在就在家人身边，课程表即使加了颜色也依然清爽。',
        highlights: [
          {
            id: 'family-phone-book',
            title: '电话簿直接放进 LX',
            description:
              '家长可以把学校、医生、急救电话和各类服务等重要联系人的电话、邮箱、地址和备注统一存放。'
          },
          {
            id: 'timetable-colour-system',
            title: '柔和的科目配色',
            description:
              '课程表采用精致专业的配色，颜色只作点缀，不会喧宾夺主。'
          },
          {
            id: 'safe-subject-colours',
            title: '每台设备都一致',
            description:
              '服务器会按固定调色板校验新增的科目颜色，让每位家庭成员看到的课程表都清晰一致。'
          },
        ],
        closing:
          '现有联系人、科目、日程、档案和设置保持不变。'
      }
    }
  },
  '1.20.0': {
    version: '1.20.0',
    eyebrow: 'Sicher umziehen, entspannt wiederherstellen',
    title: 'Eure Familie zieht jetzt geschützt mit um',
    intro:
      'Eine Familie kann als verschlüsselte Datei auf einen neuen, leeren LX-Family-Server umziehen. Im Alltag hilft zusätzlich der neue Papierkorb.',
    highlights: [
      {
        id: 'encrypted-family-transfer',
        title: 'Familie sicher umziehen',
        description:
          'Profile, PINs, Kalender, Aufgaben, Notizen, Rezepte, lokale Rezeptbilder und Papierkorb reisen passwortgeschützt mit. Server- und Geräteverbindungen verbindet ihr am neuen Ort bewusst neu.'
      },
      {
        id: 'family-recycle-bin',
        title: 'Einzelne Dinge zurückholen',
        description:
          'Gelöschte Termine, Aufgaben, Notizen, Mahlzeiten, Rezepte, Einkaufs- und Chat-Einträge liegen zuerst im Familienpapierkorb und können gezielt wiederhergestellt werden.'
      },
      {
        id: 'calendar-range-selection',
        title: 'Termine direkt aus der Woche',
        description:
          'Ein Klick auf freie Zeit startet einen 30-Minuten-Termin. Einen Zeitraum aufziehen übernimmt genau diese Zeit in die Eingabe.'
      },
    ],
    closing:
      'Alle bestehenden Familieninhalte bleiben erhalten. Für einen Umzug werden externe Verbindungen auf dem neuen Server neu eingerichtet.',
    localizations: {
      en: {
        eyebrow: 'Move safely, restore calmly',
        title: 'Your family can now move securely',
        intro:
          'A family can move to a new, empty LX Family server in an encrypted file. The new recycle bin also helps in everyday life.',
        highlights: [
          {
            id: 'encrypted-family-transfer',
            title: 'Move a family safely',
            description:
              'Profiles, PINs, calendars, tasks, notes, recipes, local recipe images and the recycle bin travel in a password-protected file. Server and device connections are deliberately set up again at the new location.'
          },
          {
            id: 'family-recycle-bin',
            title: 'Bring back individual items',
            description:
              'Deleted events, tasks, notes, meals, recipes, shopping and chat entries first go to the family recycle bin and can be restored individually.'
          },
          {
            id: 'calendar-range-selection',
            title: 'Create events right from the week',
            description:
              'A click on free time starts a 30-minute event. Dragging a time span applies that exact time to the form.'
          },
        ],
        closing:
          'All existing family content remains intact. External connections are set up again on the new server when moving.'
      },
      zh: {
        eyebrow: '安全迁移，从容恢复',
        title: '全家现在可以安全搬家了',
        intro:
          '一家人可以通过加密文件迁移到全新的 LX Family 服务器，新回收站也在日常生活中派上用场。',
        highlights: [
          {
            id: 'encrypted-family-transfer',
            title: '安全搬家一家人',
            description:
              '档案、PIN 码、日历、任务、笔记、食谱、本地食谱图片和回收站都装进密码保护的文件迁移，服务器和设备连接在新位置有意重新设置。'
          },
          {
            id: 'family-recycle-bin',
            title: '单个条目也可找回',
            description:
              '删除的日程、任务、笔记、餐食、食谱、购物和聊天记录先进入家庭回收站，可单独恢复。'
          },
          {
            id: 'calendar-range-selection',
            title: '直接在周视图创建日程',
            description:
              '点击空闲时段即可创建 30 分钟日程，拖选时间段则按该时段填入表单。'
          },
        ],
        closing:
          '现有家庭内容完整保留。迁移到新服务器后，外部连接需要重新设置。'
      }
    }
  },
  '1.19.6': {
    version: '1.19.6',
    eyebrow: 'Kleiner Einstellungs-Hotfix',
    title: 'Ntfy-Einstellungen ohne Browserfehler',
    intro:
      'Die Elternzentrale bleibt beim Einrichten von ntfy jetzt auch in modernen Browsern ruhig und fehlerfrei.',
    highlights: [
      {
        id: 'ntfy-topic-validation',
        title: 'Thema sicher geprüft',
        description:
          'Ntfy-Themen mit Buchstaben, Zahlen, Unterstrichen und Bindestrichen werden wieder sauber im Browser geprüft.'
      },
    ],
    closing:
      'Deine Benachrichtigungseinstellungen und alle Familieninhalte bleiben unverändert.',
    localizations: {
      en: {
        eyebrow: 'A small settings hotfix',
        title: 'ntfy settings without browser errors',
        intro:
          'The parent hub now stays calm and error-free when setting up ntfy in modern browsers.',
        highlights: [
          {
            id: 'ntfy-topic-validation',
            title: 'Topics validated safely',
            description:
              'ntfy topics with letters, numbers, underscores and hyphens are once again checked cleanly in the browser.'
          },
        ],
        closing:
          'Your notification settings and all family content remain unchanged.'
      },
      zh: {
        eyebrow: '设置小修补',
        title: 'ntfy 设置不再报浏览器错误',
        intro:
          '在现代浏览器中设置 ntfy 时，家长中心现在稳定无错。',
        highlights: [
          {
            id: 'ntfy-topic-validation',
            title: '主题名安全校验',
            description:
              '含字母、数字、下划线和连字符的 ntfy 主题名又能在浏览器中正常校验了。'
          },
        ],
        closing:
          '通知设置和所有家庭内容保持不变。'
      }
    }
  },
  '1.19.5': {
    version: '1.19.5',
    eyebrow: 'Kleiner Kalender-Hotfix',
    title: 'Der Wochenkalender scrollt wieder',
    intro:
      'In der Android-App lässt sich die Wochenansicht wieder ganz normal nach oben und unten bewegen.',
    highlights: [
      {
        id: 'android-week-scroll',
        title: 'Vertikal wieder frei',
        description:
          'Wischen im Wochenkalender scrollt wieder die ganze Seite. Die Wochenspalten bleiben bei Bedarf seitlich beweglich.'
      },
    ],
    closing:
      'Keine Termine, Quellen oder Einstellungen werden dabei verändert.',
    localizations: {
      en: {
        eyebrow: 'A small calendar hotfix',
        title: 'The weekly calendar scrolls again',
        intro:
          'The weekly view in the Android app can once again move normally up and down.',
        highlights: [
          {
            id: 'android-week-scroll',
            title: 'Vertical scrolling is free again',
            description:
              'Swiping in the weekly calendar scrolls the whole page again. Day columns remain horizontally movable when needed.'
          },
        ],
        closing:
          'No events, sources or settings are changed.'
      },
      zh: {
        eyebrow: '日历小修补',
        title: '周历又能滑动了',
        intro:
          'Android 应用的周视图又可以正常上下滚动了。',
        highlights: [
          {
            id: 'android-week-scroll',
            title: '纵向滚动恢复自由',
            description:
              '周历滑动时又可以整页滚动，需要时日期列仍可横向移动。'
          },
        ],
        closing:
          '日程、来源和设置均不受影响。'
      }
    }
  },
  '1.19.4': {
    version: '1.19.4',
    eyebrow: 'Kalender, der mit euch mitgeht',
    title: 'Mehr Überblick für volle Familientage',
    intro:
      'Der Wochenkalender zeigt den ganzen Tag und bleibt auch bei mehreren gleichzeitigen Terminen verständlich.',
    highlights: [
      {
        id: 'calendar-timeline',
        title: 'Alles zur richtigen Zeit',
        description:
          'Die Zeitachse reicht jetzt von Mitternacht bis Mitternacht. Überlappende Termine bleiben auf ihrer tatsächlichen Uhrzeit und sind seitlich klar voneinander getrennt.'
      },
      {
        id: 'calendar-sources-and-export',
        title: 'Kalender passend teilen',
        description:
          'Kalenderquellen lassen sich für mehrere ausgewählte Profile freigeben. Farbhinweise und vollständige ICS-Endzeiten machen den Überblick noch klarer.'
      },
    ],
    closing:
      'Deine bestehenden Termine, Kalenderquellen, Familienprofile und Sicherungen bleiben erhalten.',
    localizations: {
      en: {
        eyebrow: 'A calendar that moves with you',
        title: 'More clarity for busy family days',
        intro:
          'The weekly calendar shows the whole day and stays understandable even when several events happen at once.',
        highlights: [
          {
            id: 'calendar-timeline',
            title: 'Everything at the right time',
            description:
              'The timeline now runs from midnight to midnight. Overlapping events stay at their real time and are clearly separated horizontally.'
          },
          {
            id: 'calendar-sources-and-export',
            title: 'Share calendars precisely',
            description:
              'Calendar sources can be shared with several selected profiles. Colour hints and complete ICS end values make planning clearer.'
          },
        ],
        closing:
          'Your existing events, calendar sources, family profiles and backups stay intact.'
      },
      zh: {
        eyebrow: '与你同行的日历',
        title: '让忙碌的家庭日更清晰',
        intro:
          '周历展示全天，即使多个日程同时发生也依然清晰。',
        highlights: [
          {
            id: 'calendar-timeline',
            title: '一切都在对的时间',
            description:
              '时间轴现在从午夜到午夜，重叠日程保持在真实时间并横向清晰分隔。'
          },
          {
            id: 'calendar-sources-and-export',
            title: '精准分享日历',
            description:
              '日历来源可分享给选定的多个档案，颜色提示和完整的 ICS 结束值让计划更清晰。'
          },
        ],
        closing:
          '现有日程、日历来源、家庭档案和备份保持不变。'
      }
    }
  },
  '1.19.3': {
    version: '1.19.3',
    eyebrow: 'Termine, die mitdenken',
    title: 'Wiederkehrende Termine sind jetzt wirklich wiederkehrend',
    intro:
      'Ein Fußballtraining am Montag oder der Musikunterricht am Donnerstag muss nur noch einmal eingetragen werden.',
    highlights: [
      {
        id: 'recurring-family-events',
        title: 'Einmal anlegen, automatisch wiedersehen',
        description:
          'Eigene Termine können täglich, wöchentlich, monatlich, jährlich oder in deinem eigenen Rhythmus wiederholt werden.'
      },
      {
        id: 'recurring-event-reminders',
        title: 'Erinnerungen für jedes einzelne Mal',
        description:
          'Die gewählten Erinnerungen gelten für jedes Vorkommen der Serie. Ein Enddatum ist optional.'
      },
    ],
    closing:
      'Eine Terminserie bleibt ein einziger aufgeräumter Eintrag. Änderungen und Löschen gelten bewusst für die ganze Serie.',
    localizations: {
      en: {
        eyebrow: 'Events that keep up',
        title: 'Recurring events now really recur',
        intro:
          'A Monday football practice or Thursday music lesson only needs to be added once.',
        highlights: [
          {
            id: 'recurring-family-events',
            title: 'Add it once, see it automatically',
            description:
              'Your own events can repeat daily, weekly, monthly, yearly or on a custom schedule.'
          },
          {
            id: 'recurring-event-reminders',
            title: 'Reminders for every occurrence',
            description:
              'Your selected reminders apply to every occurrence in the series. An end date is optional.'
          },
        ],
        closing:
          'An event series stays one tidy entry. Editing and deleting deliberately affect the complete series.'
      },
      zh: {
        eyebrow: '跟得上的日程',
        title: '循环日程现在真的循环了',
        intro:
          '周一的足球训练或周四的音乐课只需添加一次。',
        highlights: [
          {
            id: 'recurring-family-events',
            title: '添加一次，自动呈现',
            description:
              '自己的日程可以按天、按周、按月、按年或自定义节奏重复。'
          },
          {
            id: 'recurring-event-reminders',
            title: '每次都有提醒',
            description:
              '所选提醒适用于序列中的每一次出现，结束日期可选。'
          },
        ],
        closing:
          '日程序列始终是一条整洁的条目，编辑和删除有意作用于整个序列。'
      }
    }
  },
  '1.19.2': {
    version: '1.19.2',
    eyebrow: 'Mehr Übersicht, weniger Reibung',
    title: 'Der Familienkalender wird klarer und verlässlicher',
    intro:
      'Termine, Navigation und Backups sind jetzt so angeordnet, dass sie im Familienalltag schneller erfassbar und sicherer bedienbar bleiben.',
    highlights: [
      {
        id: 'calendar-stacks-and-colours',
        title: 'Ein Kalender, der Familien auf einen Blick trennt',
        description:
          'Zeitgleiche Termine bleiben lesbar in einer Tageszelle. Familientermine haben eine feste Farbe, persönliche Termine die Farbe des jeweiligen Profils.'
      },
      {
        id: 'backup-and-connections',
        title: 'Sicherungen und freie Server-Verbindungen',
        description:
          'Geprüfte Datenbanksicherungen lassen sich planen und geschützt zurückspielen. Optionaler Zwei-Wege-CalDAV und eigenes WebDAV ergänzen Kalender und Familienarchiv.'
      },
    ],
    closing:
      'Familien, Profile, Termine, Aufgaben, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'More overview, less friction',
        title: 'The family calendar becomes clearer and more reliable',
        intro:
          'Events, navigation and backups are now arranged to stay easier to scan and safer to use in everyday family life.',
        highlights: [
          {
            id: 'calendar-stacks-and-colours',
            title: 'A calendar that separates family life at a glance',
            description:
              'Concurrent events stay readable in one day column. Family events use one fixed colour, while personal events use the assigned profile colour.'
          },
          {
            id: 'backup-and-connections',
            title: 'Backups and flexible server connections',
            description:
              'Verified database backups can be scheduled and restored safely. Optional two-way CalDAV and personal WebDAV complement the calendar and family archive.'
          },
        ],
        closing:
          'Families, profiles, events, chores, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '更多总览，更少摩擦',
        title: '家庭日历更清晰、更可靠',
        intro:
          '日程、导航和备份重新排布，日常家庭使用更易扫读、更安心。',
        highlights: [
          {
            id: 'calendar-stacks-and-colours',
            title: '一眼区分家庭生活的日历',
            description:
              '并发日程在单日列中依然易读，家庭日程用固定色，个人日程用各自档案色。'
          },
          {
            id: 'backup-and-connections',
            title: '备份与灵活的服务器连接',
            description:
              '经过验证的数据库备份可定时执行并安全恢复，可选的双向 CalDAV 和个人 WebDAV 让日历与家庭档案更完整。'
          },
        ],
        closing:
          '家庭、档案、日程、家务、文件和设置保持不变。'
      }
    }
  },
  '1.19.1': {
    version: '1.19.1',
    eyebrow: 'Kleines Update, viel mehr Ruhe',
    title: 'Der Stundenplan wird zum echten Wochenplan',
    intro:
      'Der Stundenplan ist jetzt klarer, vertrauter und deutlich ruhiger zu bedienen. Alle bisherigen Stunden bleiben genau erhalten.',
    highlights: [
      {
        id: 'timetable-grid',
        title: 'Eine Woche auf einen Blick',
        description:
          'Stunden stehen links, die Wochentage oben. Fächer liegen sauber im gewohnten Stundenplan-Raster statt in einzelnen Tageslisten.'
      },
    ],
    closing:
      'Bestehende Stunden, Termine, Aufgaben, Profile, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'A small update with much more calm',
        title: 'The timetable is now a real weekly plan',
        intro:
          'The timetable is clearer, more familiar and much calmer to use. Every existing lesson stays exactly where it was.',
        highlights: [
          {
            id: 'timetable-grid',
            title: 'The whole week at a glance',
            description:
              'Periods stay on the left and weekdays along the top. Subjects now sit in a familiar timetable grid instead of separate daily lists.'
          },
        ],
        closing:
          'Existing lessons, events, chores, profiles, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '小更新，大从容',
        title: '课程表现在是真正的周计划了',
        intro:
          '课程表更清晰、更熟悉，用起来也更从容，所有现有课程都原位不动。',
        highlights: [
          {
            id: 'timetable-grid',
            title: '一周全貌尽收眼底',
            description:
              '节次在左、周几在上，科目现在以熟悉的课程表网格呈现，不再是分开的日列表。'
          },
        ],
        closing:
          '现有课程、日程、家务、档案、文件和设置保持不变。'
      }
    }
  },
  '1.19.0': {
    version: '1.19.0',
    eyebrow: 'Mehr Schule, Kalender und Alltag',
    title: 'Stundenplan, CalDAV und flexiblere Aufgaben sind da',
    intro:
      'Kinder bekommen einen echten Stundenplan, externe Kalender lassen sich anbinden und wiederkehrende Aufgaben passen sich besser an euren Alltag an.',
    highlights: [
      {
        id: 'school-timetable',
        title: 'Ein richtiger Wochenstundenplan',
        description:
          'Fächer, Räume, Lehrkräfte und Unterrichtszeiten lassen sich direkt im Kinderprofil eintragen und übersichtlich anzeigen.'
      },
      {
        id: 'caldav-calendar-import',
        title: 'Kalender per CalDAV verbinden',
        description:
          'Externe Kalender werden schreibgeschützt eingebunden. Auch offizielle Synology-Konto-Adressen werden automatisch erkannt.'
      },
      {
        id: 'flexible-recurring-chores',
        title: 'Aufgaben, die passend wiederkehren',
        description:
          'Aufgaben können täglich, an ausgewählten Wochentagen, wöchentlich oder monatlich erscheinen – auf Wunsch erst am Fälligkeitstag.'
      },
      {
        id: 'ios-mobile-navigation',
        title: 'LX wie eine App auf iOS',
        description:
          'Safari erklärt die Installation auf dem Home-Bildschirm. Navigation, Kalenderaktionen und Dialoge bleiben auch auf schmalen Geräten erreichbar.'
      },
    ],
    closing:
      'Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'More school, calendars and everyday life',
        title: 'Timetables, CalDAV and flexible chores are here',
        intro:
          'Children get a real timetable, external calendars can be connected, and recurring chores adapt better to family life.',
        highlights: [
          {
            id: 'school-timetable',
            title: 'A real weekly timetable',
            description:
              'Subjects, rooms, teachers and lesson times can be managed directly in the child profile.'
          },
          {
            id: 'caldav-calendar-import',
            title: 'Connect calendars through CalDAV',
            description:
              'External calendars are imported read-only, including automatic discovery from Synology account URLs.'
          },
          {
            id: 'flexible-recurring-chores',
            title: 'Chores that recur when needed',
            description:
              'Chores can recur daily, on selected weekdays, weekly or monthly and stay hidden until their due day.'
          },
          {
            id: 'ios-mobile-navigation',
            title: 'LX as an app on iOS',
            description:
              'Safari explains the home screen installation, while navigation, calendar actions and dialogs remain reachable on narrow devices.'
          },
        ],
        closing:
          'Families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '更多学校、日历和日常生活',
        title: '课程表、CalDAV 和灵活家务来了',
        intro:
          '孩子们有了真正的课程表，外部日历可以接入，循环家务也更贴合家庭生活。',
        highlights: [
          {
            id: 'school-timetable',
            title: '真正的周课程表',
            description:
              '科目、教室、老师和上课时间可直接在孩子档案中管理。'
          },
          {
            id: 'caldav-calendar-import',
            title: '通过 CalDAV 连接日历',
            description:
              '外部日历以只读方式导入，支持从群晖账号 URL 自动发现。'
          },
          {
            id: 'flexible-recurring-chores',
            title: '按需重复的家务',
            description:
              '家务可以按天、按选定周几、按周或按月重复，到期前保持隐藏。'
          },
          {
            id: 'ios-mobile-navigation',
            title: 'LX 以应用形式登录 iOS',
            description:
              'Safari 中有主屏幕安装说明，窄屏设备上的导航、日历操作和对话框依然触手可及。'
          },
        ],
        closing:
          '家庭、档案、日程、家务、食谱、文件和设置保持不变。'
      }
    }
  },
  '1.18.4': {
    version: '1.18.4',
    eyebrow: 'Kalender, der bei dir bleibt',
    title: 'Deine Ansicht bleibt, dein Handy gewinnt Platz',
    intro:
      'Die gewählte Kalenderansicht bleibt nun erhalten. Gleichzeitig ist LX Family auf dem Smartphone dichter und die Müll-Kachel zeigt die richtigen Tonnen.',
    highlights: [
      {
        id: 'calendar-view-preference',
        title: 'Monatsansicht bleibt ausgewählt',
        description:
          'Wählst du Woche oder Monat, merkt sich LX Family diese Ansicht pro Profil und Gerät – auch nach einem Bereichswechsel.'
      },
      {
        id: 'compact-phone-headers',
        title: 'Mehr Kalender, weniger Kopfbereich',
        description:
          'Die persönliche Übersicht und der Kalender brauchen auf kleinen Bildschirmen deutlich weniger Höhe, ohne dass wichtige Aktionen verloren gehen.'
      },
      {
        id: 'correct-trash-icons',
        title: 'Die richtigen Tonnen im Dashboard',
        description:
          'Die Müll-Kachel übernimmt jetzt die passende Tonne oder alle Tonnen einer gemeinsamen Abholung.'
      },
    ],
    closing:
      'Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'A calendar that stays yours',
        title: 'Your view stays put, your phone gains space',
        intro:
          'Your chosen calendar layout now stays saved. LX Family is also denser on phones, and the waste card shows the right bins.',
        highlights: [
          {
            id: 'calendar-view-preference',
            title: 'Month view stays selected',
            description:
              'When you choose week or month, LX Family remembers that layout per profile and device, even after you navigate elsewhere.'
          },
          {
            id: 'compact-phone-headers',
            title: 'More calendar, less header',
            description:
              'The personal overview and calendar now use substantially less height on small screens without losing important actions.'
          },
          {
            id: 'correct-trash-icons',
            title: 'Correct bins on the dashboard',
            description:
              'The waste card now reflects the correct bin, or every bin in a shared pickup.'
          },
        ],
        closing:
          'Families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '日历永远属于你',
        title: '视图原地不动，手机空间更多',
        intro:
          '您选择的日历布局现在会保存下来。LX Family 在手机上也更紧凑，垃圾回收卡会显示正确的垃圾桶。',
        highlights: [
          {
            id: 'calendar-view-preference',
            title: '月视图保持选中',
            description:
              '选择周视图或月视图后，LX Family 会按成员和设备记住该布局，即使跳转到其他页面也不会丢失。'
          },
          {
            id: 'compact-phone-headers',
            title: '更多日历，更少头部',
            description:
              '个人概览和日历在小屏幕上大幅减少了头部高度，不丢失重要操作。'
          },
          {
            id: 'correct-trash-icons',
            title: '仪表盘上显示正确的垃圾桶',
            description:
              '垃圾卡现在会显示正确的垃圾桶；合并收运时显示全部垃圾桶。'
          },
        ],
        closing:
          '家庭、成员、日程、家务、菜谱、文件和设置均无变化。'
      }
    }
  },
  '1.18.3': {
    version: '1.18.3',
    eyebrow: 'Verlässlichere Server-Updates',
    title: 'Ein Update bleibt auch bei alten Sicherungen stabil',
    intro:
      'LX Family behandelt alte Dateirechte bei Sicherungen jetzt vorsichtiger. Eure Datenprüfung und das gestartete Update bleiben geschützt.',
    highlights: [
      {
        id: 'backup-permission-repair',
        title: 'Alte Sicherungen werden sicher behandelt',
        description:
          'Vor dem Aufräumen startet LX einen frischen Helfer, der Besitzrechte aus älteren Installationen reparieren kann.'
      },
      {
        id: 'healthy-update-kept',
        title: 'Erfolgreiche Updates bleiben aktiv',
        description:
          'Kann eine alte Sicherung nicht entfernt werden, behält LX vorsichtshalber alle Sicherungen. Das geprüfte Update wird nicht mehr deshalb zurückgesetzt.'
      },
    ],
    closing:
      'Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'More reliable server updates',
        title: 'Updates stay stable with legacy backups',
        intro:
          'LX Family now handles legacy backup permissions more carefully while keeping your data check and successful update protected.',
        highlights: [
          {
            id: 'backup-permission-repair',
            title: 'Legacy backups are handled safely',
            description:
              'Before cleanup, LX starts a fresh helper that can repair ownership inherited from older installations.'
          },
          {
            id: 'healthy-update-kept',
            title: 'Successful updates stay active',
            description:
              'If an old backup cannot be removed, LX keeps every backup as a precaution. A verified update is no longer rolled back for that reason.'
          },
        ],
        closing:
          'Families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '更可靠的服务器更新',
        title: '有旧备份也不影响更新稳定',
        intro:
          'LX Family 现在更谨慎地处理旧备份的权限，同时保护您的数据校验和成功更新。',
        highlights: [
          {
            id: 'backup-permission-repair',
            title: '安全处理旧备份',
            description:
              '清理之前，LX 会启动一个全新的助手进程，修复继承自旧安装的所有权问题。'
          },
          {
            id: 'healthy-update-kept',
            title: '成功的更新保持生效',
            description:
              '如果旧备份无法删除，LX 会出于谨慎保留所有备份。已验证的更新不再因此回滚。'
          },
        ],
        closing:
          '家庭、成员、日程、家务、菜谱、文件和设置均无变化。'
      }
    }
  },
  '1.18.2': {
    version: '1.18.2',
    eyebrow: 'Android-Verbindung & Heimserver-Stores',
    title: 'Dein Familienserver bleibt verbunden',
    intro:
      'Die Android-App merkt sich den ausgewählten LX-Family-Server jetzt dauerhaft. Außerdem lässt sich LX Family leichter und sicherer auf weiteren Heimserver-Plattformen installieren.',
    highlights: [
      {
        id: 'native-server-persistence',
        title: 'Serveradresse bleibt nach App-Updates erhalten',
        description:
          'Die App speichert die Adresse zusätzlich direkt in Android und lädt sie schon vor dem App-Start. Eine bereits vorhandene Einstellung wird automatisch übernommen.'
      },
      {
        id: 'secure-docker-bootstrap',
        title: 'Sicherer Docker-Erststart',
        description:
          'Fehlt bei einer neuen Installation der Sicherheitsschlüssel, erzeugt und speichert LX Family ihn automatisch im geschützten Datenordner.'
      },
      {
        id: 'casaos-cosmos',
        title: 'Bereit für CasaOS, ZimaOS und Cosmos',
        description:
          'Neue Installationspakete mit App-Texten, Icons und Screenshots bereiten LX Family für weitere Heimserver-Stores vor.'
      },
    ],
    closing:
      'Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'Android connection & home-server stores',
        title: 'Your family server stays connected',
        intro:
          'The Android app now remembers the selected LX Family server persistently. LX Family is also easier and safer to install on more home-server platforms.',
        highlights: [
          {
            id: 'native-server-persistence',
            title: 'The server address survives app updates',
            description:
              'The app stores the address directly in Android and restores it before startup. An existing setting migrates automatically.'
          },
          {
            id: 'secure-docker-bootstrap',
            title: 'Secure first Docker start',
            description:
              'If a new installation has no application secret, LX Family creates one and stores it safely in the persistent data folder.'
          },
          {
            id: 'casaos-cosmos',
            title: 'Ready for CasaOS, ZimaOS and Cosmos',
            description:
              'New installation packages with store copy, icons and screenshots prepare LX Family for more home-server stores.'
          },
        ],
        closing:
          'Families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '安卓连接与家庭服务器应用商店',
        title: '您的家庭服务器保持连接',
        intro:
          '安卓 App 现在会持久记住所选的 LX Family 服务器。LX Family 在更多家庭服务器平台上也更易安装、更安全。',
        highlights: [
          {
            id: 'native-server-persistence',
            title: '服务器地址在更新后依然有效',
            description:
              'App 将地址直接存储在安卓系统中，并在启动前恢复。已有设置会自动迁移。'
          },
          {
            id: 'secure-docker-bootstrap',
            title: '安全的首次 Docker 启动',
            description:
              '如果全新安装没有应用密钥，LX Family 会创建一个，并安全地存放在持久数据文件夹中。'
          },
          {
            id: 'casaos-cosmos',
            title: '支持 CasaOS、ZimaOS 与 Cosmos',
            description:
              '全新的安装包（附带商店文案、图标和截图）让 LX Family 适配更多家庭服务器商店。'
          },
        ],
        closing:
          '家庭、成员、日程、家务、菜谱、文件和设置均无变化。'
      }
    }
  },
  '1.18.1': {
    version: '1.18.1',
    eyebrow: 'Willkommen bei LX Family',
    title: 'Aus LX Family Planner wird LX Family',
    intro:
      'LX Family heißt jetzt LX Family · Private Family OS. Der neue Name passt besser zu allem, was euren Alltag gemeinsam organisiert – Kalender, Aufgaben, Rezepte, Cloud, Kinderwelten und mehr.',
    highlights: [
      {
        id: 'lx-family-name',
        title: 'Neuer Name, gleiche vertraute App',
        description:
          'Eure Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert. Auch die Android-App wird wie gewohnt einfach über die vorhandene Installation aktualisiert.'
      },
      {
        id: 'compatible-update',
        title: 'Einfach weiter aktualisieren',
        description:
          'Die vorhandene Android-App kann direkt aktualisiert werden – ohne Neuinstallation und ohne dass eure Familieninhalte verloren gehen.'
      },
    ],
    closing:
      'Danke, dass ihr LX Family in euren Familienalltag holt. Viel Freude mit eurem privaten Family OS!',
    localizations: {
      en: {
        eyebrow: 'Welcome to LX Family',
        title: 'LX Family Planner becomes LX Family',
        intro:
          'LX Family is now called LX Family · Private Family OS. The new name better fits everything that organizes your everyday family life together – calendars, chores, recipes, cloud, child spaces and more.',
        highlights: [
          {
            id: 'lx-family-name',
            title: 'New name, the same familiar app',
            description:
              'Your families, profiles, events, chores, recipes, files and settings stay unchanged. Android updates install over the existing app as usual.'
          },
          {
            id: 'compatible-update',
            title: 'Keep updating with ease',
            description:
              'The existing Android app installs this update directly – with no reinstall and without losing your family content.'
          },
        ],
        closing:
          'Thank you for bringing LX Family into your family life. Enjoy your private Family OS!'
      },
      zh: {
        eyebrow: '欢迎来到 LX Family',
        title: 'LX Family Planner 更名为 LX Family',
        intro:
          'LX Family 现名为「LX Family · 私人家庭操作系统」。新名称更贴合它为全家整理日常的一切——日历、家务、菜谱、云盘、儿童空间等等。',
        highlights: [
          {
            id: 'lx-family-name',
            title: '新名称，一样熟悉的 App',
            description:
              '您的家庭、成员、日程、家务、菜谱、文件和设置保持不变。安卓更新会像往常一样覆盖安装。'
          },
          {
            id: 'compatible-update',
            title: '轻松更新',
            description:
              '现有的安卓 App 可直接安装此更新，无需重装，也不会丢失家庭内容。'
          },
        ],
        closing:
          '感谢您把 LX Family 带入家庭生活。祝您使用愉快，拥有私人的家庭操作系统！'
      }
    }
  },
  '1.18.0': {
    version: '1.18.0',
    eyebrow: 'LX Family, mehr Sprachen & Fehlerkorrekturen',
    title: 'Aus LX Family Planner wird LX Family',
    intro:
      'LX Family heißt ab jetzt Private Family OS. Der neue Name passt besser zu Kalender, Aufgaben, Cloud, Kinderwelten und allem, was euren Alltag gemeinsam organisiert. Die Oberfläche spricht außerdem zusätzlich Französisch, Spanisch, Italienisch, Niederländisch und Polnisch.',
    highlights: [
      {
        id: 'lx-family-name',
        title: 'Neuer Name, gleiche sichere App',
        description:
          'Aus LX Family Planner wird LX Family · Private Family OS. Eure Familien, Daten und Einstellungen bleiben unverändert. Auch Repository, Docker-Image und Android-App-Kennung bleiben absichtlich gleich, damit Updates ohne Neuinstallation funktionieren.'
      },
      {
        id: 'i18n-five-languages',
        title: 'Französisch, Spanisch, Italienisch, Niederländisch, Polnisch',
        description:
          'Die Sprache kann in der Kopfzeile oder vor dem Login gewählt werden. Fehlende Übersetzungen fallen sauber auf Englisch zurück.'
      },
      {
        id: 'dashboard-today-count',
        title: '„Heute im Blick" zeigt nur heute',
        description:
          'Die Zusammenfassung und das Kalender-Badge zählen ab sofort ausschließlich die Termine des aktuellen Tages statt aller anstehenden Termine.'
      },
      {
        id: 'nav-and-studio-fixes',
        title: 'Ruhigere Tab-Leiste und fertiges Ansichtsatelier',
        description:
          'Tabs verschieben sich beim Wechsel nicht mehr, in Firefox bleibt der letzte Tab erreichbar, und das Ansichtsatelier schneidet die Fußzeile nicht mehr ab.'
      },
      {
        id: 'android-back-nav',
        title: 'Android: Zurück bleibt in der App',
        description:
          'Die Hardware-Zurück-Taste und Wischgeste navigiert innerhalb der App zurück, statt sie sofort zu verlassen.'
      },
    ],
    closing:
      'Bestehende Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'LX Family, more languages & bug fixes',
        title: 'LX Family Planner becomes LX Family',
        intro:
          'LX Family is now called Private Family OS. The new name better fits calendars, chores, cloud, child spaces and everything that organizes your family life together. The interface now also speaks French, Spanish, Italian, Dutch and Polish.',
        highlights: [
          {
            id: 'lx-family-name',
            title: 'New name, same safe app',
            description:
              'LX Family Planner becomes LX Family · Private Family OS. Your families, data and settings remain unchanged. The repository, Docker image and Android application id deliberately stay the same so updates work without reinstalling.'
          },
          {
            id: 'i18n-five-languages',
            title: 'French, Spanish, Italian, Dutch, Polish',
            description:
              'Pick the language from the header or before login. Missing translations fall back to English cleanly.'
          },
          {
            id: 'dashboard-today-count',
            title: '“Today at a glance” shows only today',
            description:
              'The summary and calendar badge now count only the current day’s events instead of every upcoming event.'
          },
          {
            id: 'nav-and-studio-fixes',
            title: 'Calmer tab bar and a finished dashboard studio',
            description:
              'Tabs no longer shift when switching, the last tab stays reachable in Firefox, and the studio no longer clips its footer.'
          },
          {
            id: 'android-back-nav',
            title: 'Android: back stays in the app',
            description:
              'The hardware back button and gesture navigate back inside the app instead of exiting it immediately.'
          },
        ],
        closing:
          'Existing families, profiles, events, tasks, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: 'LX Family、更多语言与问题修复',
        title: 'LX Family Planner 更名为 LX Family',
        intro:
          'LX Family 现名为「私人家庭操作系统」。新名称更贴合日历、家务、云盘、儿童空间以及整理家庭生活的一切。界面现在还支持法语、西班牙语、意大利语、荷兰语和波兰语。',
        highlights: [
          {
            id: 'lx-family-name',
            title: '新名称，一样安全的 App',
            description:
              'LX Family Planner 更名为 LX Family · 私人家庭操作系统。您的家庭、数据和设置保持不变。仓库、Docker 镜像和安卓应用 ID 特意保持不变，因此更新无需重装。'
          },
          {
            id: 'i18n-five-languages',
            title: '法语、西班牙语、意大利语、荷兰语、波兰语',
            description:
              '可在顶部栏或登录前选择语言。缺失的翻译会干净地回退为英文。'
          },
          {
            id: 'dashboard-today-count',
            title: '「今日一览」只显示今天',
            description:
              '摘要和日历徽章现在只统计当天的日程，不再统计所有未来日程。'
          },
          {
            id: 'nav-and-studio-fixes',
            title: '更稳的标签栏与完善的仪表盘工作室',
            description:
              '切换时标签不再抖动，Firefox 中最后一个标签页可达，工作室不再裁剪底部栏。'
          },
          {
            id: 'android-back-nav',
            title: '安卓：返回键留在应用内',
            description:
              '实体返回键和返回手势会在应用内返回，不再立即退出应用。'
          },
        ],
        closing:
          '现有的家庭、成员、日程、任务、菜谱、文件和设置保持不变。'
      }
    }
  },
  '1.17.0': {
    version: '1.17.0',
    eyebrow: 'Mobile Navigation',
    title: 'Alle Bereiche auf einen Blick – auch auf dem Handy',
    intro:
      'Auf Handys und Tablets im Hochformat ersetzt eine ausklappbare Seitenleiste die bisherige horizontale Scroll-Leiste. Alle Bereiche sind sofort sichtbar, und nach der Auswahl klappt das Menü automatisch wieder zu.',
    highlights: [
      {
        id: 'mobile-nav-drawer',
        title: 'Menü auf einen Blick statt Scrollen',
        description:
          'Das neue ☰-Symbol oben klappt eine seitliche Leiste auf, in der alle Bereiche inklusive Badges sofort sichtbar sind – nichts mehr hinter einer Scrollbahn versteckt.'
      },
      {
        id: 'mobile-nav-autoclose',
        title: 'Schneller von Bereich zu Bereich',
        description:
          'Nach dem Antippen eines Punktes schließt das Menü automatisch, sodass der gewählte Bereich sofort sichtbar wird.'
      },
      {
        id: 'mobile-header-cleanup',
        title: 'Aufgeräumte Kopfzeile auf dem Handy',
        description:
          'Sprache, Theme, Server-Einstellungen und Abmelden sind auf schmalen Bildschirmen ins Menü gewandert. Oben bleiben nur Marke, Menü, Benachrichtigungen und das Profil.'
      },
      {
        id: 'mobile-nav-desktop-unchanged',
        title: 'Desktop bleibt, wie er ist',
        description:
          'Auf größeren Bildschirmen und Tablets im Querformat bleibt die gewohnte horizontale Leiste unverändert – dort funktioniert sie ja gut.'
      },
    ],
    closing:
      'Bestehende Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'Mobile navigation',
        title: 'Every area at a glance – even on the phone',
        intro:
          'On phones and tablets in portrait, a slide-in drawer replaces the previous horizontal scrolling bar. All areas are visible at once, and the menu closes automatically after a selection.',
        highlights: [
          {
            id: 'mobile-nav-drawer',
            title: 'The menu at a glance instead of scrolling',
            description:
              'The new ☰ symbol at the top opens a side panel where every area including badges is visible immediately – nothing hidden behind a scroll bar anymore.'
          },
          {
            id: 'mobile-nav-autoclose',
            title: 'Faster from area to area',
            description:
              'After tapping an entry, the menu closes automatically so the chosen area is immediately visible.'
          },
          {
            id: 'mobile-header-cleanup',
            title: 'A tidy header on the phone',
            description:
              'Language, theme, server settings and logout have moved into the menu on narrow screens. The header keeps only the brand, menu, notifications and the profile.'
          },
          {
            id: 'mobile-nav-desktop-unchanged',
            title: 'Desktop stays as it is',
            description:
              'On larger screens and tablets in landscape, the familiar horizontal bar remains unchanged – it works well there.'
          },
        ],
        closing:
          'Existing families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '移动端导航',
        title: '每个板块一目了然——手机上也是',
        intro:
          '在手机和平板竖屏上，滑出式抽屉取代了之前的横向滚动栏。所有板块同时可见，选择后菜单自动收起。',
        highlights: [
          {
            id: 'mobile-nav-drawer',
            title: '菜单一目了然，无需滚动',
            description:
              '顶部新增 ☰ 图标，打开侧栏后所有板块（含徽章）立即可见，不再有滚动条隐藏的内容。'
          },
          {
            id: 'mobile-nav-autoclose',
            title: '在板块间更快切换',
            description:
              '点选一个条目后，菜单自动关闭，所选板块即刻呈现。'
          },
          {
            id: 'mobile-header-cleanup',
            title: '手机上更整洁的顶部栏',
            description:
              '在窄屏上，语言、主题、服务器设置和退出已移入菜单。顶部栏只保留品牌、菜单、通知和成员。'
          },
          {
            id: 'mobile-nav-desktop-unchanged',
            title: '桌面端保持原样',
            description:
              '在大屏幕和平板横屏上，熟悉的横向栏保持不变——那里它很好用。'
          },
        ],
        closing:
          '现有的家庭、成员、日程、家务、菜谱、文件和设置保持不变。'
      }
    }
  },
  '1.16.2': {
    version: '1.16.2',
    eyebrow: 'Benachrichtigungen, Wanddisplay und Profilrechte',
    title: 'Mehr Kontrolle über Mitteilungen, Tablet und Zugriffe',
    intro:
      'LX bekommt ntfy als weiteren Push-Kanal, ein sicheres Wanddisplay-Profil und feinere Profilrechte. Aufgaben lassen sich als gemeinsam markieren, und erwachsene Kinder erhalten die passenden Rechte.',
    highlights: [
      {
        id: 'ntfy-channel',
        title: 'ntfy als zusätzlicher Push-Kanal',
        description:
          'Neben Gotify lässt sich jetzt auch ntfy für Benachrichtigungen einrichten. Beide Kanäle können unabhängig voneinander genutzt werden.'
      },
      {
        id: 'wall-display-profile',
        title: 'Sicheres Wanddisplay-Profil',
        description:
          'Ein eigenes, schreibgeschütztes Profil erlaubt an einem geteilten Tablet nur Lesen und die beiden vorgesehenen Abhak-Aktionen. Einstellungen oder Profile können darüber nicht geändert werden.'
      },
      {
        id: 'tablet-task-bubbles-1162',
        title: 'Aufgaben am Tablet ohne Seitenwechsel',
        description:
          'Beim Abhaken einer Aufgabe fragt die Tabletansicht mit großen Profil-Bubbles, wer sie erledigt hat. Die Ansicht bleibt im Tabletmodus.'
      },
      {
        id: 'shared-chores',
        title: 'Gemeinsame Aufgaben mit fairen Sternen',
        description:
          'Aufgaben lassen sich als gemeinsam markieren. Sobald eine Person sie abhakt, gilt sie für den Tag für alle als erledigt; die Sterne erhält die Person, die es tatsächlich getan hat.'
      },
      {
        id: 'adult-child-roles',
        title: 'Erwachsene Kinder mit passenden Rechten',
        description:
          'Mit „Tochter (erwachsen)" und „Sohn (erwachsen)" gibt es eigene Positionen mit Familien-Admin-Rechten. Cloud- oder Briefkasten-Zugriff lässt sich außerdem pro Profil frei vergeben.'
      },
      {
        id: 'safe-profile-switch-1162',
        title: 'Sicherer Wechsel zum Kinderprofil',
        description:
          'Beim Wechsel von einem Erwachsenen- zu einem Kinderprofil schließen sich Cloud und Eltern-Bereiche sofort und die Ansicht springt zurück aufs Dashboard.'
      },
      {
        id: 'module-visibility-1162',
        title: 'Module gezielt ausblenden',
        description:
          'Briefkasten, Cloud und weitere Bereiche lassen sich global für die ganze Familie oder gezielt pro Profil ausblenden.'
      },
      {
        id: 'smart-trash-card',
        title: 'Müll-Kachel nur, wenn sie gebraucht wird',
        description:
          'Die Müllabfuhr-Kachel kann auf immer, nie oder nur eine einstellbare Anzahl Tage vor der nächsten Abholung erscheinen.'
      },
    ],
    closing:
      'Bestehende Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'Notifications, wall display and profile permissions',
        title: 'More control over notifications, the tablet and access',
        intro:
          'LX adds ntfy as another push channel, a safe wall display profile and finer profile permissions. Chores can be marked as shared, and adult children receive the right permissions.',
        highlights: [
          {
            id: 'ntfy-channel',
            title: 'ntfy as an additional push channel',
            description:
              'Alongside Gotify, ntfy can now also be set up for notifications. Both channels can be used independently.'
          },
          {
            id: 'wall-display-profile',
            title: 'Safe wall display profile',
            description:
              'A dedicated read-only profile allows only reading and the two intended check-off actions on a shared tablet. Settings or profiles cannot be changed from it.'
          },
          {
            id: 'tablet-task-bubbles-1162',
            title: 'Complete chores on the tablet without leaving',
            description:
              'When checking off a chore, the tablet view asks with large profile bubbles who completed it, and stays in tablet mode.'
          },
          {
            id: 'shared-chores',
            title: 'Shared chores with fair stars',
            description:
              'Chores can be marked as shared. As soon as one person completes it, it counts as done for everyone that day, while the stars go to whoever actually did it.'
          },
          {
            id: 'adult-child-roles',
            title: 'Adult children with the right permissions',
            description:
              '“Tochter (erwachsen)" and “Sohn (erwachsen)" are dedicated positions with family-admin rights. Cloud or mailbox access can also be granted per profile.'
          },
          {
            id: 'safe-profile-switch-1162',
            title: 'Safe switch to a child profile',
            description:
              'When switching from an adult to a child profile, the cloud and parent areas close immediately and the view returns to the dashboard.'
          },
          {
            id: 'module-visibility-1162',
            title: 'Hide modules where they are not needed',
            description:
              'Mailbox, cloud and other areas can be hidden globally for the whole family or per profile.'
          },
          {
            id: 'smart-trash-card',
            title: 'Waste card only when it is needed',
            description:
              'The waste-collection card can be set to always, never, or only a configurable number of days before the next pickup.'
          },
        ],
        closing:
          'Existing families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '通知、挂墙显示与成员权限',
        title: '更自主地管理通知、平板和权限',
        intro:
          'LX 新增 ntfy 作为推送渠道，带来安全的挂墙显示成员和更精细的成员权限。家务可标记为共享，成年子女获得恰当的权限。',
        highlights: [
          {
            id: 'ntfy-channel',
            title: 'ntfy 作为新的推送渠道',
            description:
              '除 Gotify 外，现在也可配置 ntfy 发送通知。两个渠道可独立使用。'
          },
          {
            id: 'wall-display-profile',
            title: '安全的挂墙显示成员',
            description:
              '专用的只读成员允许在共享平板上仅查看并完成两种打卡操作，无法更改设置或成员。'
          },
          {
            id: 'tablet-task-bubbles-1162',
            title: '在平板上不离开即可完成家务',
            description:
              '打卡家务时，平板视图会用大头像气泡询问是谁完成的，并保持在平板模式。'
          },
          {
            id: 'shared-chores',
            title: '共享家务与公平星星',
            description:
              '家务可标记为共享。一人完成即算当天全家完成，星星归实际完成者。'
          },
          {
            id: 'adult-child-roles',
            title: '成年子女拥有恰当的权限',
            description:
              '「女儿（成年）」和「儿子（成年）」是拥有家庭管理权限的专属身份。云盘或邮箱权限也可按成员单独授予。'
          },
          {
            id: 'safe-profile-switch-1162',
            title: '安全切换到儿童成员',
            description:
              '从成人切换到儿童成员时，云盘和家长区域立即关闭，视图回到仪表盘。'
          },
          {
            id: 'module-visibility-1162',
            title: '在不需要处隐藏模块',
            description:
              '邮箱、云盘等区域可为全家全局隐藏，也可按成员隐藏。'
          },
          {
            id: 'smart-trash-card',
            title: '只在需要时显示垃圾卡',
            description:
              '垃圾回收卡可设为始终显示、从不显示，或仅在下次收运前可配置的天数内显示。'
          },
        ],
        closing:
          '现有的家庭、成员、日程、家务、菜谱、文件和设置保持不变。'
      }
    }
  },
  '1.16.1': {
    version: '1.16.1',
    eyebrow: 'Hotfix für die Android-App',
    title: 'Teilen aus My Recipe Box funktioniert jetzt direkt',
    intro:
      'LX erscheint nun beim Teilen eines RTK-Backups und hält die Sprachwahl auch auf schmalen Handybildschirmen vollständig sichtbar.',
    highlights: [
      {
        id: 'android-rtk-share',
        title: 'RTK-Dateien direkt an LX teilen',
        description:
          'Exportiere dein Backup in My Recipe Box und wähle im Android-Teilen-Menü LX Family Planner. Rezepte und vorhandene Bilder werden anschließend automatisch übernommen.'
      },
      {
        id: 'mobile-language-switcher',
        title: 'Deutsch und Englisch gut erkennbar',
        description:
          'DE oder EN steht nun direkt im Kopfbereich. Das Auswahlmenü bleibt auch auf kleinen Displays vollständig innerhalb des Bildschirms.'
      },
    ],
    closing:
      'Eure Familien, Profile, Rezepte, Termine, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'Android app hotfix',
        title: 'Share directly from My Recipe Box',
        intro:
          'LX now appears when sharing an RTK backup, while the language selector stays fully visible on narrow phone screens.',
        highlights: [
          {
            id: 'android-rtk-share',
            title: 'Share RTK files directly to LX',
            description:
              'Export a backup in My Recipe Box and choose LX Family Planner from the Android share sheet. Recipes and available images are imported automatically.'
          },
          {
            id: 'mobile-language-switcher',
            title: 'English and German remain readable',
            description:
              'EN or DE is visible in the header, and the selection menu stays completely inside small screens.'
          },
        ],
        closing:
          'Your families, profiles, recipes, events, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '安卓 App 热修复',
        title: '直接从「我的菜谱盒」分享',
        intro:
          '分享 RTK 备份时现在会出现 LX，语言选择器在窄屏手机上也能完整显示。',
        highlights: [
          {
            id: 'android-rtk-share',
            title: '直接把 RTK 文件分享到 LX',
            description:
              '在「我的菜谱盒」中导出备份，并从安卓分享面板选择 LX Family Planner。菜谱和可用图片会自动导入。'
          },
          {
            id: 'mobile-language-switcher',
            title: '英文和德文依然清晰可读',
            description:
              '顶部栏显示 EN 或 DE，选择菜单完整收进小屏幕。'
          },
        ],
        closing:
          '您的家庭、成员、菜谱、日程、文件和设置保持不变。'
      }
    }
  },
  '1.16.0': {
    version: '1.16.0',
    eyebrow: 'Mehr Familie, weniger doppelte Pflege',
    title: 'Geburtstage, Team-Aufgaben und ein flexibleres Kochbuch',
    intro:
      'LX denkt jetzt an Familiengeburtstage, verteilt gemeinsame Aufgaben fair und lässt Rezepte endlich vollständig bearbeiten oder aus Tandoor übernehmen.',
    highlights: [
      {
        id: 'family-birthdays',
        title: 'Geburtstage automatisch im Kalender',
        description:
          'Jedes Profil kann ein Geburtsdatum speichern. Der Geburtstag erscheint jedes Jahr von selbst im Familienkalender; LX erinnert eine Woche vorher und am Geburtstag.'
      },
      {
        id: 'safe-family-onboarding',
        title: 'Familien können sich nicht mehr aussperren',
        description:
          'Beim ersten Einrichten achtet LX darauf, dass mindestens ein Erwachsenenprofil die Familie verwalten kann. Bereits betroffene Familien mit einem normalen Haushaltsprofil werden beim Update automatisch repariert.'
      },
      {
        id: 'shared-tasks',
        title: 'Gemeinsame Aufgaben mit fairen Sternen',
        description:
          'Mehrere Personen können dieselbe Aufgabe übernehmen. Die Sterne erhält wirklich die Person, die sie erledigt hat; bei Kindern bleibt die Bestätigung durch die Eltern erhalten.'
      },
      {
        id: 'tablet-task-bubbles',
        title: 'Aufgaben direkt am Tablet abhaken',
        description:
          'Nach dem Antippen fragt die Tabletansicht mit großen Profilbildern, wer die Aufgabe erledigt hat. Die Ansicht bleibt dabei im Tabletmodus.'
      },
      {
        id: 'recipe-editor-tandoor',
        title: 'Rezepte bearbeiten und aus Tandoor importieren',
        description:
          'Zutaten und Zubereitungsschritte lassen sich ergänzen, ändern oder entfernen. Offizielle Tandoor-Exporte werden inklusive vorhandener Bilder eingelesen.'
      },
      {
        id: 'facebook-recipe-drafts',
        title: 'Facebook-Reels als sicheren Rezeptentwurf teilen',
        description:
          'Öffentliche Reels können aus Android direkt an LX geteilt werden. Beschreibung und Original-Rezeptlink werden gelesen; gespeichert wird erst, nachdem jemand den Entwurf geprüft hat.'
      },
      {
        id: 'birthday-dashboard-preview',
        title: 'Geburtstage ohne doppelte Jahresvorschau',
        description:
          'Auf dem Dashboard erscheint pro Person nur der nächste anstehende Geburtstag. Weitere Jahre bleiben im Kalender erhalten, überladen aber nicht mehr die Startseite.'
      },
      {
        id: 'calm-custom-themes',
        title: 'Ruhige Designs und ein eigenes sicheres Theme',
        description:
          'Neue schlichte Themes kommen ohne Motive aus. Eigene Farben und Rundungen werden als separates Design gespeichert, ohne vorhandene Themes zu überschreiben.'
      },
      {
        id: 'smart-trash-widget',
        title: 'Müll-Kachel nur dann, wenn sie gebraucht wird',
        description:
          'Pro Profil und Gerät lässt sich einstellen, ob die Müllabfuhr immer, nie oder nur einige Tage vor der nächsten Abholung erscheint.'
      },
      {
        id: 'language-switcher',
        title: 'Deutsch und Englisch mit einem Klick',
        description:
          'Die Sprache lässt sich vor der Anmeldung oder direkt in der Kopfzeile wechseln. LX merkt sich die Auswahl auf diesem Gerät.'
      },
    ],
    closing:
      'Bestehende Familien, Profile, Termine, Aufgaben, Rezepte, Dateien und Einstellungen bleiben unverändert erhalten.',
    localizations: {
      en: {
        eyebrow: 'More family life, less duplicate work',
        title: 'Birthdays, team chores and a more flexible recipe book',
        intro:
          'LX now remembers family birthdays, shares chores fairly and lets you maintain or import complete recipes.',
        highlights: [
          {
            id: 'family-birthdays',
            title: 'Birthdays appear automatically',
            description:
              'Each profile can store a birthday. It returns in the family calendar every year, with a reminder one week before and on the day.'
          },
          {
            id: 'safe-family-onboarding',
            title: 'Families cannot lock themselves out',
            description:
              'Initial setup keeps at least one adult profile able to manage the family. Affected existing households are repaired during the update.'
          },
          {
            id: 'shared-tasks',
            title: 'Shared chores with fair stars',
            description:
              'Several people can take the same chore. Stars go to whoever completed it; children still need an adult approval.'
          },
          {
            id: 'tablet-task-bubbles',
            title: 'Complete chores from the tablet',
            description:
              'Large profile bubbles ask who completed a shared chore without leaving tablet mode.'
          },
          {
            id: 'recipe-editor-tandoor',
            title: 'Edit recipes and import from Tandoor',
            description:
              'Ingredients and preparation steps can be added, changed or removed. Official Tandoor exports include available images.'
          },
          {
            id: 'facebook-recipe-drafts',
            title: 'Share Facebook Reels as reviewable drafts',
            description:
              'Public Reels can be shared from Android. LX reads the description and original recipe link, but saves only after someone reviews the draft.'
          },
          {
            id: 'birthday-dashboard-preview',
            title: 'A clean birthday preview',
            description:
              'The dashboard shows only the next birthday for each person instead of duplicating future years.'
          },
          {
            id: 'calm-custom-themes',
            title: 'Calm designs and a safe custom theme',
            description:
              'New motif-free themes are joined by a separate custom design for approved colours and shapes, without overwriting built-in themes.'
          },
          {
            id: 'smart-trash-widget',
            title: 'Waste collection only when relevant',
            description:
              'Each profile and device can show the waste card always, never or only shortly before collection.'
          },
          {
            id: 'language-switcher',
            title: 'English and German in one tap',
            description:
              'Choose the interface language before login or from the main header. LX remembers the choice on this device.'
          },
        ],
        closing:
          'Existing families, profiles, events, chores, recipes, files and settings remain unchanged.'
      },
      zh: {
        eyebrow: '更多家庭生活，更少重复劳动',
        title: '生日、团队家务与更灵活的菜谱书',
        intro:
          'LX 现在记住家庭生日，公平地分配家务，还能维护或导入完整菜谱。',
        highlights: [
          {
            id: 'family-birthdays',
            title: '生日自动出现',
            description:
              '每个成员可保存生日。每年都会出现在家庭日历中，并提前一周和当天提醒。'
          },
          {
            id: 'safe-family-onboarding',
            title: '家庭不会把自己锁在门外',
            description:
              '初始设置至少保留一个可管理家庭的成人成员。受影响的现有家庭将在更新时修复。'
          },
          {
            id: 'shared-tasks',
            title: '共享家务与公平星星',
            description:
              '多人可领取同一项家务。星星归完成者；儿童仍需成人确认。'
          },
          {
            id: 'tablet-task-bubbles',
            title: '在平板上完成家务',
            description:
              '大头像气泡会询问是谁完成了共享家务，无需离开平板模式。'
          },
          {
            id: 'recipe-editor-tandoor',
            title: '编辑菜谱并从 Tandoor 导入',
            description:
              '配料和制作步骤可新增、修改或删除。Tandoor 官方导出会包含可用图片。'
          },
          {
            id: 'facebook-recipe-drafts',
            title: '把 Facebook Reels 存为可审核草稿',
            description:
              '可从安卓分享公开 Reels。LX 会读取描述和原菜谱链接，但只有人工审核后才保存。'
          },
          {
            id: 'birthday-dashboard-preview',
            title: '清爽的生日预览',
            description:
              '仪表盘只显示每个人的下一个生日，不再重复显示未来年份。'
          },
          {
            id: 'calm-custom-themes',
            title: '宁静主题与安全的自定义主题',
            description:
              '全新无图案主题登场，还有独立的自定义设计用于批准的色彩和形状，不会覆盖内置主题。'
          },
          {
            id: 'smart-trash-widget',
            title: '只在相关时显示垃圾回收',
            description:
              '每个成员和设备可将垃圾卡设为始终显示、从不显示，或仅在收运前不久显示。'
          },
          {
            id: 'language-switcher',
            title: '一键切换英文与德文',
            description:
              '可在登录前或从主顶部栏选择界面语言。LX 会记住这台设备的选择。'
          },
        ],
        closing:
          '现有的家庭、成员、日程、家务、菜谱、文件和设置保持不变。'
      }
    }
  },
  '1.15.0': {
    version: '1.15.0',
    eyebrow: 'Termine und Schulalltag lassen sich jetzt richtig planen',
    title: 'Ein Kalender für die ganze Familie',
    intro:
      'Termine können wieder geöffnet und vollständig bearbeitet werden. Außerdem darf ein Termin jetzt mehreren Personen gehören.',
    highlights: [
      {
        id: 'calendar-event-editor',
        title: 'Termine öffnen und bearbeiten',
        description:
          'Ein Klick auf einen Termin öffnet alle Details. Titel, Zeit, Ort, Notizen, Erinnerungen und Personen lassen sich ändern; eigene Termine können auch gelöscht werden.'
      },
      {
        id: 'calendar-multiple-members',
        title: 'Mehrere Personen pro Termin',
        description:
          'Elternabend, Ausflug oder Arztbesuch können gezielt für mehrere Familienmitglieder eingetragen werden – ohne den Termin doppelt anzulegen.'
      },
      {
        id: 'child-timetable',
        title: 'Eigener Stundenplan für Kinder',
        description:
          'Eltern können den Schulbereich pro Kind einschalten und einen Wochenplan mit Fach, Stunde, Uhrzeit, Raum und Lehrkraft pflegen. Einmaliger Unterrichtsausfall wird deutlich rot markiert.'
      },
      {
        id: 'mobile-recipe-actions',
        title: 'Rezeptbuch auf kleinen Handys aufgeräumt',
        description:
          'Die Aktionen zum Anzeigen, Importieren und Anlegen von Rezepten bleiben auch auf schmalen Bildschirmen vollständig erreichbar.'
      },
    ],
    closing:
      'Bestehende Familien, Termine, Kalenderquellen, Profile und Einstellungen bleiben beim Update erhalten.',
    localizations: {
      zh: {
        eyebrow: '日程和校园日常现在可以认真规划了',
        title: '全家人的日历',
        intro:
          '日程现在可以重新打开并完整编辑了，一个日程也可以归属多个人。',
        highlights: [
          {
            id: 'calendar-event-editor',
            title: '打开并编辑日程',
            description:
              '点击日程即可查看全部详情。标题、时间、地点、备注、提醒和参与人都可以修改；自己的日程也可以删除。'
          },
          {
            id: 'calendar-multiple-members',
            title: '一个日程可对应多人',
            description:
              '家长会、出游或看病可以针对多名家庭成员登记，无需重复创建日程。'
          },
          {
            id: 'child-timetable',
            title: '儿童专属课程表',
            description:
              '家长可以为每个孩子开启校园板块，维护包含科目、节次、时间、教室和老师的周课表。临时停课会以醒目的红色标记。'
          },
          {
            id: 'mobile-recipe-actions',
            title: '小屏手机上的菜谱书更整洁',
            description:
              '查看、导入和创建菜谱的操作在窄屏上依然全部可达。'
          },
        ],
        closing:
          '更新后现有家庭、日程、日历来源、成员和设置保持不变。'
      }
    }
  },
  '1.14.3': {
    version: '1.14.3',
    eyebrow: 'Die öffentliche Demo ist jetzt strikt abgeschottet',
    title: 'Cloud und Integrationen bleiben privat',
    intro:
      'Das Demo-Konto kann keine Cloud-Dateien, Zugangsdaten oder angebundenen Dienste mehr öffnen.',
    highlights: [
      {
        id: 'demo-cloud-isolation',
        title: 'Keine Cloud im Demo-Konto',
        description:
          'Cloud-Navigation, Dateien, Ordner, Sicherungen und Zugangsdaten sind für öffentliche Demo-Sitzungen vollständig gesperrt.'
      },
      {
        id: 'demo-integration-isolation',
        title: 'Anbindungen bleiben unsichtbar',
        description:
          'Auch Home Assistant, Bring, Gotify und Geräteinformationen werden der Demo nicht mehr bereitgestellt.'
      },
      {
        id: 'real-families-unchanged',
        title: 'Eure Familien bleiben getrennt',
        description:
          'Private Familien behalten ihre eigenen Cloud-Konten und sämtliche gespeicherten Inhalte.'
      },
    ],
    closing:
      'Der öffentliche Rundgang bleibt möglich, sensible Anbindungen sind darin ab jetzt grundsätzlich ausgeschlossen.',
    localizations: {
      zh: {
        eyebrow: '公开演示版现已严格隔离',
        title: '云盘与集成保持私密',
        intro:
          '演示账号不能再打开云文件、访问凭证或已连接的服务。',
        highlights: [
          {
            id: 'demo-cloud-isolation',
            title: '演示账号无云盘',
            description:
              '云盘导航、文件、文件夹、备份和访问凭证对公开演示会话完全锁定。'
          },
          {
            id: 'demo-integration-isolation',
            title: '集成保持不可见',
            description:
              'Home Assistant、Bring、Gotify 和设备信息也不再提供给演示版。'
          },
          {
            id: 'real-families-unchanged',
            title: '你们的家庭保持独立',
            description:
              '私人家庭保留各自的云账号和所有已保存的内容。'
          },
        ],
        closing:
          '公开参观依然可用，但敏感集成从现在起原则上排除在外。'
      }
    }
  },
  '1.14.2': {
    version: '1.14.2',
    eyebrow: 'Das sichere Update läuft wieder zuverlässig',
    title: 'Neutrale Anmeldung und geschützte Familieninhalte',
    intro:
      'LX verrät bei der Anmeldung keinen Familiennamen mehr und kann dieses Sicherheitsupdate jetzt zuverlässig über Docker einspielen.',
    highlights: [
      {
        id: 'neutral-family-login',
        title: 'Kein echter Familienname als Hinweis',
        description:
          'Im Anmeldefeld steht nur noch eine neutrale Aufforderung. Private Familien werden weder aufgelistet noch vorgeschlagen.'
      },
      {
        id: 'safe-docker-update',
        title: 'Sicherung vor jedem Update',
        description:
          'Der Docker-Updateweg kann die Familiendaten wieder sichern und prüfen, bevor die neue Version startet.'
      },
    ],
    closing:
      'Eure drei Familienkonten, Profile, Einstellungen und gespeicherten Inhalte bleiben unverändert.',
    localizations: {
      zh: {
        eyebrow: '安全更新再次可靠运行',
        title: '中性登录与受保护的家庭内容',
        intro:
          '登录时 LX 不再泄露家庭名称，这次安全更新现在可通过 Docker 可靠安装。',
        highlights: [
          {
            id: 'neutral-family-login',
            title: '登录提示不再显示真实家庭名称',
            description:
              '登录框中只显示中性提示。私人家庭既不列出，也不推荐。'
          },
          {
            id: 'safe-docker-update',
            title: '每次更新前先备份',
            description:
              'Docker 更新流程现在可以在新版本启动前备份并校验家庭数据。'
          },
        ],
        closing:
          '你们的三个家庭账号、成员、设置和已保存内容保持不变。'
      }
    }
  },
  '1.14.1': {
    version: '1.14.1',
    eyebrow: 'Ein kleines Detail schützt euren Zugang besser',
    title: 'Die Anmeldung bleibt jetzt vollständig neutral',
    intro:
      'Im Eingabefeld für den Familiennamen wird kein konkreter Familienname mehr als Beispiel gezeigt.',
    highlights: [
      {
        id: 'neutral-family-login',
        title: 'Kein Kontoname als Beispiel',
        description:
          'Die Anmeldung fordert nur noch neutral zur Eingabe auf. Private Familiennamen werden weder aufgelistet noch als Hinweis vorgeschlagen.'
      },
      {
        id: 'public-demo-exception',
        title: 'Die Demo bleibt klar erkennbar',
        description:
          'Nur das ausdrücklich freigegebene, schreibgeschützte Demo-Konto darf weiterhin öffentlich angeboten werden.'
      },
    ],
    closing:
      'An euren Familienkonten, Passwörtern und gespeicherten Inhalten ändert sich nichts.',
    localizations: {
      zh: {
        eyebrow: '一个小细节更好地保护你们的入口',
        title: '登录现在完全中性',
        intro:
          '家庭名称输入框中不再以示例显示具体家庭名称。',
        highlights: [
          {
            id: 'neutral-family-login',
            title: '不再以账号名作示例',
            description:
              '登录只中性地提示输入。私人家庭名称既不列出，也不作为提示推荐。'
          },
          {
            id: 'public-demo-exception',
            title: '演示版依然清晰可辨',
            description:
              '只有明确开放的、只读的演示账号才可继续公开展示。'
          },
        ],
        closing:
          '你们的家庭账号、密码和已保存内容没有任何变化。'
      }
    }
  },
  '1.14.0': {
    version: '1.14.0',
    eyebrow: 'Mehr Überblick, ohne euch einzuschränken',
    title: 'Aufgaben, Termine und Bereiche passen sich euch an',
    intro:
      'LX lässt sich jetzt besser auf eure Familie zuschneiden. Aufgaben können korrigiert werden, Termine dürfen mehrere Tage dauern und nicht benötigte Bereiche verschwinden auf Wunsch.',
    highlights: [
      {
        id: 'editable-tasks',
        title: 'Aufgaben bearbeiten und einzeln löschen',
        description:
          'Titel, Beschreibung, Person, Fälligkeit, Wiederholung und Sterne lassen sich nachträglich ändern. Eine einzelne Aufgabe kann mit Sicherheitsabfrage entfernt werden.'
      },
      {
        id: 'calendar-duration',
        title: 'Ganztägige und mehrtägige Termine',
        description:
          'Urlaub, Klassenfahrt oder Besuch können als ganzer Tag, mit Uhrzeit oder über mehrere Tage eingetragen werden.'
      },
      {
        id: 'module-visibility',
        title: 'Nur die Bereiche, die ihr braucht',
        description:
          'Erwachsene können Funktionen für die ganze Familie oder gezielt für einzelne Profile ein- und ausblenden.'
      },
      {
        id: 'safe-profile-switch',
        title: 'Sicherer Profilwechsel',
        description:
          'Beim Wechsel zu einem Kind oder Haustier schließt LX geschützte Ansichten sofort und öffnet das passende Dashboard.'
      },
      {
        id: 'unraid-start',
        title: 'Zuverlässiger Start unter Unraid',
        description:
          'Der Container richtet seine Datenordner beim Start korrekt ein. Unsichere Vollzugriffsrechte sind nicht mehr nötig.'
      },
    ],
    closing:
      'Vorhandene Familien, Termine, Aufgaben, Dateien und Einstellungen bleiben beim Update vollständig erhalten.',
    localizations: {
      zh: {
        eyebrow: '更多掌控，不受束缚',
        title: '任务、日程和板块随你们调整',
        intro:
          'LX 现在能更好地贴合你们的家庭。任务可以修正，日程可以跨多天，不需要的板块可以按需隐藏。',
        highlights: [
          {
            id: 'editable-tasks',
            title: '编辑任务并单独删除',
            description:
              '标题、描述、负责人、到期日、重复和星星都可以事后修改。单个任务可在安全确认后删除。'
          },
          {
            id: 'calendar-duration',
            title: '全天和多天日程',
            description:
              '假期、班级旅行或访客可以登记为全天、带时间或跨多天。'
          },
          {
            id: 'module-visibility',
            title: '只保留你们需要的板块',
            description:
              '成人可以为全家或针对单个成员开启或隐藏功能。'
          },
          {
            id: 'safe-profile-switch',
            title: '安全的成员切换',
            description:
              '切换到儿童或宠物时，LX 会立即关闭受保护视图并打开相应的仪表盘。'
          },
          {
            id: 'unraid-start',
            title: '在 Unraid 下可靠启动',
            description:
              '容器在启动时正确设置数据文件夹，不再需要不安全的完全访问权限。'
          },
        ],
        closing:
          '更新后现有家庭、日程、任务、文件和设置完整保留。'
      }
    }
  },
  '1.13.2': {
    version: '1.13.2',
    eyebrow: 'Euer Familienraum bleibt jetzt wirklich privat',
    title: 'Sichere Anmeldung und kontrollierte Registrierung',
    intro:
      'Familiennamen werden vor der Anmeldung nicht mehr öffentlich aufgelistet. Neue Familien kommen nur noch kontrolliert auf den eigenen Server.',
    highlights: [
      {
        id: 'private-family-login',
        title: 'Keine öffentliche Familienliste mehr',
        description:
          'Zur Anmeldung werden Familienname und Familienpasswort selbst eingegeben. Andere Familienkonten bleiben unsichtbar.'
      },
      {
        id: 'first-family-registration',
        title: 'Nach der ersten Familie automatisch geschlossen',
        description:
          'Eine frische Installation lässt die erste Einrichtung zu und sperrt danach weitere freie Registrierungen.'
      },
      {
        id: 'invite-only-registration',
        title: 'Weitere Familien nur mit Einladung',
        description:
          'Serverbetreiber können bei Bedarf einen persönlichen Einladungscode für kontrollierte neue Konten aktivieren.'
      },
      {
        id: 'demo-remains-public',
        title: 'Die öffentliche Demo bleibt leicht erreichbar',
        description:
          'Eine ausdrücklich eingerichtete Nur-Lese-Demo darf weiterhin auf der Startseite erscheinen, private Familien dagegen nicht.'
      },
      {
        id: 'stronger-new-passwords',
        title: 'Stärkere neue Familienpasswörter',
        description:
          'Neu angelegte oder geänderte Familienpasswörter benötigen jetzt mindestens zehn Zeichen.'
      },
    ],
    closing:
      'Bestehende Familieninhalte bleiben unverändert. Der Server schützt nur Anmeldung und Neuregistrierung deutlich strenger.',
    localizations: {
      zh: {
        eyebrow: '你们的家庭空间现在真正私密了',
        title: '更安全的登录与受控的注册',
        intro:
          '登录时不再公开列出家庭名称，新家庭只能受控地加入自己的服务器。',
        highlights: [
          {
            id: 'private-family-login',
            title: '不再公开家庭列表',
            description:
              '登录时需要手动输入家庭名称和家庭密码，其他家庭账户保持不可见。'
          },
          {
            id: 'first-family-registration',
            title: '首个家庭注册后自动关闭',
            description:
              '全新安装允许首次创建家庭，之后将自动阻止进一步的自由注册。'
          },
          {
            id: 'invite-only-registration',
            title: '新家庭仅限邀请注册',
            description:
              '服务器管理员可以按需启用专属邀请码，用于创建受控的新账户。'
          },
          {
            id: 'demo-remains-public',
            title: '公开演示依然触手可及',
            description:
              '明确设为只读的公开演示可以继续显示在首页，而私人家庭不会显示。'
          },
          {
            id: 'stronger-new-passwords',
            title: '更强的家庭密码',
            description:
              '新建或修改的家庭密码现在至少需要十个字符。'
          },
        ],
        closing:
          '现有家庭内容保持不变，服务器仅对登录和新注册采取了更严格的保护。'
      }
    }
  },
  '1.13.1': {
    version: '1.13.1',
    eyebrow: 'LX zeigt jetzt, wo es gemeinsam weitergeht',
    title: 'Das öffentliche Projekt ist direkt in LX erreichbar',
    intro:
      'Wer LX gerne nutzt, findet das öffentliche GitHub-Projekt jetzt ohne Suche. Dort könnt ihr einen Stern dalassen, Ideen verfolgen oder selbst mitmachen.',
    highlights: [
      {
        id: 'github-welcome-link',
        title: 'GitHub direkt auf der Startseite',
        description:
          'Eine ruhige Open-Source-Karte führt neue und wiederkehrende Familien direkt zum öffentlichen LX-Projekt.'
      },
      {
        id: 'github-settings-link',
        title: 'Auch später leicht wiederzufinden',
        description:
          'In der Familienverwaltung steht der Projektlink dauerhaft neben der installierten Versionsnummer.'
      },
      {
        id: 'theme-safe-github-card',
        title: 'Passend zu hellen und dunklen Themen',
        description:
          'Die neue Karte verwendet die jeweilige Themenwelt und bleibt auf Handy, Tablet und Desktop gut lesbar.'
      },
      {
        id: 'github-link-only',
        title: 'Keine Familiendaten werden geteilt',
        description:
          'Der Verweis öffnet nur das öffentliche Repository. Profile, Termine und Einstellungen bleiben vollständig auf eurem Server.'
      },
    ],
    closing:
      'Die Verweise öffnen ausschließlich das öffentliche GitHub-Repository. Familieninhalte und Einstellungen werden dabei nicht übertragen.',
    localizations: {
      zh: {
        eyebrow: 'LX 现在告诉你们，未来一起去哪里',
        title: '公开项目在 LX 内触手可及',
        intro:
          '喜欢 LX 的用户无需搜索即可找到公开的 GitHub 项目，可以在那里点星、关注进展或亲自参与。',
        highlights: [
          {
            id: 'github-welcome-link',
            title: '首页直达 GitHub',
            description:
              '一张简洁的开源卡片直接引导新老用户前往公开的 LX 项目。'
          },
          {
            id: 'github-settings-link',
            title: '随时都能轻松找到',
            description:
              '在家庭管理中，项目链接会常驻在已安装版本号旁边。'
          },
          {
            id: 'theme-safe-github-card',
            title: '适配深色与浅色主题',
            description:
              '新卡片遵循当前主题配色，在手机、平板和桌面上都清晰可读。'
          },
          {
            id: 'github-link-only',
            title: '不分享任何家庭数据',
            description:
              '链接仅打开公开仓库，成员资料、日程和设置完全保留在你们自己的服务器上。'
          },
        ],
        closing:
          '这些链接仅打开公开的 GitHub 仓库，不会传输任何家庭内容或设置。'
      }
    }
  },
  '1.13.0': {
    version: '1.13.0',
    eyebrow: 'Die Medien-Lounge bekommt ein Gesicht',
    title: 'YouTube und Spotify zeigen jetzt ihre echten Cover',
    intro:
      'Freigegebene Medien sehen für Kinder jetzt wie eine echte kleine Mediathek aus. Statt großer Plattform-Symbole zeigt LX das passende Kanal-, Video-, Playlist- oder Album-Bild.',
    highlights: [
      {
        id: 'real-media-covers',
        title: 'Echte Bilder statt Standardsymbol',
        description:
          'Die Kacheln verwenden das offizielle Vorschaubild des verknüpften YouTube- oder Spotify-Inhalts.'
      },
      {
        id: 'existing-widget-covers',
        title: 'Vorhandene Widgets werden ergänzt',
        description:
          'Bereits freigegebene Medienlinks erhalten ihre Cover automatisch im Hintergrund. Die Eltern müssen sie nicht neu anlegen.'
      },
      {
        id: 'cover-first-kid-design',
        title: 'Wie eine kleine Mediathek',
        description:
          'Großflächige Cover, ein ruhiger Lesekontrast und eine klare Abspielschaltfläche machen die Kinderansicht aufregender und trotzdem übersichtlich.'
      },
      {
        id: 'safe-cover-sources',
        title: 'Nur geprüfte Bildquellen',
        description:
          'LX akzeptiert ausschließlich verschlüsselte Bildadressen der offiziellen YouTube- und Spotify-Bildserver.'
      },
    ],
    closing:
      'Wenn ein Dienst vorübergehend kein Bild liefert, bleibt die Kachel mit einem farbigen, gut lesbaren Ersatzmotiv benutzbar.',
    localizations: {
      zh: {
        eyebrow: '媒体区焕发新颜',
        title: 'YouTube 和 Spotify 现在显示真实封面',
        intro:
          '分享的媒体内容在孩子眼中现在像一个真正的小型媒体库：LX 不再显示大平台图标，而是呈现对应的频道、视频、播放列表或专辑图片。',
        highlights: [
          {
            id: 'real-media-covers',
            title: '真实图片取代默认图标',
            description:
              '卡片采用所链接 YouTube 或 Spotify 内容的官方预览图。'
          },
          {
            id: 'existing-widget-covers',
            title: '现有小组件自动补图',
            description:
              '已分享的媒体链接会在后台自动获得封面，家长无需重新添加。'
          },
          {
            id: 'cover-first-kid-design',
            title: '如同一个小型媒体库',
            description:
              '大尺寸封面、柔和的阅读对比度和醒目的播放按钮，让儿童视图更生动又不失条理。'
          },
          {
            id: 'safe-cover-sources',
            title: '仅使用经过验证的图片来源',
            description:
              'LX 仅接受官方 YouTube 和 Spotify 图片服务器的加密图片地址。'
          },
        ],
        closing:
          '如果某个服务暂时无法提供图片，卡片会用彩色、清晰的替代图案保持可用。'
      }
    }
  },
  '1.12.1': {
    version: '1.12.1',
    eyebrow: 'Chatbilder sind jetzt wirklich Cloud-Dateien',
    title: 'Fotos landen zuverlässig im Familienarchiv',
    intro:
      'Auch ältere App- und Browserstände werden jetzt automatisch auf den sicheren Cloud-Weg umgeleitet. Bereits vorhandene Chatfotos räumt LX selbstständig nachträglich ins Familienarchiv.',
    highlights: [
      {
        id: 'legacy-photo-cloud-archive',
        title: 'Kein Foto bleibt mehr im Chatdatensatz',
        description:
          'Eingebettete Bilder werden als echte Dateien unter Familie/Chat gespeichert. Die Nachricht behält nur noch den geschützten Verweis.'
      },
      {
        id: 'existing-photo-migration',
        title: 'Vorhandene Bilder werden nachgeräumt',
        description:
          'Beim Serverstart verschiebt LX bisher eingebettete Chatbilder automatisch in die Cloud, ohne den Verlauf oder die Bildanzeige zu verlieren.'
      },
      {
        id: 'chat-image-lightbox',
        title: 'Antippen und groß ansehen',
        description:
          'Ein Tipp auf ein Chatbild öffnet eine große, übersichtliche Bildansicht mit Download – passend für Handy, Tablet und Desktop.'
      },
      {
        id: 'private-photo-protection',
        title: 'Private Bilder bleiben privat',
        description:
          'Fotos in Direktnachrichten werden wie andere private Anhänge verschlüsselt abgelegt und nur im passenden Chat entschlüsselt.'
      },
    ],
    closing:
      'Die Reparatur arbeitet im Hintergrund. Familieninhalte und bereits gespeicherte Cloud-Dateien bleiben unverändert.',
    localizations: {
      zh: {
        eyebrow: '聊天图片现在真正成为云端文件',
        title: '照片可靠地存入家庭档案',
        intro:
          '即便是较旧的应用和浏览器版本，现在也会自动走安全的云端路径。LX 会自动把已有的聊天照片整理归档到家庭档案中。',
        highlights: [
          {
            id: 'legacy-photo-cloud-archive',
            title: '不再有照片留在聊天记录中',
            description:
              '内嵌图片将作为真实文件保存在「家庭/聊天」目录下，消息中只保留受保护的引用。'
          },
          {
            id: 'existing-photo-migration',
            title: '现有图片自动整理归位',
            description:
              '服务器启动时，LX 会自动将以往内嵌的聊天图片迁移到云端，不丢失聊天记录也不影响图片显示。'
          },
          {
            id: 'chat-image-lightbox',
            title: '轻点即可大图查看',
            description:
              '点击聊天图片即可打开宽敞的图片视图并支持下载，适配手机、平板和桌面。'
          },
          {
            id: 'private-photo-protection',
            title: '私人照片保持私密',
            description:
              '私聊中的照片与其他私人附件一样加密存储，仅在对应的聊天中解密。'
          },
        ],
        closing:
          '修复在后台自动进行，家庭内容和已存储的云端文件保持不变。'
      }
    }
  },
  '1.12.0': {
    version: '1.12.0',
    eyebrow: 'Updates in der App und ein aufgeräumter Datei-Alltag',
    title: 'Chat-Dateien landen jetzt sicher in eurem Familienarchiv',
    intro:
      'LX behandelt Anhänge nicht länger wie riesige Chattexte. Fotos, Videos und Dokumente werden als echte Dateien in der Family Cloud gespeichert – ordentlich sortiert und weiterhin direkt im Chat erreichbar.',
    highlights: [
      {
        id: 'native-update-flow',
        title: 'App-Update wieder direkt in LX',
        description:
          'Beim Öffnen prüft die Android-App ihre Version. Ein neuer Installationsdialog lädt das geprüfte Update und übergibt es anschließend direkt an Android.'
      },
      {
        id: 'chat-cloud-attachments',
        title: 'Anhänge gehören in die Cloud',
        description:
          'Neue Chat-Anhänge werden automatisch nach Monat im Familienarchiv abgelegt. Der Verlauf bleibt dadurch schnell und vorhandene Chatfotos bleiben erhalten.'
      },
      {
        id: 'chat-more-file-types',
        title: 'Mehr als nur Fotos',
        description:
          'Neben Bildern funktionieren jetzt Videos, Audio, PDF- und Office-Dokumente, Archive wie ZIP sowie Android-APKs – mehrere Dateien pro Nachricht und bis 100 MB je Datei.'
      },
      {
        id: 'cloud-folder-choice',
        title: 'Vor dem Upload den Ordner wählen',
        description:
          'Dashboard-Uploads fragen zuerst nach dem Ziel. Ein neuer Ordner lässt sich direkt in derselben Auswahl anlegen; lose Dateien im Stammverzeichnis verhindert LX.'
      },
      {
        id: 'cloud-family-profile-folders',
        title: 'Familien- und Profilordner',
        description:
          'LX bereitet einen gemeinsamen Bereich sowie einen persönlichen Ordner für jedes echte Nutzerprofil vor. Chat-Dateien liegen übersichtlich im gemeinsamen Familienbereich.'
      },
    ],
    closing:
      'Für das Android-Update fragt das Handy einmalig, ob LX selbst geladene Updates installieren darf. Familieninhalte, Einstellungen und bereits vorhandene Dateien bleiben unverändert.',
    localizations: {
      zh: {
        eyebrow: '应用内更新与整洁的文件日常',
        title: '聊天文件现在安全地存入家庭档案',
        intro:
          'LX 不再把附件当作巨型聊天文本处理。照片、视频和文档现在作为真实文件存储在 Family Cloud 中——分类有序，并且可以直接在聊天中打开。',
        highlights: [
          {
            id: 'native-update-flow',
            title: '应用更新回归 LX 内完成',
            description:
              '打开时，安卓应用会检查版本。新的安装对话框会下载已验证的更新，并直接交给安卓系统安装。'
          },
          {
            id: 'chat-cloud-attachments',
            title: '附件就该在云端',
            description:
              '新的聊天附件会自动按月份归档到家庭档案中，聊天记录保持流畅，已有的聊天照片也得以保留。'
          },
          {
            id: 'chat-more-file-types',
            title: '不止是照片',
            description:
              '除了图片，现在还支持视频、音频、PDF 和 Office 文档、ZIP 等压缩包以及安卓 APK 文件——每条消息可发多个文件，单个文件最大 100 MB。'
          },
          {
            id: 'cloud-folder-choice',
            title: '上传前先选择文件夹',
            description:
              '仪表盘上传会先询问目标位置，可以直接在选择框中新建文件夹；LX 会避免在根目录产生散乱的文件。'
          },
          {
            id: 'cloud-family-profile-folders',
            title: '家庭与个人文件夹',
            description:
              'LX 为家庭准备了共享空间，并为每个真实用户准备了个人文件夹，聊天文件整齐地存放在共享的家庭区域中。'
          },
        ],
        closing:
          '为完成安卓更新，手机会一次性询问是否允许 LX 安装自行下载的更新。家庭内容、设置和已有文件保持不变。'
      }
    }
  },
  '1.11.0': {
    version: '1.11.0',
    eyebrow: 'Euer Familienarchiv bekommt seinen eigenen Platz',
    title: 'Fotos und Dokumente fühlen sich jetzt wie ein echtes Archiv an',
    intro:
      'Family Cloud war bisher eine Mischung aus Dateien und technischen Einstellungen. Jetzt ist sie ein übersichtlicher Familienbereich zum Stöbern, Ordnen und Hochladen.',
    highlights: [
      {
        id: 'cloud-pure-archive',
        title: 'Nur noch eure Inhalte',
        description:
          'Auf der Seite Family Cloud seht ihr ausschließlich Dateien, Ordner, Speicher und die passenden Aktionen – keine Serverformulare mehr.'
      },
      {
        id: 'cloud-dashboard-upload',
        title: 'Upload direkt vom Dashboard',
        description:
          'Die neue Archiv-Kachel zeigt den Speicherstand und zuletzt verwendete Inhalte. Fotos oder Dokumente lassen sich dort sofort hochladen.'
      },
      {
        id: 'cloud-gallery-list',
        title: 'Galerie oder übersichtliche Liste',
        description:
          'Bilder bekommen Vorschaubilder, Ordner sehen wie Sammlungen aus und die Ansicht lässt sich jederzeit umschalten oder durchsuchen.'
      },
      {
        id: 'cloud-settings-parent-admin',
        title: 'Technik bleibt bei den Erwachsenen',
        description:
          'Verbindung, Kalenderabgleich, Sicherungen und Zugangsdaten liegen jetzt gesammelt in der Elternzentrale.'
      },
      {
        id: 'cloud-no-login-detour',
        title: 'Kein unerwarteter Nextcloud-Login',
        description:
          'Der alte externe Familienordner-Link wurde entfernt. Das Archiv öffnet sich vollständig innerhalb von LX.'
      },
    ],
    closing:
      'Am Speicher und an euren vorhandenen Dateien wurde nichts verändert. Das Update ordnet nur die Bedienung neu und macht das gemeinsame Archiv deutlich angenehmer.',
    localizations: {
      zh: {
        eyebrow: '家庭档案有了自己的专属位置',
        title: '照片和文档现在像真正的档案馆一样',
        intro:
          'Family Cloud 以前是文件和技术设置的混合体，现在变成了一个条理清晰的家庭空间，方便浏览、整理和上传。',
        highlights: [
          {
            id: 'cloud-pure-archive',
            title: '只剩你们的内容',
            description:
              '在 Family Cloud 页面，你只会看到文件、文件夹、存储空间和相关操作——不再有服务器表单。'
          },
          {
            id: 'cloud-dashboard-upload',
            title: '直接从仪表盘上传',
            description:
              '新的档案卡片显示存储用量和最近使用的内容，可以直接在那里上传照片或文档。'
          },
          {
            id: 'cloud-gallery-list',
            title: '画廊视图或清晰列表',
            description:
              '图片显示缩略图，文件夹看起来像一个个精选集，视图可以随时切换或搜索。'
          },
          {
            id: 'cloud-settings-parent-admin',
            title: '技术设置交给成年人',
            description:
              '连接、日历同步、备份和登录信息现在都集中在家长中心。'
          },
          {
            id: 'cloud-no-login-detour',
            title: '不再跳转到 Nextcloud 登录',
            description:
              '旧的外部家庭文件夹链接已移除，档案现在完全在 LX 内部打开。'
          },
        ],
        closing:
          '存储空间和现有文件没有变化，这次更新只是重新整理了操作界面，让共享档案用起来更舒心。'
      }
    }
  },
  '1.10.2': {
    version: '1.10.2',
    eyebrow: 'Family Cloud repariert sich jetzt selbst',
    title: 'Gelöschte Cloud-Konten bleiben nicht mehr hängen',
    intro:
      'War in LX noch eine alte Cloud-Verknüpfung gespeichert, obwohl das zugehörige Nextcloud-Konto bereits gelöscht wurde, konnte kein Familienordner geöffnet werden. LX erkennt und behebt diesen Zustand nun automatisch.',
    highlights: [
      {
        id: 'cloud-managed-health-check',
        title: 'Alte Verknüpfungen werden geprüft',
        description:
          'LX kontrolliert verwaltete Familienkonten beim Start und danach regelmäßig, statt eine gespeicherte Verbindung blind als funktionsfähig anzusehen.'
      },
      {
        id: 'cloud-account-self-heal',
        title: 'Familienkonto wird wiederhergestellt',
        description:
          'Fehlt das Konto, entstehen automatisch ein neuer sicherer Zugang, der Familienordner, der Kalender und das vorgesehene Speicherlimit.'
      },
      {
        id: 'cloud-external-safe',
        title: 'Eigene Clouds bleiben unangetastet',
        description:
          'Die Reparatur gilt ausschließlich für die von LX selbst verwaltete Family Cloud. Manuell verbundene Nextcloud-Server werden nicht verändert.'
      },
      {
        id: 'cloud-no-extra-login',
        title: 'Keine zusätzlichen Anmeldungen',
        description:
          'Familienmitglieder öffnen den gemeinsamen Cloud-Bereich weiter direkt in LX und brauchen dafür kein eigenes Nextcloud-Passwort.'
      },
    ],
    closing:
      'Die Profile einer Familie verwenden weiterhin gemeinsam ihren abgeschotteten Familienbereich. Es sind keine zusätzlichen Nextcloud-Passwörter für Kinder oder verwaltete Profile nötig.',
    localizations: {
      zh: {
        eyebrow: 'Family Cloud 现在可以自我修复',
        title: '已删除的云账户不再卡住',
        intro:
          '如果 LX 中还存着旧的云关联，而对应的 Nextcloud 账户已经被删除，家庭文件夹就打不开了。LX 现在会自动识别并修复这种情况。',
        highlights: [
          {
            id: 'cloud-managed-health-check',
            title: '旧关联将被检查',
            description:
              'LX 会在启动时及之后定期检查所管理的家庭账户，而不是盲目认为已保存的连接可用。'
          },
          {
            id: 'cloud-account-self-heal',
            title: '家庭账户自动恢复',
            description:
              '如果账户缺失，将自动重新创建安全的登录凭证、家庭文件夹、日历和既定的存储配额。'
          },
          {
            id: 'cloud-external-safe',
            title: '自有云不受影响',
            description:
              '修复仅针对 LX 自行管理的 Family Cloud，手动连接的 Nextcloud 服务器不会被改动。'
          },
          {
            id: 'cloud-no-extra-login',
            title: '无需额外登录',
            description:
              '家庭成员继续直接在 LX 中打开共享云空间，无需各自的 Nextcloud 密码。'
          },
        ],
        closing:
          '同一家庭的成员继续共用其独立的家庭空间，孩子或托管成员无需额外的 Nextcloud 密码。'
      }
    }
  },
  '1.10.1': {
    version: '1.10.1',
    eyebrow: 'Family Cloud ohne manuellen Einrichtungsschritt',
    title: 'Jede Familie bekommt ihren Cloud-Bereich automatisch',
    intro:
      'Die mitgestartete Nextcloud war erreichbar, hat Familienkonten aber bisher erst nach einem zusätzlichen Klick angelegt. LX richtet bestehende und neue Familien jetzt selbstständig vollständig ein.',
    highlights: [
      {
        id: 'cloud-auto-account',
        title: 'Automatisches Familienkonto',
        description:
          'Jede Familie erhält ein eigenes, getrenntes Nextcloud-Konto – vorhandene Familien direkt nach dem Update und neue Familien bei der Anmeldung.'
      },
      {
        id: 'cloud-auto-storage',
        title: '10 GB Speicher pro Familie',
        description:
          'Zum Konto gehören ein festes Speicherkontingent, der Familienordner und ein eigener Kalender.'
      },
      {
        id: 'cloud-storage-meter',
        title: 'Speicher direkt in LX sichtbar',
        description:
          'Das Familienarchiv zeigt verwendeten und verfügbaren Speicher verständlich neben den Upload-Knöpfen.'
      },
      {
        id: 'cloud-choice-preserved',
        title: 'Trennen bleibt eine bewusste Entscheidung',
        description:
          'Wer die Cloud in LX ausdrücklich trennt, wird bei einem späteren Neustart nicht ungefragt erneut verbunden.'
      },
    ],
    closing:
      'Die Cloud bleibt familienweise getrennt. Profile benutzen den gemeinsamen Familienbereich über LX, ohne dass Kinder oder verwaltete Profile eigene Nextcloud-Passwörter benötigen.',
    localizations: {
      zh: {
        eyebrow: '无需手动设置的 Family Cloud',
        title: '每个家庭自动获得专属云空间',
        intro:
          '随附启动的 Nextcloud 虽然可用，但以前需要额外点击一次才能创建家庭账户。现在 LX 会自动为现有和新家庭完成全部设置。',
        highlights: [
          {
            id: 'cloud-auto-account',
            title: '自动创建家庭账户',
            description:
              '每个家庭获得独立的 Nextcloud 账户——现有家庭在更新后立即获得，新家庭在注册时获得。'
          },
          {
            id: 'cloud-auto-storage',
            title: '每个家庭 10 GB 存储',
            description:
              '账户包含固定的存储配额、家庭文件夹和专属日历。'
          },
          {
            id: 'cloud-storage-meter',
            title: '直接在 LX 中查看存储用量',
            description:
              '家庭档案在上传按钮旁直观展示已用和可用的存储空间。'
          },
          {
            id: 'cloud-choice-preserved',
            title: '断开连接依然是主动选择',
            description:
              '如果你明确在 LX 中断开云连接，之后重启时不会在未询问的情况下重新连接。'
          },
        ],
        closing:
          '云空间按家庭保持隔离。成员通过 LX 使用共享的家庭区域，孩子或托管成员无需各自的 Nextcloud 密码。'
      }
    }
  },
  '1.10.0': {
    version: '1.10.0',
    eyebrow: 'Cloud-Dateien und Familienpost direkt in LX',
    title: 'Eure Familien werden digital ein Stück näher',
    intro:
      'Der Familienordner lässt sich jetzt direkt im Planer benutzen. Verbundene Familien können sich außerdem private Briefe senden und einzelne Erwachsene wie Oma oder Opa bewusst in einen Familienchat einladen.',
    highlights: [
      {
        id: 'cloud-file-view',
        title: 'Familienordner in der App',
        description:
          'Fotos und Dokumente lassen sich ansehen, herunterladen, in Ordner sortieren und per Auswahl oder Ziehen-und-Ablegen hochladen.'
      },
      {
        id: 'family-mailbox',
        title: 'Privater Familienbriefkasten',
        description:
          'Bestätigte Familienverbindungen können längere Absprachen wie einen echten Brief senden, beantworten und archivieren.'
      },
      {
        id: 'consented-chat-guests',
        title: 'Oma und Opa sicher im Familienchat',
        description:
          'Ein eingeladenes Erwachsenenprofil stimmt selbst zu und sieht erst danach neue Gruppennachrichten – niemals ältere Chatverläufe.'
      },
      {
        id: 'mobile-reminders-cloud',
        title: 'Handy und Kalender repariert',
        description:
          'Der Problem-melden-Knopf verdeckt mobil keine Bedienfelder mehr und Terminerinnerungen lassen sich wieder zuverlässig speichern.'
      },
      {
        id: 'cloud-domain-helper',
        title: 'Cloud-Domain dauerhaft eingerichtet',
        description:
          'Die öffentliche Nextcloud-Adresse wird automatisch als vertrauenswürdig gespeichert und bleibt auch bei späteren Updates erhalten.'
      },
    ],
    closing:
      'Das Update ergänzt die Datenbank nur um neue Bereiche. Profile, Termine, Aufgaben, Cloud-Dateien, Einstellungen und Zugangsdaten bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '云文件和家庭信件直接在 LX 中',
        title: '让你们的家庭在数字世界更近一步',
        intro:
          '家庭文件夹现在可以直接在家庭计划器中使用。已关联的家庭还可以互寄私人信件，并特意邀请爷爷奶奶等长辈加入家庭群聊。',
        highlights: [
          {
            id: 'cloud-file-view',
            title: '应用内的家庭文件夹',
            description:
              '照片和文档可以查看、下载、分类到文件夹，还可以通过选择或拖拽上传。'
          },
          {
            id: 'family-mailbox',
            title: '私人家庭信箱',
            description:
              '已确认关联的家庭可以像寄真正的信件一样发送、回复和归档较长的留言。'
          },
          {
            id: 'consented-chat-guests',
            title: '爷爷奶奶安心加入家庭群聊',
            description:
              '受邀的长辈成员亲自确认后，才能看到之后的群消息——绝不会看到之前的聊天记录。'
          },
          {
            id: 'mobile-reminders-cloud',
            title: '修复手机与日历问题',
            description:
              '「报告问题」按钮在手机上不再遮挡操作区域，日程提醒也可以正常保存了。'
          },
          {
            id: 'cloud-domain-helper',
            title: '云域名永久生效',
            description:
              '公开的 Nextcloud 地址会自动保存为可信地址，并且在后续更新中继续保留。'
          },
        ],
        closing:
          '本次更新只在数据库中新增了功能区域，成员资料、日程、任务、云文件、设置和登录信息都保持不变。'
      }
    }
  },
  '1.9.3': {
    version: '1.9.3',
    eyebrow: 'Keine erfundenen Cloud-Adressen mehr',
    title: 'Nextcloud öffnet jetzt die wirklich erreichbare Adresse',
    intro:
      'LX hat an die öffentliche Planer-Domain automatisch Port 8080 angehängt. Das war eine falsche Mischung aus Internet- und Heimnetz-Adresse. Die Family Cloud verwendet jetzt ausschließlich eine ausdrücklich konfigurierte, erreichbare Browser-Adresse.',
    highlights: [
      {
        id: 'cloud-real-public-url',
        title: 'Server gibt die Cloud-Adresse vor',
        description:
          'Im Heimnetz wird die echte Server-IP verwendet; eine öffentliche Domain erst nach eingerichteter Proxy-Route.'
      },
      {
        id: 'cloud-no-port-guess',
        title: 'Kein automatisches „:8080“ an Internet-Domains',
        description:
          'Aus familie.example.de entsteht nicht länger eine nicht erreichbare Mischadresse.'
      },
      {
        id: 'cloud-existing-connection',
        title: 'Auch bestehende Verbindung korrigiert',
        description:
          'Die gespeicherte Cloud-Verbindung muss nicht getrennt oder neu angelegt werden.'
      },
      {
        id: 'cloud-proxy-ready',
        title: 'Für spätere HTTPS-Subdomain vorbereitet',
        description:
          'Eine echte Cloud-Domain kann zentral über NEXTCLOUD_PUBLIC_URL aktiviert werden.'
      },
    ],
    closing:
      'Kalender, Sicherungen, Zugangsdaten und alle Familieninhalte bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '不再有臆造的云地址',
        title: 'Nextcloud 现在打开真正可访问的地址',
        intro:
          'LX 以前会自动在公开的计划域名后加上 8080 端口，这是互联网地址和家庭网络地址的错误混搭。现在 Family Cloud 只使用明确配置、可访问的浏览器地址。',
        highlights: [
          {
            id: 'cloud-real-public-url',
            title: '由服务器指定云地址',
            description:
              '在家庭网络中使用真实的服务器 IP；公开域名只在代理路由配置好后启用。'
          },
          {
            id: 'cloud-no-port-guess',
            title: '不再自动给互联网域名加「:8080」',
            description:
              '像 familie.example.de 这样的域名不会再变成无法访问的混合地址。'
          },
          {
            id: 'cloud-existing-connection',
            title: '已有连接也一并修正',
            description:
              '已保存的云连接无需断开或重新创建。'
          },
          {
            id: 'cloud-proxy-ready',
            title: '为将来的 HTTPS 子域名做好准备',
            description:
              '真实的云域名可以通过 NEXTCLOUD_PUBLIC_URL 集中启用。'
          },
        ],
        closing:
          '日历、备份、登录信息和所有家庭内容都保持不变。'
      }
    }
  },
  '1.9.2': {
    version: '1.9.2',
    eyebrow: 'Die Cloud ist nicht länger versteckt',
    title: 'Family Cloud bekommt ihren eigenen Bereich',
    intro:
      'Nextcloud war bisher tief in der langen Elternzentrale einsortiert. Erwachsene finden die komplette Family Cloud jetzt direkt als eigenen Menüpunkt in der Hauptnavigation.',
    highlights: [
      {
        id: 'cloud-main-navigation',
        title: 'Eigener Menüpunkt „Family Cloud“',
        description:
          'Kalenderabgleich, Sicherungen, Ordner und Zugangsdaten sind ohne langes Scrollen erreichbar.'
      },
      {
        id: 'cloud-adult-only',
        title: 'Weiterhin nur für Erwachsene',
        description:
          'Kinder- und Haustierprofile sehen den Verwaltungsbereich nicht.'
      },
      {
        id: 'cloud-responsive',
        title: 'Auf Browser, Tablet und Handy',
        description:
          'Der neue Bereich passt sich an die vorhandene horizontale Navigation und alle Themes an.'
      },
      {
        id: 'cloud-single-home',
        title: 'Keine doppelte oder versteckte Ansicht',
        description:
          'Die Cloud-Karte wurde aus der langen Elternzentrale entfernt und besitzt jetzt genau einen klaren Platz.'
      },
    ],
    closing:
      'Alle vorhandenen Familien- und Nextcloud-Daten bleiben unverändert.',
    localizations: {
      zh: {
        eyebrow: '云空间不再藏着掖着',
        title: 'Family Cloud 拥有了自己的专区',
        intro:
          'Nextcloud 以前深藏在冗长的家长中心里。现在成年人可以直接在主导航中找到完整的 Family Cloud 专属菜单。',
        highlights: [
          {
            id: 'cloud-main-navigation',
            title: '专属的「Family Cloud」菜单',
            description:
              '日历同步、备份、文件夹和登录信息无需长滚动即可找到。'
          },
          {
            id: 'cloud-adult-only',
            title: '仍然仅限成年人',
            description:
              '儿童和宠物成员看不到管理区域。'
          },
          {
            id: 'cloud-responsive',
            title: '适配浏览器、平板和手机',
            description:
              '新专区适配现有的横向导航和所有主题。'
          },
          {
            id: 'cloud-single-home',
            title: '不再有重复或隐藏的视图',
            description:
              '云卡片已从冗长的家长中心中移除，现在拥有唯一明确的位置。'
          },
        ],
        closing:
          '所有现有的家庭数据和 Nextcloud 数据保持不变。'
      }
    }
  },
  '1.9.1': {
    version: '1.9.1',
    eyebrow: 'Der Familienordner ist jetzt wirklich erreichbar',
    title: 'Cloud-Zugang sicher anzeigen und kopieren',
    intro:
      'Die automatische Family Cloud richtet nicht nur Kalender und Sicherungen ein. Erwachsene können jetzt auch die zugehörigen Nextcloud-Anmeldedaten gezielt öffnen und den Familienordner direkt verwenden.',
    highlights: [
      {
        id: 'cloud-login-access',
        title: 'Zugang nur auf ausdrücklichen Klick',
        description:
          'Benutzername und Passwort erscheinen ausschließlich in der Elternzentrale unter „Verbindung verwalten“.'
      },
      {
        id: 'cloud-copy',
        title: 'Einfach auf Tablet und Handy kopieren',
        description:
          'Beide Werte besitzen einen eigenen Kopieren-Knopf und funktionieren auch im lokalen Heimnetz.'
      },
      {
        id: 'cloud-no-browser-storage',
        title: 'Nicht im Browser gespeichert',
        description:
          'Der Cloud-Zugang wird erst bei Bedarf vom Server geladen und beim Schließen der Ansicht wieder verworfen.'
      },
      {
        id: 'cloud-full-flow-tested',
        title: 'Kompletter Live-Ablauf geprüft',
        description:
          'Konto, Kalender, Ordner, Verbindungstest und Widerruf wurden gegen Nextcloud 34 getestet.'
      },
    ],
    closing:
      'Alle Familieninhalte, Einstellungen und bestehenden Nextcloud-Daten bleiben beim Update erhalten.',
    localizations: {
      zh: {
        eyebrow: '家庭文件夹现在真正触手可及',
        title: '安全地查看和复制云登录信息',
        intro:
          '自动配置的 Family Cloud 不仅设置日历和备份，成年人现在还能查看对应的 Nextcloud 登录信息，并直接使用家庭文件夹。',
        highlights: [
          {
            id: 'cloud-login-access',
            title: '仅主动点击才显示登录信息',
            description:
              '用户名和密码仅在家长中心的「管理连接」中显示。'
          },
          {
            id: 'cloud-copy',
            title: '在平板和手机上轻松复制',
            description:
              '两项信息都有各自的复制按钮，在本地家庭网络中同样可用。'
          },
          {
            id: 'cloud-no-browser-storage',
            title: '不在浏览器中存储',
            description:
              '云登录信息仅在需要时从服务器加载，关闭视图后即丢弃。'
          },
          {
            id: 'cloud-full-flow-tested',
            title: '完整流程已实测验证',
            description:
              '已针对 Nextcloud 34 测试了账户、日历、文件夹、连接测试和撤销流程。'
          },
        ],
        closing:
          '更新时所有家庭内容、设置和现有的 Nextcloud 数据都将保留。'
      }
    }
  },
  '1.9.0': {
    version: '1.9.0',
    eyebrow: 'Die Family Cloud richtet sich jetzt selbst ein',
    title: 'Nextcloud funktioniert ohne Passwort-Puzzle',
    intro:
      'Die mitgelieferte Nextcloud kann jetzt direkt aus der Elternzentrale verbunden werden. LX Family erstellt dabei automatisch einen geschützten Cloud-Bereich, einen Familienkalender und den Dateiordner.',
    highlights: [
      {
        id: 'nextcloud-one-click',
        title: 'Ein Klick statt Zugangsdaten kopieren',
        description:
          'Bei der Docker-Cloud genügt die Browser-Adresse. Benutzerkonto und App-Passwort entstehen automatisch.'
      },
      {
        id: 'nextcloud-family-isolation',
        title: 'Jede Familie bleibt getrennt',
        description:
          'Für jede angemeldete Familie wird ein eigener Nextcloud-Benutzer mit eigenem Kalender und Dateibereich angelegt.'
      },
      {
        id: 'nextcloud-calendar-ready',
        title: 'Kalender sofort startklar',
        description:
          'Falls noch kein Kalender existiert, legt LX Family automatisch einen passenden Familienkalender an.'
      },
      {
        id: 'nextcloud-reliable-start',
        title: 'Sicherer Docker-Start',
        description:
          'Das Aktivierungsskript wartet auf die vollständige Einrichtung und ergänzt auf Wunsch die Nextcloud-Kalenderoberfläche.'
      },
    ],
    closing:
      'Das Update verändert keine Familieninhalte. Vorhandene Kalender, Profile, Aufgaben und Einstellungen bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: 'Family Cloud 现在自动完成配置',
        title: 'Nextcloud 无需密码拼图',
        intro:
          '随附的 Nextcloud 现在可以直接从家长中心连接，LX Family 会自动创建安全的云空间、家庭日历和文件文件夹。',
        highlights: [
          {
            id: 'nextcloud-one-click',
            title: '一键搞定，无需复制登录信息',
            description:
              '对于 Docker 云，只需提供浏览器地址即可，用户账户和应用密码自动生成。'
          },
          {
            id: 'nextcloud-family-isolation',
            title: '每个家庭相互隔离',
            description:
              '为每个注册的家庭创建独立的 Nextcloud 用户，配有各自的日历和文件空间。'
          },
          {
            id: 'nextcloud-calendar-ready',
            title: '日历即刻就绪',
            description:
              '如果还没有日历，LX Family 会自动创建一个合适的家庭日历。'
          },
          {
            id: 'nextcloud-reliable-start',
            title: '稳妥的 Docker 启动',
            description:
              '激活脚本会等待配置完全完成，并可按需补装 Nextcloud 日历界面。'
          },
        ],
        closing:
          '本次更新不改动任何家庭内容，现有的日历、成员资料、任务和设置都保持不变。'
      }
    }
  },
  '1.8.1': {
    version: '1.8.1',
    eyebrow: 'Das neue App-Symbol hat jetzt Luft',
    title: 'Keine abgeschnittenen Logo-Kanten mehr',
    intro:
      'Einige Android-Geräte vergrößern App-Symbole zusätzlich. Das LX-Motiv sitzt jetzt kleiner in einer großzügigen Sicherheitszone und bleibt bei runden, eckigen und herstellereigenen Formen vollständig sichtbar.',
    highlights: [
      {
        id: 'launcher-safe-area',
        title: 'Mehr Abstand zu allen Kanten',
        description:
          'Das eigentliche Kalender- und Familienmotiv wurde sauber auf 82 Prozent verkleinert.'
      },
      {
        id: 'adaptive-icon-masks',
        title: 'Für alle Android-Formen vorbereitet',
        description:
          'Runde Icons, Squircles und adaptive Launcher-Masken schneiden das Motiv nicht mehr an.'
      },
      {
        id: 'consistent-web-icon',
        title: 'Auch im Browser einheitlich',
        description:
          'Web-App, Startbildschirm und Android verwenden dieselbe neue Sicherheitszone.'
      },
      {
        id: 'icon-update-only',
        title: 'Familieninhalte bleiben unberührt',
        description:
          'Die Korrektur ändert nur Darstellung und App-Version – alle Daten und Einstellungen bleiben erhalten.'
      },
    ],
    closing:
      'Installiert Version 1.8.1 über die vorhandene App. Profile, Benachrichtigungen und Familieninhalte bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '新应用图标现在有了呼吸感',
        title: 'Logo 边缘不再被裁掉',
        intro:
          '部分安卓设备会额外放大应用图标。LX 图案现在缩小了，放在宽敞的安全区内，无论圆形、方形还是厂商定制形状，都能完整显示。',
        highlights: [
          {
            id: 'launcher-safe-area',
            title: '与各边缘留出更多间距',
            description:
              '日历与家庭主体图案已整齐地缩小到 82%。'
          },
          {
            id: 'adaptive-icon-masks',
            title: '适配所有安卓图标形状',
            description:
              '圆形图标、圆角方形和自适应启动器遮罩不再裁剪图案。'
          },
          {
            id: 'consistent-web-icon',
            title: '浏览器中也保持一致',
            description:
              '网页应用、主屏幕和安卓使用相同的新安全区。'
          },
          {
            id: 'icon-update-only',
            title: '家庭内容不受影响',
            description:
              '此次修正仅影响外观和应用版本——所有数据和设置都保持不变。'
          },
        ],
        closing:
          '直接在现有应用上安装 1.8.1 版本即可，成员资料、通知和家庭内容都将保留。'
      }
    }
  },
  '1.8.0': {
    version: '1.8.0',
    eyebrow: 'Kalender erinnert jetzt im richtigen Moment',
    title: 'Flexible Terminwecker und Müllabfuhr am Vortag',
    intro:
      'Für Termine lassen sich jetzt mehrere Erinnerungen wie in einem großen Kalender auswählen. Mülltermine erinnern automatisch einen Tag vorher, damit die richtige Tonne rechtzeitig draußen steht.',
    highlights: [
      {
        id: 'flexible-calendar-reminders',
        title: 'Mehrere Erinnerungen pro Termin',
        description:
          'Zum Beispiel 1 Tag, 1 Stunde und 10 Minuten vorher – einzeln oder gemeinsam.'
      },
      {
        id: 'trash-reminder-default',
        title: '„Morgen Hausmüll“ automatisch',
        description:
          'Neue, importierte und bereits vorhandene Abholtermine erinnern standardmäßig am Vortag.'
      },
      {
        id: 'trash-reminder-controls',
        title: 'Jede Abholung bleibt einstellbar',
        description:
          'Die Glocke am Mülltermin öffnet die Auswahl. Erinnerungen können geändert oder ganz ausgeschaltet werden.'
      },
      {
        id: 'new-family-app-icon',
        title: 'Neues LX-App-Symbol',
        description:
          'Haus, Kalender und Familie bilden jetzt ein klares gemeinsames Symbol auf Android und im Browser.'
      },
    ],
    closing:
      'Server und Android-App können normal aktualisiert werden. Alle Profile, Termine, Importe und Einstellungen bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '日历在恰当时刻提醒你',
        title: '灵活的日程提醒与提前一天的垃圾回收提醒',
        intro:
          '日程现在可以像大型日历应用一样设置多个提醒。垃圾回收日程会自动提前一天提醒，确保正确的垃圾桶及时放到外面。',
        highlights: [
          {
            id: 'flexible-calendar-reminders',
            title: '每个日程可设多个提醒',
            description:
              '例如提前 1 天、1 小时和 10 分钟——可单独设置，也可组合使用。'
          },
          {
            id: 'trash-reminder-default',
            title: '「明天倒生活垃圾」自动提醒',
            description:
              '新建、导入和已有的回收日程默认在前一天提醒。'
          },
          {
            id: 'trash-reminder-controls',
            title: '每次回收都可单独设置',
            description:
              '点击垃圾日程上的铃铛图标即可打开选项，提醒可以修改或完全关闭。'
          },
          {
            id: 'new-family-app-icon',
            title: '全新 LX 应用图标',
            description:
              '房子、日历和家庭现在融合成一个清晰的统一图标，出现在安卓和浏览器中。'
          },
        ],
        closing:
          '服务器和安卓应用可以正常更新，所有成员资料、日程、导入数据和设置都将保留。'
      }
    }
  },
  '1.7.7': {
    version: '1.7.7',
    eyebrow: 'Capacitor-Hänger gezielt behoben',
    title: 'Android kann die Push-Einrichtung jetzt wirklich abschließen',
    intro:
      'Die genaue Analyse hat einen offenen Fehler in Capacitor 8 sichtbar gemacht: Android-Pluginobjekte wurden versehentlich wie wartende Vorgänge behandelt und blieben deshalb bei „Android wird vorbereitet“ hängen. LX umgeht diesen Framework-Fehler jetzt sicher.',
    highlights: [
      {
        id: 'capacitor-thenable-workaround',
        title: 'Framework-Fehler sauber umgangen',
        description:
          'Das Android-Plugin wird nicht mehr selbst durch einen asynchronen Rückgabewert transportiert.'
      },
      {
        id: 'listeners-ready',
        title: 'Listener werden vollständig eingerichtet',
        description:
          'Benachrichtigungsempfang und Antippen einer Meldung können nun vor der Firebase-Anmeldung korrekt starten.'
      },
      {
        id: 'thenable-regression-test',
        title: 'Der konkrete Fehler ist getestet',
        description:
          'Ein automatischer Test bildet genau den fehlerhaften Capacitor-Proxy nach und verhindert eine spätere Rückkehr des Hängers.'
      },
      {
        id: 'direct-native-token-retained',
        title: 'Direkter Firebase-Weg bleibt aktiv',
        description:
          'Nach der Android-Vorbereitung liefert die native LX-Brücke den Geräteschlüssel direkt oder nennt die genaue Geräteursache.'
      },
    ],
    closing:
      'Installiert Version 1.7.7 über die vorhandene App. Profile, Anmeldung und Familiendaten bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: 'Capacitor 卡顿问题精准修复',
        title: 'Android 现在可以真正完成推送设置',
        intro:
          '深入分析发现了 Capacitor 8 的一个已知缺陷：Android 插件对象被误当作待处理任务，导致卡在“正在准备 Android”。LX 现在安全地绕过了这个框架问题。',
        highlights: [
          {
            id: 'capacitor-thenable-workaround',
            title: '框架问题已妥善绕过',
            description:
              'Android 插件不再通过异步返回值自行传递。'
          },
          {
            id: 'listeners-ready',
            title: '监听器完整就绪',
            description:
              '通知接收和点击通知现在可以在 Firebase 登录之前正确启动。'
          },
          {
            id: 'thenable-regression-test',
            title: '已针对该缺陷编写测试',
            description:
              '自动化测试精确复现了有缺陷的 Capacitor 代理，可防止该卡顿问题再次出现。'
          },
          {
            id: 'direct-native-token-retained',
            title: '直连 Firebase 的通道保留',
            description:
              'Android 准备完成后，原生 LX 桥接直接提供设备密钥，或给出确切的设备端原因。'
          },
        ],
        closing:
          '在现有 App 上直接安装 1.7.7 版本即可。用户资料、登录状态和家庭数据都会保留。'
      }
    }
  },
  '1.7.6': {
    version: '1.7.6',
    eyebrow: 'Firebase antwortet jetzt direkt',
    title: 'LX holt den Android-Geräteschlüssel ohne Umweg',
    intro:
      'Die bisherige Android-Erweiterung meldete das Firebase-Ergebnis auf dem betroffenen Handy nicht zuverlässig an die Oberfläche zurück. Eine eigene native LX-Brücke liefert den Geräteschlüssel jetzt direkt und prüft vorher Firebase sowie die Google Play-Dienste.',
    highlights: [
      {
        id: 'direct-fcm-token',
        title: 'Direkte Firebase-Anmeldung',
        description:
          'Der Geräteschlüssel wird direkt im nativen Android-Code abgerufen und als Ergebnis an LX zurückgegeben.'
      },
      {
        id: 'play-services-diagnostics',
        title: 'Google Play wird geprüft',
        description:
          'Fehlende oder veraltete Google Play-Dienste werden sofort verständlich benannt.'
      },
      {
        id: 'real-fcm-errors',
        title: 'Echte Ursache statt Zeitablauf',
        description:
          'Firebase-Fehler und mögliche Netzwerkblockaden erscheinen direkt im Verbindungsbereich.'
      },
      {
        id: 'safe-upgrade-176',
        title: 'Daten bleiben erhalten',
        description:
          'Version 1.7.6 kann über die vorhandene App installiert werden; Profile, Anmeldung und Familieninhalte bleiben bestehen.'
      },
    ],
    closing:
      'Installiert Version 1.7.6 über die vorhandene LX App und startet die Push-Anmeldung danach erneut.',
    localizations: {
      zh: {
        eyebrow: 'Firebase 现已直接响应',
        title: 'LX 直接获取 Android 设备密钥，无需绕行',
        intro:
          '之前的 Android 扩展在受影响的手机上无法可靠地把 Firebase 结果返回到界面。新的原生 LX 桥接现在直接提供设备密钥，并提前检查 Firebase 和 Google Play 服务。',
        highlights: [
          {
            id: 'direct-fcm-token',
            title: '直连 Firebase 登录',
            description:
              '设备密钥直接在原生 Android 代码中获取，并作为结果返回给 LX。'
          },
          {
            id: 'play-services-diagnostics',
            title: 'Google Play 服务检查',
            description:
              '缺失或过期的 Google Play 服务会立即以易懂的方式指出。'
          },
          {
            id: 'real-fcm-errors',
            title: '显示真正原因，而非超时',
            description:
              'Firebase 错误和可能的网络阻断会直接显示在连接区域。'
          },
          {
            id: 'safe-upgrade-176',
            title: '数据保留',
            description:
              '1.7.6 可直接覆盖安装到现有 App；用户资料、登录状态和家庭内容都将保留。'
          },
        ],
        closing:
          '在现有 LX App 上直接安装 1.7.6，然后重新启动推送登录。'
      }
    }
  },
  '1.7.5': {
    version: '1.7.5',
    eyebrow: 'Android-Push ist direkt in der App verankert',
    title: 'Das Push-Modul muss nicht mehr nachgeladen werden',
    intro:
      'Die neue Diagnose hat gezeigt, dass einzelne Android-Geräte beim separaten Nachladen des Push-Moduls hängen bleiben. LX liefert dieses Modul jetzt fest mit der App aus und kann sofort darauf zugreifen.',
    highlights: [
      {
        id: 'bundled-native-push',
        title: 'Push-Modul sofort verfügbar',
        description:
          'Die Android-Funktion steckt direkt im Hauptprogramm und benötigt beim Einschalten keine zusätzliche interne Datei mehr.'
      },
      {
        id: 'no-runtime-module-load',
        title: 'Kein Ladehänger mehr',
        description:
          'Der auf dem betroffenen Handy eindeutig erkannte Modul-Ladeschritt wurde vollständig entfernt.'
      },
      {
        id: 'continued-stage-diagnostics',
        title: 'Diagnose bleibt aktiv',
        description:
          'Alle folgenden Schritte zeigen weiterhin ihren Status und brechen bei einer fehlenden Android-Antwort verständlich ab.'
      },
      {
        id: 'update-over-existing-app',
        title: 'Einfach darüber installieren',
        description:
          'Profile, Anmeldung und Familiendaten bleiben beim Update auf Version 1.7.5 erhalten.'
      },
    ],
    closing:
      'Installiert Version 1.7.5 über die vorhandene LX App und schaltet die Android-Benachrichtigungen danach erneut ein.',
    localizations: {
      zh: {
        eyebrow: 'Android 推送已内置于 App',
        title: '推送模块无需再单独加载',
        intro:
          '最新诊断显示，部分 Android 设备在单独加载推送模块时会卡住。LX 现在把该模块直接内置在 App 中，可立即访问。',
        highlights: [
          {
            id: 'bundled-native-push',
            title: '推送模块立即可用',
            description:
              'Android 功能直接集成在主程序中，开启时无需额外的内部文件。'
          },
          {
            id: 'no-runtime-module-load',
            title: '不再有加载卡顿',
            description:
              '已彻底移除在受影响手机上确认导致卡顿的模块加载步骤。'
          },
          {
            id: 'continued-stage-diagnostics',
            title: '诊断继续有效',
            description:
              '后续所有步骤仍会显示状态；若 Android 没有响应，会以易懂的方式中断。'
          },
          {
            id: 'update-over-existing-app',
            title: '直接覆盖安装',
            description:
              '升级到 1.7.5 时，用户资料、登录状态和家庭数据都会保留。'
          },
        ],
        closing:
          '在现有 LX App 上直接安装 1.7.5，然后重新开启 Android 通知。'
      }
    }
  },
  '1.7.4': {
    version: '1.7.4',
    eyebrow: 'Android-Push zeigt jetzt genau, was passiert',
    title: 'Kein Verbindungsschritt kann mehr endlos hängen',
    intro:
      'LX überwacht jetzt den gesamten Android-Verbindungsweg – vom Start des Push-Moduls bis zum Speichern auf dem Familienserver. Statt eines endlosen Ladekreises seht ihr den aktuellen Schritt und bei einem Problem eine verständliche Ursache.',
    highlights: [
      {
        id: 'native-stage-status',
        title: 'Aktueller Schritt sichtbar',
        description:
          'Beim Einschalten steht direkt am Knopf, ob LX gerade Android, die Berechtigung, Firebase oder den Familienserver prüft.'
      },
      {
        id: 'native-all-stage-watchdogs',
        title: 'Jeder Schritt ist abgesichert',
        description:
          'Auch ein Hänger vor der eigentlichen Firebase-Anmeldung wird nun automatisch erkannt und beendet.'
      },
      {
        id: 'native-persistent-error',
        title: 'Fehler bleibt lesbar',
        description:
          'Die genaue Meldung bleibt unter dem Verbindungsbereich stehen und verschwindet nicht zusammen mit einer kurzen Einblendung.'
      },
      {
        id: 'native-safe-data',
        title: 'Familiendaten bleiben unverändert',
        description:
          'Das Update ändert nur die Android-Geräteanmeldung; Profile, Termine, Chats und Einstellungen bleiben erhalten.'
      },
    ],
    closing:
      'Installiert Version 1.7.4 einfach über die vorhandene LX App. Ein Löschen der App ist nicht nötig.',
    localizations: {
      zh: {
        eyebrow: 'Android 推送现在清楚显示每一步',
        title: '连接步骤不会再无限卡住',
        intro:
          'LX 现在监控整个 Android 连接流程——从推送模块启动到保存至家庭服务器。不再有无休止的加载圈，你能看到当前步骤；出现问题时，也会看到易懂的原因说明。',
        highlights: [
          {
            id: 'native-stage-status',
            title: '当前步骤清晰可见',
            description:
              '开启时，按钮旁边直接显示 LX 正在检查 Android、权限、Firebase 还是家庭服务器。'
          },
          {
            id: 'native-all-stage-watchdogs',
            title: '每一步都有保护',
            description:
              '即使是 Firebase 正式登录之前的卡顿，现在也会被自动检测并终止。'
          },
          {
            id: 'native-persistent-error',
            title: '错误信息持续可见',
            description:
              '详细错误信息会保留在连接区域下方，不会随着短暂提示一起消失。'
          },
          {
            id: 'native-safe-data',
            title: '家庭数据保持不变',
            description:
              '本次更新只改动 Android 设备登录；用户资料、日程、聊天和设置都将保留。'
          },
        ],
        closing:
          '在现有 LX App 上直接安装 1.7.4 即可，无需删除 App。'
      }
    }
  },
  '1.7.3': {
    version: '1.7.3',
    eyebrow: 'Push-Anmeldung bleibt nicht mehr hängen',
    title: 'LX gibt jetzt immer eine klare Rückmeldung',
    intro:
      'Wenn Android oder Google Play bei der Geräteanmeldung nicht antwortet, wartet LX nicht mehr endlos. Nach spätestens 20 Sekunden seht ihr die konkrete Ursache.',
    highlights: [
      {
        id: 'native-registration-watchdog',
        title: 'Kein endloses Verbinden',
        description:
          'Der Zeitwächter läuft jetzt unabhängig vom internen Android-Aufruf.'
      },
      {
        id: 'native-registration-result',
        title: 'Klare Rückmeldung',
        description:
          'Die Anmeldung ist entweder erfolgreich oder nennt nach spätestens 20 Sekunden den nächsten sinnvollen Prüfschritt.'
      },
      {
        id: 'stuck-plugin-test',
        title: 'Festhängen automatisch getestet',
        description:
          'Ein neuer Test bildet einen nativen Aufruf nach, der überhaupt nicht antwortet.'
      },
      {
        id: 'unchanged-family-data',
        title: 'Familiendaten bleiben unberührt',
        description:
          'Die Korrektur betrifft ausschließlich die Android-Geräteanmeldung.'
      },
    ],
    closing:
      'Die vorhandene App bitte direkt auf Version 1.7.3 aktualisieren; vorheriges Löschen ist nicht nötig.',
    localizations: {
      zh: {
        eyebrow: '推送登录不再卡住',
        title: 'LX 现在总会给出明确反馈',
        intro:
          '如果 Android 或 Google Play 在设备登录时没有响应，LX 不会再无休止等待。最多 20 秒后，你会看到具体原因。',
        highlights: [
          {
            id: 'native-registration-watchdog',
            title: '告别无休止的连接',
            description:
              '计时保护现在独立于内部 Android 调用运行。'
          },
          {
            id: 'native-registration-result',
            title: '明确的反馈',
            description:
              '登录要么成功，要么在最多 20 秒后给出下一个合理的检查步骤。'
          },
          {
            id: 'stuck-plugin-test',
            title: '卡顿场景自动测试',
            description:
              '新测试模拟了一个完全无响应的原生调用。'
          },
          {
            id: 'unchanged-family-data',
            title: '家庭数据不受影响',
            description:
              '本次修复只涉及 Android 设备登录。'
          },
        ],
        closing:
          '请直接将现有 App 升级到 1.7.3，无需事先删除。'
      }
    }
  },
  '1.7.2': {
    version: '1.7.2',
    eyebrow: 'Android-Push klar erkannt',
    title: 'LX zeigt jetzt immer den richtigen Verbindungsstatus',
    intro:
      'Der Familienserver meldet seine Firebase-Verbindung nun direkt beim Start der App. Ein Problem auf dem Handy kann deshalb nicht mehr wie eine fehlende Servereinrichtung aussehen.',
    highlights: [
      {
        id: 'bootstrap-firebase-status',
        title: 'Serverstatus direkt beim Start',
        description:
          'Die bereits funktionierende Familienverbindung liefert gleichzeitig den bestätigten Firebase-Status.'
      },
      {
        id: 'honest-push-errors',
        title: 'Verständliche Fehlermeldungen',
        description:
          'Falls das Handy den Push-Status nicht abrufen kann, zeigt LX die wirkliche Ursache statt eines falschen Firebase-Hinweises.'
      },
      {
        id: 'compatible-installation-id',
        title: 'Auch für ältere Android-WebViews',
        description:
          'Die lokale Gerätekennung funktioniert jetzt auch dann, wenn eine moderne Browserfunktion auf dem Handy noch fehlt.'
      },
      {
        id: 'retry-native-status',
        title: 'Direkt erneut prüfen',
        description:
          'In der Elternzentrale lässt sich die Verbindung nach einem Fehler mit einem Knopfdruck neu abfragen.'
      },
    ],
    closing:
      'Alle Profile, Inhalte und Einstellungen bleiben erhalten. Die Android-App muss einmal auf Version 1.7.2 aktualisiert werden.',
    localizations: {
      zh: {
        eyebrow: 'Android 推送状态清晰识别',
        title: 'LX 现在总显示正确的连接状态',
        intro:
          '家庭服务器现在会在 App 启动时直接报告其 Firebase 连接状态。因此，手机上的问题不会再被误看成服务器未配置。',
        highlights: [
          {
            id: 'bootstrap-firebase-status',
            title: '启动时直接显示服务器状态',
            description:
              '已正常工作的家庭连接会同时带来确认的 Firebase 状态。'
          },
          {
            id: 'honest-push-errors',
            title: '易懂的错误提示',
            description:
              '如果手机无法获取推送状态，LX 会显示真正的原因，而不是误导性的 Firebase 提示。'
          },
          {
            id: 'compatible-installation-id',
            title: '兼容旧版 Android WebView',
            description:
              '即使手机缺少较新的浏览器功能，本地设备标识现在也能正常工作。'
          },
          {
            id: 'retry-native-status',
            title: '一键重新检查',
            description:
              '在家长中心中，出错后只需按一下按钮即可重新查询连接状态。'
          },
        ],
        closing:
          '所有用户资料、内容和设置都会保留。Android App 需升级到 1.7.2。'
      }
    }
  },
  '1.7.1': {
    version: '1.7.1',
    eyebrow: 'Android-Push ist jetzt startklar',
    title: 'Die Firebase-Verbindung wird zuverlässig erkannt',
    intro:
      'LX prüft Server und Android-Berechtigung jetzt getrennt. Dadurch lässt sich die App auch dann sauber für Meldungen anmelden, wenn Android zunächst eine zusätzliche Rückfrage zeigt.',
    highlights: [
      {
        id: 'accurate-firebase-status',
        title: 'Kein falscher Firebase-Hinweis mehr',
        description:
          'Die Elternzentrale erkennt die eingerichtete Serververbindung unabhängig von der Berechtigungsabfrage des Handys.'
      },
      {
        id: 'fresh-native-status',
        title: 'Status wird frisch geladen',
        description:
          'Beim Öffnen der Benachrichtigungseinstellungen fragt LX den aktuellen Zustand erneut beim Familienserver ab.'
      },
      {
        id: 'android-permission-prompts',
        title: 'Android-Rückfragen funktionieren',
        description:
          'Auch Geräte, die vor der Freigabe noch einen zusätzlichen Hinweis anzeigen, öffnen anschließend den richtigen Systemdialog.'
      },
      {
        id: 'uncached-push-status',
        title: 'Immer der aktuelle Zustand',
        description:
          'LX übernimmt für die Benachrichtigungseinrichtung keine veraltete Serverantwort mehr aus dem Zwischenspeicher.'
      },
    ],
    closing:
      'Alle Familieninhalte und Einstellungen bleiben erhalten. Für diese Korrektur muss die Android-App einmal auf Version 1.7.1 aktualisiert werden.',
    localizations: {
      zh: {
        eyebrow: 'Android 推送已就绪',
        title: 'Firebase 连接稳定识别',
        intro:
          'LX 现在分别检查服务器和 Android 权限。即使 Android 先弹出额外的确认提示，App 也能干净地完成通知注册。',
        highlights: [
          {
            id: 'accurate-firebase-status',
            title: '不再有错误的 Firebase 提示',
            description:
              '家长中心能独立于手机的权限弹窗，识别已配置好的服务器连接。'
          },
          {
            id: 'fresh-native-status',
            title: '状态实时加载',
            description:
              '打开通知设置时，LX 会再次向家庭服务器查询最新状态。'
          },
          {
            id: 'android-permission-prompts',
            title: 'Android 确认提示正常',
            description:
              '即使某些设备在授权前会再显示一条额外提示，之后也会打开正确的系统对话框。'
          },
          {
            id: 'uncached-push-status',
            title: '永远显示最新状态',
            description:
              '在通知设置中，LX 不再使用缓存中的过期服务器响应。'
          },
        ],
        closing:
          '所有家庭内容和设置都会保留。本次修复需将 Android App 升级到 1.7.1。'
      }
    }
  },
  '1.7.0': {
    version: '1.7.0',
    eyebrow: 'Neu: echte Android-Benachrichtigungen',
    title: 'LX meldet sich jetzt auch im Hintergrund',
    intro:
      'Wichtige Familienmeldungen erreichen die Android-App jetzt als richtige Systembenachrichtigung – auch wenn LX gerade nicht geöffnet ist.',
    highlights: [
      {
        id: 'native-android-push',
        title: 'Meldungen auch bei geschlossener App',
        description:
          'Chatnachrichten, Termine, Erinnerungen und weitere wichtige Ereignisse erscheinen direkt in der Android-Benachrichtigungsleiste.'
      },
      {
        id: 'profile-notifications',
        title: 'Passend zum aktiven Profil',
        description:
          'Jedes Gerät wird mit dem gewählten Familienprofil verbunden. Die bekannten Benachrichtigungsschalter bestimmen weiterhin, was ankommen darf.'
      },
      {
        id: 'useful-categories',
        title: 'Dringendes ist klar erkennbar',
        description:
          'Kalender, Chat, Aufgaben, Problemmeldungen und das Befinden von Kindern erhalten passende Benachrichtigungskategorien und Prioritäten.'
      },
      {
        id: 'direct-navigation',
        title: 'Antippen und direkt nachsehen',
        description:
          'Ein Tipp auf eine Meldung öffnet LX und führt möglichst direkt zum betroffenen Bereich.'
      },
    ],
    closing:
      'Alle Familieninhalte und Einstellungen bleiben erhalten. Die Android-App muss für diese Funktion einmal aktualisiert werden.',
    localizations: {
      zh: {
        eyebrow: '新增：真正的 Android 通知',
        title: 'LX 现在也能在后台提醒你',
        intro:
          '重要家庭消息现在会作为真正的系统通知送达 Android App——即使 LX 当前没有打开。',
        highlights: [
          {
            id: 'native-android-push',
            title: 'App 关闭也能收到消息',
            description:
              '聊天消息、日程、提醒等重要事件会直接出现在 Android 通知栏中。'
          },
          {
            id: 'profile-notifications',
            title: '贴合当前用户资料',
            description:
              '每台设备都会绑定所选的家庭成员资料。熟悉的通知开关依然决定哪些消息可以送达。'
          },
          {
            id: 'useful-categories',
            title: '紧急事项一目了然',
            description:
              '日历、聊天、任务、问题反馈和孩子的心情都会获得合适的通知类别和优先级。'
          },
          {
            id: 'direct-navigation',
            title: '点击直达相关页面',
            description:
              '点击一条通知即可打开 LX，并尽量直接跳转到相关区域。'
          },
        ],
        closing:
          '所有家庭内容和设置都会保留。要使用此功能，Android App 需要更新一次。'
      }
    }
  },
  '1.6.0': {
    version: '1.6.0',
    eyebrow: 'Neu: eure eigene Family Cloud',
    title: 'LX Family und Nextcloud arbeiten jetzt zusammen',
    intro:
      'Kalender, Familienordner und verschlüsselte Sicherungen lassen sich direkt in der Elternzentrale verbinden – auf Wunsch mit einer mitgelieferten Nextcloud.',
    highlights: [
      {
        id: 'nextcloud-docker',
        title: 'Nextcloud einfach mitstarten',
        description:
          'Ein Hilfsskript richtet Nextcloud, Datenbank und Zwischenspeicher mit zufälligen Kennwörtern im vorhandenen Docker-Stack ein.'
      },
      {
        id: 'nextcloud-calendar',
        title: 'Kalender in beide Richtungen',
        description:
          'Neue, geänderte und gelöschte Termine werden automatisch abgeglichen. Bei gleichzeitigen Änderungen bleibt eine Konfliktkopie erhalten.'
      },
      {
        id: 'nextcloud-backup',
        title: 'Sichere Familienarchive',
        description:
          'Jede Familie erhält ein eigenes verschlüsseltes Cloud-Backup. Andere Familienkonten auf demselben Server werden nicht mitgesichert.'
      },
      {
        id: 'family-cloud-center',
        title: 'Alles verständlich an einem Ort',
        description:
          'Kalender, Profilzuordnung, Oma-und-Opa-Termine, Sicherungszeit und Verbindungsstatus werden in der neuen Family-Cloud-Karte verwaltet.'
      },
    ],
    closing:
      'Vorhandene Termine und Einstellungen bleiben erhalten; Nextcloud ist vollständig optional.',
    localizations: {
      zh: {
        eyebrow: '新增：你们的专属 Family Cloud',
        title: 'LX Family 与 Nextcloud 协同工作',
        intro:
          '可以直接在家长中心连接日历、家庭文件夹和加密备份——还可以选择使用附带的 Nextcloud。',
        highlights: [
          {
            id: 'nextcloud-docker',
            title: '轻松随手启动 Nextcloud',
            description:
              '一个辅助脚本会在现有 Docker 堆栈中自动配置 Nextcloud、数据库和缓存，并生成随机密码。'
          },
          {
            id: 'nextcloud-calendar',
            title: '日历双向同步',
            description:
              '新建、修改和删除的日程会自动同步。双方同时修改时，会保留一个冲突副本。'
          },
          {
            id: 'nextcloud-backup',
            title: '安全的家庭存档',
            description:
              '每个家庭都拥有独立加密的云备份。同一服务器上的其他家庭账户不会被一起备份。'
          },
          {
            id: 'family-cloud-center',
            title: '所有信息一目了然',
            description:
              '日历、资料绑定、爷爷奶奶的日程、备份时间和连接状态都可以在新的 Family Cloud 卡片中管理。'
          },
        ],
        closing:
          '现有日程和设置都会保留；Nextcloud 完全可选。'
      }
    }
  },
  '1.5.0': {
    version: '1.5.0',
    eyebrow: 'Neu für euren Heimserver',
    title: 'LX lässt sich jetzt besonders einfach auf Proxmox installieren',
    intro:
      'Für Proxmox VE gibt es jetzt einen geführten Installer mit sicheren Voreinstellungen, automatischem Docker-Setup und eigener Verwaltung.',
    highlights: [
      {
        id: 'pve-one-liner',
        title: 'Ein Befehl genügt',
        description:
          'Der neue Proxmox-Helper erstellt einen fertigen LX-Container und führt verständlich durch die Einrichtung.'
      },
      {
        id: 'pve-safe-container',
        title: 'Sicherer eigener Container',
        description:
          'LX läuft getrennt in einem unprivilegierten Debian-Container. Vorhandene Container werden nicht überschrieben.'
      },
      {
        id: 'pve-management',
        title: 'Einfache Verwaltung',
        description:
          'Updates, Backups, Status, Protokolle und die öffentliche Adresse lassen sich über ein gemeinsames LX-Kommando verwalten.'
      },
      {
        id: 'docker-apk-delivery',
        title: 'Android-App vollständig dabei',
        description:
          'Neue Docker- und Proxmox-Installationen liefern die signierte Android-App jetzt zuverlässig über Download und QR-Code aus.'
      },
    ],
    closing:
      'Bestehende Familieninhalte und Einstellungen bleiben beim normalen Update erhalten.',
    localizations: {
      zh: {
        eyebrow: '为你们的家庭服务器而设',
        title: 'LX 现在可以非常方便地安装在 Proxmox 上',
        intro:
          'Proxmox VE 现在有了引导式安装器：安全预配置、自动 Docker 部署，并配有独立管理工具。',
        highlights: [
          {
            id: 'pve-one-liner',
            title: '一条命令搞定',
            description:
              '新的 Proxmox 助手会创建一个现成的 LX 容器，并用易懂的步骤引导你完成设置。'
          },
          {
            id: 'pve-safe-container',
            title: '安全独立的容器',
            description:
              'LX 独立运行在无特权的 Debian 容器中，不会覆盖现有容器。'
          },
          {
            id: 'pve-management',
            title: '轻松管理',
            description:
              '更新、备份、状态、日志和公网地址都可以通过统一的 LX 命令管理。'
          },
          {
            id: 'docker-apk-delivery',
            title: 'Android App 完整附带',
            description:
              '新的 Docker 和 Proxmox 安装现在会通过下载和二维码可靠地提供签名版 Android App。'
          },
        ],
        closing:
          '常规更新时，现有家庭内容和设置都会保留。'
      }
    }
  },
  '1.4.1': {
    version: '1.4.1',
    eyebrow: 'Kleine App-Verbesserung',
    title: 'Der QR-Code führt jetzt sicher zum richtigen Server',
    intro:
      'Der App-Download erkennt jetzt, ob LX über eure echte Adresse oder nur als lokale Vorschau geöffnet wurde.',
    highlights: [
      {
        id: 'public-qr-address',
        title: 'Richtige Download-Adresse',
        description:
          'Auf eurer öffentlichen Startseite führt der QR-Code direkt zur Android-App auf eurem LX-Server.'
      },
      {
        id: 'localhost-protection',
        title: 'Kein falscher Localhost-Code',
        description:
          'In einer lokalen Vorschau wird kein QR-Code mehr gezeigt, der auf dem Handy ins Leere führen würde.'
      },
      {
        id: 'home-network-qr',
        title: 'Funktioniert auch im Heimnetz',
        description:
          'Öffnet ihr LX über die Heimnetz-Adresse des Servers, kann diese Adresse direkt mit dem Handy gescannt werden.'
      },
      {
        id: 'configurable-public-url',
        title: 'Öffentliche Adresse fest einstellbar',
        description:
          'Der Server kann seine öffentliche LX-Adresse nun ausdrücklich für Downloads und QR-Codes verwenden.'
      },
    ],
    closing:
      'Der normale Download-Knopf bleibt auch in der lokalen Vorschau verfügbar.',
    localizations: {
      zh: {
        eyebrow: '小改进',
        title: '二维码现在可靠地指向正确的服务器',
        intro:
          'App 下载现在能识别 LX 是通过你们的真实地址打开的，还是仅为本地预览。',
        highlights: [
          {
            id: 'public-qr-address',
            title: '正确的下载地址',
            description:
              '在你们的公开起始页上，二维码会直接指向你们 LX 服务器上的 Android App。'
          },
          {
            id: 'localhost-protection',
            title: '不再有错误的本地二维码',
            description:
              '在本地预览中，不会再显示在手机上扫码无响应的二维码。'
          },
          {
            id: 'home-network-qr',
            title: '家庭网络也适用',
            description:
              '如果通过服务器的家庭网络地址打开 LX，这个地址可以直接用手机扫码。'
          },
          {
            id: 'configurable-public-url',
            title: '可固定设置公开地址',
            description:
              '服务器现在可以明确指定其公开 LX 地址，用于下载和二维码。'
          },
        ],
        closing:
          '普通下载按钮在本地预览中依然可用。'
      }
    }
  },
  '1.4.0': {
    version: '1.4.0',
    eyebrow: 'Neu im Familienplaner',
    title: 'Die Familien-App ist da',
    intro:
      'LX lässt sich jetzt direkt von eurer Startseite als richtige Android-App installieren – ohne App-Store und passend zu eurem eigenen Server.',
    highlights: [
      {
        id: 'android-download',
        title: 'Direkter App-Download',
        description:
          'Auf der öffentlichen Startseite findet ihr einen klaren Download-Knopf mit aktueller Version und Dateigröße.'
      },
      {
        id: 'qr-download',
        title: 'Einfach per QR-Code',
        description:
          'Öffnet die Startseite am Computer, scannt den Code mit dem Handy und ladet die App direkt herunter.'
      },
      {
        id: 'signed-updates',
        title: 'Sicher signierte Updates',
        description:
          'Die Android-App wird dauerhaft mit demselben privaten Schlüssel signiert, damit spätere Versionen sauber über die bestehende App installiert werden können.'
      },
      {
        id: 'self-hosted-app',
        title: 'Bleibt bei euch',
        description:
          'APK, QR-Code und Download laufen über euren LX-Server. Ein externer App-Store ist nicht nötig.'
      },
    ],
    closing:
      'Alle Profile, Benachrichtigungen und Familiendaten bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '家庭计划新增',
        title: '家庭 App 来了',
        intro:
          'LX 现在可以直接从你们的起始页安装为真正的 Android App——无需应用商店，适配你们自己的服务器。',
        highlights: [
          {
            id: 'android-download',
            title: '直接下载 App',
            description:
              '在公开起始页上可以找到醒目的下载按钮，并附带当前版本和文件大小。'
          },
          {
            id: 'qr-download',
            title: '扫码轻松下载',
            description:
              '在电脑上打开起始页，用手机扫码即可直接下载 App。'
          },
          {
            id: 'signed-updates',
            title: '安全签名的更新',
            description:
              'Android App 始终使用同一私钥签名，确保未来版本可以干净地覆盖安装到现有 App 上。'
          },
          {
            id: 'self-hosted-app',
            title: '数据留在自己家',
            description:
              'APK、二维码和下载都经由你们的 LX 服务器，无需外部应用商店。'
          },
        ],
        closing:
          '所有用户资料、通知和家庭数据都会保留。'
      }
    }
  },
  '1.3.1': {
    version: '1.3.1',
    eyebrow: 'Neu im Familienplaner',
    title: 'Nichts Wichtiges mehr verpassen',
    intro:
      'Benachrichtigungen begleiten jetzt den ganzen Familienalltag – gezielt für die richtigen Profile und ohne unnötige Meldungsflut.',
    highlights: [
      {
        id: 'notification-coverage',
        title: 'Mehr wichtige Meldungen',
        description:
          'Chat, Termine, Problemmeldungen, Gefühlslage der Kinder, Familiennetz, Schule, Belohnungen und Taschengeld melden sich jetzt zuverlässig.'
      },
      {
        id: 'calendar-changes',
        title: 'Kalender bleibt aktuell',
        description:
          'Neue, geänderte und abgesagte Termine sowie eure gewählten Erinnerungszeitpunkte erreichen automatisch die betroffenen Profile.'
      },
      {
        id: 'child-care',
        title: 'Kinder im Blick',
        description:
          'Erwachsene erfahren von neuen Gefühlslagen, erledigten Schulsachen, Tagesroutinen und Familienmissionen. „Brauche Nähe“ bleibt besonders dringend.'
      },
      {
        id: 'notification-control',
        title: 'Alles selbst einstellbar',
        description:
          'Jede Meldungsart lässt sich pro Profil und Gerät für Browser-Push sowie zentral für Gotify ein- oder ausschalten.'
      },
    ],
    closing:
      'Bestehende Geräte, Push-Einstellungen, Termine und alle anderen Familiendaten bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '家庭计划新增',
        title: '不再错过重要事项',
        intro:
          '通知现在陪伴整个家庭日常——精准推送到正确的用户资料，不会产生多余的消息轰炸。',
        highlights: [
          {
            id: 'notification-coverage',
            title: '更多重要提醒',
            description:
              '聊天、日程、问题反馈、孩子的心情、家庭网络、学校、奖励和零花钱现在都会可靠地推送。'
          },
          {
            id: 'calendar-changes',
            title: '日历始终最新',
            description:
              '新建、修改和取消的日程，以及你们设置的提醒时间，都会自动送达相关用户资料。'
          },
          {
            id: 'child-care',
            title: '孩子近况尽在掌握',
            description:
              '家长可以了解孩子的新心情、完成的学校事项、日常作息和家庭任务。“需要陪伴”仍然是最高优先级。'
          },
          {
            id: 'notification-control',
            title: '一切都可自定义',
            description:
              '每种消息类型都可以按用户资料和设备单独开关浏览器推送，也可以统一控制 Gotify 推送。'
          },
        ],
        closing:
          '现有设备、推送设置、日程和其他所有家庭数据都会保留。'
      }
    }
  },
  '1.3.0': {
    version: '1.3.0',
    eyebrow: 'Neu im Familienplaner',
    title: 'Pünktlich sein, lecker teilen',
    intro:
      'Dieses Update erinnert euch rechtzeitig an Termine und bringt geteilte Rezepte ohne Umwege ins Familienkochbuch.',
    highlights: [
      {
        id: 'event-reminders',
        title: 'Mehrere Erinnerungen pro Termin',
        description:
          'Wählt zum Beispiel einen Tag, zehn Stunden, eine Stunde und zehn Minuten vorher. Jeder Termin kann seine eigenen Zeitpunkte bekommen.'
      },
      {
        id: 'reliable-alerts',
        title: 'Erinnerungen auch im Hintergrund',
        description:
          'Hinweise landen im Familien-Posteingang, als Web-Push und bei verbundener Einrichtung auch auf Gotify.'
      },
      {
        id: 'recipe-sharing',
        title: 'Von Chefkoch direkt zu LX',
        description:
          'Auf Android kann die installierte LX-App Rezept-Links aus Chefkoch, Pinterest und anderen Apps über das Teilen-Menü übernehmen.'
      },
      {
        id: 'safe-scheduling',
        title: 'Keine doppelten Wecker',
        description:
          'Der Server merkt sich bereits versendete Erinnerungen und holt nach einem Neustart nur den sinnvollsten noch offenen Hinweis nach.'
      },
    ],
    closing:
      'Alle vorhandenen Termine, Rezepte, Profile und Einstellungen bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '家庭计划新增',
        title: '准时出席，美味分享',
        intro:
          '本次更新会准时提醒你们的日程，并把分享来的食谱直接收进家庭菜谱。',
        highlights: [
          {
            id: 'event-reminders',
            title: '每个日程多重提醒',
            description:
              '例如可以选择提前一天、十小时、一小时和十分钟提醒。每个日程都可以设置自己的提醒时间。'
          },
          {
            id: 'reliable-alerts',
            title: '后台也有可靠提醒',
            description:
              '提醒会进入家庭收件箱、以网页推送形式送达，连接了 Gotify 的话也会推送过去。'
          },
          {
            id: 'recipe-sharing',
            title: '从 Chefkoch 一键导入 LX',
            description:
              '在 Android 上，已安装的 LX App 可以通过分享菜单接收来自 Chefkoch、Pinterest 和其他应用的食谱链接。'
          },
          {
            id: 'safe-scheduling',
            title: '不会重复提醒',
            description:
              '服务器会记住已发送的提醒，重启后只补发最有意义的那条未发送提醒。'
          },
        ],
        closing:
          '所有现有日程、食谱、用户资料和设置都会保留。'
      }
    }
  },
  '1.2.0': {
    version: '1.2.0',
    eyebrow: 'Neu im Familienplaner',
    title: 'Mehr Überblick, mehr Familienzeit',
    intro:
      'Dieses Update macht euren Familienalltag leichter, persönlicher und auf allen Geräten angenehmer.',
    highlights: [
      {
        id: 'profiles',
        title: 'Mehr Platz für eure Familie',
        description:
          'Oma, Opa, betreute Personen und Haustiere lassen sich passend organisieren. Verbundene Familien können gemeinsam planen.'
      },
      {
        id: 'tasks',
        title: 'Faire Aufgaben & Belohnungen',
        description:
          'Erledigte Kinderaufgaben warten auf die Bestätigung eines Erwachsenen. Belohnungen können eigene Bilder und Symbole bekommen.'
      },
      {
        id: 'kids',
        title: 'Eine spannendere Kinderwelt',
        description:
          'Routinen, Sparziele, Taschengeld, Schule, Familienmissionen und freigegebene YouTube- oder Spotify-Kacheln sind direkt erreichbar.'
      },
      {
        id: 'food',
        title: 'Essen & Einkaufen ohne Umwege',
        description:
          'Der Einkauf bietet viele Standardprodukte. Rezepte lassen sich aus mehr Portalen übernehmen und verständlicher Schritt für Schritt kochen.'
      },
      {
        id: 'notifications',
        title: 'Nichts Wichtiges verpassen',
        description:
          'Benachrichtigungen werden pro Profil und Gerät verwaltet. Der Familien-Posteingang sammelt wichtige Hinweise an einem Ort.'
      },
      {
        id: 'home',
        title: 'Schöner, smarter, leichter',
        description:
          'Neue Themen, bessere Ansichten für Handy und Tablet, Home Assistant und der Knopf „Problem melden“ runden das Update ab.'
      },
    ],
    closing:
      'Alle bisherigen Termine, Aufgaben, Rezepte, Listen und Einstellungen bleiben erhalten.',
    localizations: {
      zh: {
        eyebrow: '家庭计划新增',
        title: '更清晰的概览，更多的家庭时光',
        intro:
          '本次更新让你们的家庭日常更轻松、更贴心，在所有设备上都更好用。',
        highlights: [
          {
            id: 'profiles',
            title: '给家庭更多空间',
            description:
              '爷爷、奶奶、被照顾的家人和宠物都可以妥善管理。关联的家庭可以一起规划。'
          },
          {
            id: 'tasks',
            title: '公平的任务与奖励',
            description:
              '孩子完成的任务等待家长确认。奖励可以配上自定义图片和图标。'
          },
          {
            id: 'kids',
            title: '更精彩的儿童天地',
            description:
              '日常作息、存钱目标、零花钱、学校、家庭任务以及已分享的 YouTube 或 Spotify 卡片都触手可及。'
          },
          {
            id: 'food',
            title: '吃饭购物一步到位',
            description:
              '购物清单提供丰富的常用商品。食谱可以从更多网站导入，并以更易懂的方式一步步指导烹饪。'
          },
          {
            id: 'notifications',
            title: '不再错过重要事项',
            description:
              '通知按用户资料和设备分别管理。家庭收件箱把重要提醒集中在一处。'
          },
          {
            id: 'home',
            title: '更美、更智能、更轻便',
            description:
              '新主题、手机和平板更好的视图、Home Assistant 集成以及“反馈问题”按钮为本次更新画上句号。'
          },
        ],
        closing:
          '所有已有日程、任务、食谱、清单和设置都会保留。'
      }
    }
  }
};

export function releaseNotesForVersion(version) {
  return RELEASE_NOTES[String(version)] || {
    version: String(version || 'Neu'),
    eyebrow: 'Familienplaner aktualisiert',
    title: 'Eine neue Version ist da',
    intro:
      'Im Hintergrund wurden Funktionen verbessert und kleine Fehler behoben.',
    highlights: [],
    closing: 'Eure gespeicherten Inhalte und Einstellungen bleiben erhalten.'
  };
}
