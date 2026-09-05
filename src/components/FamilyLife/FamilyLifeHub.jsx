import React, { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  BadgeEuro,
  BellOff,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Coins,
  GraduationCap,
  HeartHandshake,
  Medal,
  MapPin,
  Mail,
  MessageCircleHeart,
  Phone,
  PiggyBank,
  Pencil,
  Plus,
  RotateCw,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  UsersRound,
  Vote
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import {
  canManageFamily,
  isChildProfile,
  isManagedProfile
} from '../../constants/roles';
import {
  formatCurrency,
  formatDate,
  getWeekdayNames
} from '../../utils/formatting';
import { eventIsForMember } from '../../../shared/calendarAudience.js';
import {
  SCHOOL_SUBJECT_COLORS,
  normalizeSchoolSubjectKey,
  resolveSchoolSubjectColor
} from '../../../shared/schoolSubjectColors.js';

const SECTIONS = [
  { id: 'today', labelKey: 'sections.today', icon: Sparkles },
  { id: 'routines', labelKey: 'sections.routines', icon: AlarmClock },
  { id: 'money', labelKey: 'sections.money', icon: PiggyBank },
  { id: 'school', labelKey: 'sections.school', icon: GraduationCap },
  { id: 'contacts', labelKey: 'sections.contacts', icon: Phone },
  { id: 'polls', labelKey: 'sections.polls', icon: Vote },
  { id: 'safety', labelKey: 'sections.safety', icon: ShieldAlert }
];

const ROUTINE_ICONS = ['☀️', '🎒', '🪥', '🛁', '🌙', '⚡'];
const MISSION_ICONS = ['🤝', '🏡', '🌳', '🎲', '🍕', '🚲'];
const ENCOURAGEMENT_ICONS = ['💛', '🌟', '🦁', '🚀', '🦄', '💪'];
const GOAL_ICONS = ['🎯', '🚲', '🎮', '📚', '🎸', '🛼'];
const SCHOOL_KIND = {
  lesson: { labelKey: 'school.kinds.lesson', icon: '📘' },
  homework: { labelKey: 'school.kinds.homework', icon: '✏️' },
  exam: { labelKey: 'school.kinds.exam', icon: '🧠' },
  bag: { labelKey: 'school.kinds.bag', icon: '🎒' }
};
const CONTACT_CATEGORIES = [
  { id: 'medical', icon: '🩺' },
  { id: 'services', icon: '🛠️' },
  { id: 'school', icon: '🎓' },
  { id: 'authorities', icon: '🏛️' },
  { id: 'insurance', icon: '🛡️' },
  { id: 'emergency', icon: '🚨' },
  { id: 'other', icon: '☎️' }
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function euro(cents = 0) {
  return formatCurrency(Number(cents || 0) / 100, 'EUR');
}

function lastSevenDateKeys() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return localDateKey(date);
  });
}

function dateKeyForWeekday(weekday, { next = false } = {}) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const currentWeekday = date.getDay();
  let offset = Number(weekday) - currentWeekday;
  if (next && offset < 0) offset += 7;
  if (!next) {
    const mondayOffset = (currentWeekday + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    offset = Number(weekday) - 1;
  }
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function routineStreak(routine) {
  let streak = 0;
  const cursor = new Date();
  for (let index = 0; index < 45; index += 1) {
    const key = localDateKey(cursor);
    const completed = new Set(routine.completions?.[key] || []);
    if (completed.size !== routine.steps?.length) {
      if (index === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function PanelHeader({ kicker, title, icon: Icon, children }) {
  return (
    <header className="family-life-panel-header">
      <div>
        <span>{kicker}</span>
        <h2><Icon size={21} /> {title}</h2>
      </div>
      {children}
    </header>
  );
}

function Creator({ title, children, open = false }) {
  return (
    <details className="family-life-creator" open={open}>
      <summary><Plus size={16} /> {title}</summary>
      {children}
    </details>
  );
}

export default function FamilyLifeHub() {
  const { t } = useTranslation('familyLife');
  const {
    activeMember,
    members,
    tasks,
    events,
    dailyRoutines,
    savingsGoals,
    pocketMoneyTransactions,
    schoolItems,
    familyPolls,
    encouragements,
    familyMissions,
    familyContacts,
    familySettings,
    kidProfiles,
    addFamilyLifeRecord,
    updateFamilyLifeRecord,
    deleteFamilyLifeRecord,
    toggleRoutineStep,
    toggleSchoolItem,
    voteFamilyPoll,
    toggleFamilyMission,
    addPocketMoneyTransaction,
    updateKidProfile
  } = useFamily();
  const isAdult = canManageFamily(activeMember);
  const children = useMemo(
    () =>
      members.filter(
        member =>
          !isManagedProfile(member) &&
          ['child', 'teen'].includes(member.role)
      ),
    [members]
  );
  const [section, setSection] = useState('today');
  const [selectedMemberId, setSelectedMemberId] = useState(
    isChildProfile(activeMember) ? activeMember.id : children[0]?.id || ''
  );
  const selectedMember =
    members.find(member => member.id === selectedMemberId) ||
    (isChildProfile(activeMember) ? activeMember : children[0]) ||
    activeMember;
  const selectedId = selectedMember?.id || '';
  const today = localDateKey();
  const weekdays = getWeekdayNames('long', false);

  useEffect(() => {
    if (isChildProfile(activeMember)) {
      setSelectedMemberId(activeMember.id);
    } else if (!members.some(member => member.id === selectedMemberId)) {
      setSelectedMemberId(children[0]?.id || '');
    }
  }, [activeMember, children, members, selectedMemberId]);

  const [routineForm, setRoutineForm] = useState({
    title: t('routines.defaults.title'),
    timeOfDay: 'morning',
    icon: '☀️',
    steps: t('routines.defaults.steps')
  });
  const [goalForm, setGoalForm] = useState({
    title: '',
    amount: '25',
    icon: '🎯'
  });
  const [moneyForm, setMoneyForm] = useState({
    amount: '2',
    starCost: '0',
    note: t('money.booking.defaultNote')
  });
  const [schoolForm, setSchoolForm] = useState({
    kind: 'homework',
    title: '',
    subject: '',
    date: today,
    weekday: String(new Date().getDay()),
    time: '',
    endTime: '',
    period: '1',
    room: '',
    teacher: '',
    details: '',
    color: ''
  });
  const [editingSchoolItemId, setEditingSchoolItemId] = useState('');
  const [schoolColorWasChosen, setSchoolColorWasChosen] = useState(false);
  const [cancellationDates, setCancellationDates] = useState({});
  const [activeLessonId, setActiveLessonId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('all');
  const [editingContactId, setEditingContactId] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    category: 'other',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [pollForm, setPollForm] = useState({
    question: '',
    options: t('polls.form.defaultOptions'),
    closesAt: ''
  });
  const [encouragementForm, setEncouragementForm] = useState({
    message: '',
    icon: '💛'
  });
  const [missionForm, setMissionForm] = useState({
    title: '',
    description: '',
    icon: '🤝',
    dueDate: ''
  });
  const settings = familySettings[0] || null;
  const [settingsForm, setSettingsForm] = useState({
    quietHoursEnabled: false,
    quietStart: '20:00',
    quietEnd: '07:00',
    urgentDuringQuietHours: true,
    mediaScheduleEnabled: false,
    mediaStart: '15:00',
    mediaEnd: '19:30',
    emergencyTitle: t('safety.emergency.defaultTitle'),
    emergencyContacts: '',
    emergencyNotes: ''
  });

  useEffect(() => {
    if (!settings) return;
    setSettingsForm({
      quietHoursEnabled: Boolean(settings.quietHoursEnabled),
      quietStart: settings.quietStart || '20:00',
      quietEnd: settings.quietEnd || '07:00',
      urgentDuringQuietHours: settings.urgentDuringQuietHours !== false,
      mediaScheduleEnabled: Boolean(settings.mediaScheduleEnabled),
      mediaStart: settings.mediaStart || '15:00',
      mediaEnd: settings.mediaEnd || '19:30',
      emergencyTitle:
        settings.emergencyTitle || t('safety.emergency.defaultTitle'),
      emergencyContacts: (settings.emergencyContacts || [])
        .map(contact =>
          [contact.name, contact.phone, contact.note].filter(Boolean).join(' | ')
        )
        .join('\n'),
      emergencyNotes: settings.emergencyNotes || ''
    });
  }, [settings?.updatedAt]);

  const myRoutines = dailyRoutines.filter(
    routine => routine.memberId === selectedId && routine.active !== false
  );
  const mySchoolItems = schoolItems.filter(item => item.memberId === selectedId);
  const selectedKidProfile = kidProfiles.find(
    profile => profile.memberId === selectedId
  );
  const schoolEnabled =
    selectedKidProfile &&
    Object.hasOwn(selectedKidProfile, 'schoolEnabled')
      ? selectedKidProfile.schoolEnabled === true
      : mySchoolItems.length > 0;
  const schoolSubjectColors = selectedKidProfile?.schoolSubjectColors || {};
  const visibleSections =
    SECTIONS.filter(item =>
      (item.id !== 'school' || isAdult || schoolEnabled) &&
      (item.id !== 'contacts' || isAdult)
    );
  const timetableLessons = mySchoolItems
    .filter(item => item.kind === 'lesson')
    .sort((left, right) =>
      `${left.weekday}${String(left.period || 0).padStart(2, '0')}${left.time || ''}`
        .localeCompare(
          `${right.weekday}${String(right.period || 0).padStart(2, '0')}${right.time || ''}`
        )
    );
  const timetablePeriods = Array.from(
    {
      length: Math.max(
        8,
        ...timetableLessons.map(lesson => Math.min(20, Math.max(1, Number(lesson.period) || 1)))
      )
    },
    (_, index) => index + 1
  );
  const activeTimetableLesson = timetableLessons.find(
    lesson => lesson.id === activeLessonId
  );
  const activeLessonCancellationDate = activeTimetableLesson
    ? cancellationDates[activeTimetableLesson.id] ||
      dateKeyForWeekday(activeTimetableLesson.weekday, { next: true })
    : '';
  const activeLessonCancellationDateMatches = activeTimetableLesson
    ? new Date(`${activeLessonCancellationDate}T12:00:00`).getDay() ===
      Number(activeTimetableLesson.weekday)
    : false;
  const activeLessonDateCancelled = activeTimetableLesson?.cancellations?.includes(
    activeLessonCancellationDate
  );
  const visibleFamilyContacts = familyContacts
    .filter(contact =>
      contactCategoryFilter === 'all' || contact.category === contactCategoryFilter
    )
    .filter(contact => {
      const query = contactSearch.trim().toLocaleLowerCase();
      if (!query) return true;
      return [
        contact.name,
        contact.phone,
        contact.email,
        contact.address,
        contact.notes
      ].some(value => String(value || '').toLocaleLowerCase().includes(query));
    })
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
  useEffect(() => {
    if (!isAdult && !schoolEnabled && section === 'school') {
      setSection('today');
    }
  }, [isAdult, schoolEnabled, section]);
  const myTransactions = pocketMoneyTransactions
    .filter(transaction => transaction.memberId === selectedId)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
  const pocketBalance = myTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amountCents || 0),
    0
  );
  const myGoals = savingsGoals.filter(goal => goal.memberId === selectedId);
  const myEncouragements = encouragements
    .filter(item => item.memberId === selectedId)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
  const myMissions = familyMissions.filter(mission =>
    mission.memberIds?.includes(selectedId)
  );

  const weekKeys = lastSevenDateKeys();
  const completedTasksThisWeek = tasks.filter(task =>
    task.memberId === selectedId &&
    task.completed &&
    weekKeys.some(key =>
      new Date(Number(task.completionApprovedAt || task.createdAt || 0))
        .toLocaleDateString('en-CA') === key
    )
  ).length;
  const routineDays = new Set(
    myRoutines.flatMap(routine =>
      weekKeys.filter(key =>
        (routine.completions?.[key] || []).length === routine.steps?.length
      )
    )
  ).size;
  const participation = familyPolls.filter(
    poll => Boolean(poll.votes?.[selectedId])
  ).length;
  const nextEvent = events
    .filter(event =>
      eventIsForMember(event, selectedId) &&
      (!event.date || event.date >= today)
    )
    .sort((left, right) =>
      `${left.date || ''}${left.time || ''}`.localeCompare(
        `${right.date || ''}${right.time || ''}`
      )
    )[0];
  const achievements = [
    {
      icon: '🌱',
      title: t('achievements.firstStep'),
      reached: completedTasksThisWeek > 0 || routineDays > 0
    },
    {
      icon: '🔥',
      title: t('achievements.routinePro'),
      reached: Math.max(0, ...myRoutines.map(routineStreak)) >= 3
    },
    {
      icon: '⭐',
      title: t('achievements.starCollector'),
      reached: Number(selectedMember?.stars || 0) >= 50
    },
    {
      icon: '🤝',
      title: t('achievements.teamSpirit'),
      reached: myMissions.some(mission =>
        mission.completedMemberIds?.includes(selectedId)
      )
    }
  ];

  const createRoutine = async event => {
    event.preventDefault();
    const steps = routineForm.steps
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((title, index) => ({
        id: `step-${Date.now()}-${index}`,
        title,
        icon: ['1', '2', '3', '4', '5', '6'][index] || '✓'
      }));
    const created = await addFamilyLifeRecord('dailyRoutines', {
      memberId: selectedId,
      title: routineForm.title,
      icon: routineForm.icon,
      timeOfDay: routineForm.timeOfDay,
      steps
    });
    if (created) setRoutineForm(previous => ({ ...previous, title: '' }));
  };

  const createGoal = async event => {
    event.preventDefault();
    const created = await addFamilyLifeRecord('savingsGoals', {
      memberId: selectedId,
      title: goalForm.title,
      icon: goalForm.icon,
      targetCents: Math.round(Number(goalForm.amount) * 100)
    });
    if (created) setGoalForm(previous => ({ ...previous, title: '' }));
  };

  const bookMoney = async event => {
    event.preventDefault();
    const created = await addPocketMoneyTransaction({
      memberId: selectedId,
      amountCents: Math.round(Number(moneyForm.amount) * 100),
      starCost: Math.max(0, Number(moneyForm.starCost || 0)),
      note: moneyForm.note,
      icon: Number(moneyForm.amount) < 0 ? '🧾' : '💶'
    });
    if (created) {
      setMoneyForm(previous => ({ ...previous, starCost: '0' }));
    }
  };

  const createSchoolItem = async event => {
    event.preventDefault();
    const payload = {
      memberId: selectedId,
      ...schoolForm,
      weekday: Number(schoolForm.weekday)
    };
    const saved = editingSchoolItemId
      ? await updateFamilyLifeRecord('schoolItems', editingSchoolItemId, payload)
      : await addFamilyLifeRecord('schoolItems', payload);
    if (saved) {
      const subjectKey = normalizeSchoolSubjectKey(schoolForm.subject);
      const storedSubjectColor = subjectKey
        ? schoolSubjectColors[subjectKey] || ''
        : '';
      if (
        schoolColorWasChosen &&
        subjectKey &&
        storedSubjectColor !== schoolForm.color
      ) {
        const nextSchoolSubjectColors = { ...schoolSubjectColors };
        if (schoolForm.color) {
          nextSchoolSubjectColors[subjectKey] = schoolForm.color;
        } else {
          delete nextSchoolSubjectColors[subjectKey];
        }
        await updateKidProfile(selectedId, {
          schoolSubjectColors: nextSchoolSubjectColors
        });
      }
      setEditingSchoolItemId('');
      setSchoolColorWasChosen(false);
      setSchoolForm(previous => ({
        ...previous,
        title: '',
        subject: '',
        details: '',
        color: ''
      }));
    }
  };

  const resetContactForm = () => {
    setEditingContactId('');
    setContactForm({
      name: '',
      category: 'other',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
  };

  const saveFamilyContact = async event => {
    event.preventDefault();
    const saved = editingContactId
      ? await updateFamilyLifeRecord('familyContacts', editingContactId, contactForm)
      : await addFamilyLifeRecord('familyContacts', contactForm);
    if (saved) resetContactForm();
  };

  const editFamilyContact = contact => {
    setEditingContactId(contact.id);
    setContactForm({
      name: contact.name || '',
      category: contact.category || 'other',
      phone: contact.phone || '',
      email: contact.email || '',
      address: contact.address || '',
      notes: contact.notes || ''
    });
    document.getElementById('family-contact-editor')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const editSchoolItem = item => {
    if (!isAdult) return;
    setEditingSchoolItemId(item.id);
    setSchoolColorWasChosen(false);
    setActiveLessonId(item.id);
    setSchoolForm({
      kind: item.kind || 'homework',
      title: item.title || '',
      subject: item.subject || '',
      date: item.date || today,
      weekday: String(Number(item.weekday) || 1),
      time: item.time || '',
      endTime: item.endTime || '',
      period: String(Number(item.period) || 1),
      room: item.room || '',
      teacher: item.teacher || '',
      details: item.details || '',
      color: resolveSchoolSubjectColor(
        item.subject,
        schoolSubjectColors,
        item.color
      )
    });
    document.getElementById('school-item-editor')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const startLessonForSlot = (weekday, period) => {
    if (!isAdult) return;
    setEditingSchoolItemId('');
    setSchoolColorWasChosen(false);
    setActiveLessonId('');
    setSchoolForm(previous => ({
      ...previous,
      kind: 'lesson',
      title: '',
      subject: '',
      weekday: String(weekday),
      period: String(period),
      time: '',
      endTime: '',
      room: '',
      teacher: '',
      details: '',
      color: ''
    }));
    document.getElementById('school-item-editor')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const setSchoolEnabled = async enabled => {
    if (!isAdult || !selectedId) return;
    await updateKidProfile(selectedId, { schoolEnabled: enabled });
  };

  const toggleLessonCancellation = async lesson => {
    if (!isAdult) return;
    const date = cancellationDates[lesson.id] ||
      dateKeyForWeekday(lesson.weekday, { next: true });
    if (new Date(`${date}T12:00:00`).getDay() !== Number(lesson.weekday)) {
      return;
    }
    const current = Array.isArray(lesson.cancellations)
      ? lesson.cancellations
      : [];
    const cancellations = current.includes(date)
      ? current.filter(entry => entry !== date)
      : [...current, date];
    await updateFamilyLifeRecord('schoolItems', lesson.id, {
      cancellations
    });
  };

  const createPoll = async event => {
    event.preventDefault();
    const options = pollForm.options
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const match = line.match(/^(\p{Extended_Pictographic})?\s*(.*)$/u);
        return {
          id: `option-${Date.now()}-${index}`,
          emoji: match?.[1] || ['👍', '🎉', '💛'][index] || '✨',
          label: match?.[2] || line
        };
      });
    const created = await addFamilyLifeRecord('familyPolls', {
      question: pollForm.question,
      options,
      closesAt: pollForm.closesAt
    });
    if (created) setPollForm(previous => ({ ...previous, question: '' }));
  };

  const sendEncouragement = async event => {
    event.preventDefault();
    const created = await addFamilyLifeRecord('encouragements', {
      memberId: selectedId,
      message: encouragementForm.message,
      icon: encouragementForm.icon
    });
    if (created) setEncouragementForm(previous => ({ ...previous, message: '' }));
  };

  const createMission = async event => {
    event.preventDefault();
    const created = await addFamilyLifeRecord('familyMissions', {
      title: missionForm.title,
      description: missionForm.description,
      icon: missionForm.icon,
      dueDate: missionForm.dueDate,
      memberIds: children.map(child => child.id)
    });
    if (created) {
      setMissionForm(previous => ({ ...previous, title: '', description: '' }));
    }
  };

  const saveSettings = async event => {
    event.preventDefault();
    const emergencyContacts = settingsForm.emergencyContacts
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name = '', phone = '', note = ''] = line
          .split('|')
          .map(value => value.trim());
        return {
          id: `contact-${index}-${name.toLowerCase().replace(/\W+/g, '-')}`,
          name,
          phone,
          note,
          icon: index === 0 ? '🚑' : '☎️'
        };
      });
    const payload = { ...settingsForm, emergencyContacts };
    if (settings) {
      await updateFamilyLifeRecord(
        'familySettings',
        settings.id,
        payload
      );
    } else {
      await addFamilyLifeRecord('familySettings', {
        id: 'family-settings',
        ...payload
      });
    }
  };

  return (
    <div className="family-life">
      <section className="family-life-hero">
        <div className="family-life-hero-copy">
          <span><HeartHandshake size={17} /> {t('hero.kicker')}</span>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.intro')}</p>
        </div>
        <div className="family-life-hero-orbit" aria-hidden="true">
          <i>☀️</i><i>🎒</i><i>⭐</i>
        </div>
        <div className="family-life-person">
          {isAdult && children.length > 0 ? (
            <label>
              <span>{t('hero.viewFor')}</span>
              <select
                value={selectedId}
                onChange={event => setSelectedMemberId(event.target.value)}
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <span>{t('hero.yourJourney')}</span>
              <strong>{selectedMember?.name}</strong>
            </>
          )}
        </div>
      </section>

      <nav className="family-life-nav" aria-label={t('hero.navAria')}>
        {visibleSections.map(item => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.id}
              className={section === item.id ? 'active' : ''}
              onClick={() => setSection(item.id)}
            >
              <Icon size={18} />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {section === 'today' && (
        <div className="family-life-section family-weekly">
          <section className="family-life-panel weekly-story">
            <PanelHeader
              kicker={t('weekly.kicker')}
              title={t('weekly.title', { name: selectedMember?.name })}
              icon={Trophy}
            />
            <div className="weekly-metrics">
              <article><Check /><strong>{completedTasksThisWeek}</strong><span>{t('weekly.metrics.missions')}</span></article>
              <article><RotateCw /><strong>{routineDays}</strong><span>{t('weekly.metrics.routineDays')}</span></article>
              <article><Vote /><strong>{participation}</strong><span>{t('weekly.metrics.polls')}</span></article>
              <article><Star /><strong>{selectedMember?.stars || 0}</strong><span>{t('weekly.metrics.stars')}</span></article>
            </div>
            <div className="weekly-message">
              <span>{completedTasksThisWeek + routineDays >= 5 ? '🏆' : '🌱'}</span>
              <div>
                <strong>
                  {completedTasksThisWeek + routineDays >= 5
                    ? t('weekly.strongWeek')
                    : t('weekly.everyStepCounts')}
                </strong>
                <p>
                  {nextEvent
                    ? t('weekly.nextEvent', { title: nextEvent.title })
                    : t('weekly.spontaneousMoment')}
                </p>
              </div>
            </div>
          </section>

          <section className="family-life-panel achievement-cabinet">
            <PanelHeader kicker={t('achievements.kicker')} title={t('achievements.title')} icon={Medal} />
            <div className="achievement-grid">
              {achievements.map(achievement => (
                <article
                  key={achievement.title}
                  className={achievement.reached ? 'reached' : ''}
                >
                  <span>{achievement.icon}</span>
                  <strong>{achievement.title}</strong>
                  <small>{achievement.reached ? t('achievements.collected') : t('achievements.stillSecret')}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="family-life-panel team-missions">
            <PanelHeader kicker={t('missions.kicker')} title={t('missions.title')} icon={UsersRound} />
            <div className="team-mission-list">
              {myMissions.map(mission => {
                const done = mission.completedMemberIds?.includes(selectedId);
                const total = mission.memberIds?.length || 1;
                const completed = mission.completedMemberIds?.length || 0;
                return (
                  <article key={mission.id} className={done ? 'done' : ''}>
                    <button
                      type="button"
                      onClick={() => toggleFamilyMission(mission.id, selectedId)}
                    >
                      <span>{mission.icon || '🤝'}</span>
                      <div>
                        <strong>{mission.title}</strong>
                        <small>{mission.description || t('missions.progress', { completed, total })}</small>
                      </div>
                      <i>{done ? <Check size={17} /> : <ChevronRight size={17} />}</i>
                    </button>
                    <div><span style={{ width: `${(completed / total) * 100}%` }} /></div>
                  </article>
                );
              })}
              {!myMissions.length && (
                <div className="family-life-empty">{t('missions.empty')}</div>
              )}
            </div>
            {isAdult && children.length > 0 && (
              <Creator title={t('missions.creatorTitle')}>
                <form onSubmit={createMission} className="family-life-form">
                  <input
                    value={missionForm.title}
                    onChange={event => setMissionForm(previous => ({ ...previous, title: event.target.value }))}
                    placeholder={t('missions.titlePlaceholder')}
                    required
                  />
                  <textarea
                    value={missionForm.description}
                    onChange={event => setMissionForm(previous => ({ ...previous, description: event.target.value }))}
                    placeholder={t('missions.descriptionPlaceholder')}
                  />
                  <div className="emoji-choice">
                    {MISSION_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={missionForm.icon === icon ? 'active' : ''}
                        onClick={() => setMissionForm(previous => ({ ...previous, icon }))}
                      >{icon}</button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={missionForm.dueDate}
                    onChange={event => setMissionForm(previous => ({ ...previous, dueDate: event.target.value }))}
                  />
                  <button className="family-life-primary"><Plus size={16} /> {t('missions.start')}</button>
                </form>
              </Creator>
            )}
          </section>

          <section className="family-life-panel encouragement-panel">
            <PanelHeader kicker={t('encouragement.kicker')} title={t('encouragement.title')} icon={MessageCircleHeart} />
            {myEncouragements[0] ? (
              <blockquote>
                <span>{myEncouragements[0].icon || '💛'}</span>
                <p>{t('encouragement.quote', { message: myEncouragements[0].message })}</p>
                <footer>– {myEncouragements[0].createdByName || t('encouragement.fromFamily')}</footer>
              </blockquote>
            ) : (
              <div className="family-life-empty">{t('encouragement.empty')}</div>
            )}
            {isAdult && selectedId && (
              <form onSubmit={sendEncouragement} className="encouragement-form">
                <div className="emoji-choice">
                  {ENCOURAGEMENT_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={encouragementForm.icon === icon ? 'active' : ''}
                      onClick={() => setEncouragementForm(previous => ({ ...previous, icon }))}
                    >{icon}</button>
                  ))}
                </div>
                <input
                  value={encouragementForm.message}
                  onChange={event => setEncouragementForm(previous => ({ ...previous, message: event.target.value }))}
                  placeholder={t('encouragement.messagePlaceholder', { name: selectedMember?.name })}
                  required
                />
                <button className="family-life-primary">{t('encouragement.send')}</button>
              </form>
            )}
          </section>
        </div>
      )}

      {section === 'routines' && (
        <div className="family-life-section routines-workshop">
          <section className="family-life-panel">
            <PanelHeader kicker={t('routines.kicker')} title={t('routines.title', { name: selectedMember?.name })} icon={AlarmClock} />
            <div className="routine-grid">
              {myRoutines.map(routine => {
                const completed = new Set(routine.completions?.[today] || []);
                const percent = Math.round(
                  (completed.size / Math.max(1, routine.steps?.length || 1)) * 100
                );
                return (
                  <article className="routine-card" key={routine.id}>
                    <header>
                      <span>{routine.icon || '☀️'}</span>
                      <div>
                        <small>{routine.timeOfDay === 'evening' ? t('routines.timeOfDay.evening') : routine.timeOfDay === 'afternoon' ? t('routines.timeOfDay.afternoon') : t('routines.timeOfDay.morning')}</small>
                        <h3>{routine.title}</h3>
                      </div>
                      <strong>{percent}%</strong>
                    </header>
                    <div className="routine-track"><span style={{ width: `${percent}%` }} /></div>
                    <div className="routine-steps">
                      {routine.steps?.map(step => (
                        <button
                          type="button"
                          key={step.id}
                          className={completed.has(step.id) ? 'done' : ''}
                          onClick={() => toggleRoutineStep(routine.id, step.id, today)}
                        >
                          <i>{completed.has(step.id) ? <Check size={17} /> : step.icon}</i>
                          <span>{step.title}</span>
                        </button>
                      ))}
                    </div>
                    <footer>
                      <span>{t('routines.streak', { count: routineStreak(routine) })}</span>
                      {isAdult && (
                        <button
                          type="button"
                          onClick={() => deleteFamilyLifeRecord('dailyRoutines', routine.id)}
                          aria-label={t('routines.deleteAria')}
                        ><Trash2 size={15} /></button>
                      )}
                    </footer>
                  </article>
                );
              })}
              {!myRoutines.length && (
                <div className="family-life-empty large">
                  <span>☀️</span>
                  <strong>{t('routines.emptyTitle')}</strong>
                  <p>{t('routines.emptyText')}</p>
                </div>
              )}
            </div>
          </section>
          {isAdult && selectedId && (
            <section className="family-life-panel">
              <PanelHeader kicker={t('routines.workshop.kicker')} title={t('routines.workshop.title')} icon={ClipboardList} />
              <form onSubmit={createRoutine} className="family-life-form routine-form">
                <div className="form-row">
                  <input
                    value={routineForm.title}
                    onChange={event => setRoutineForm(previous => ({ ...previous, title: event.target.value }))}
                    placeholder={t('routines.workshop.namePlaceholder')}
                    required
                  />
                  <select
                    value={routineForm.timeOfDay}
                    onChange={event => setRoutineForm(previous => ({ ...previous, timeOfDay: event.target.value }))}
                  >
                    <option value="morning">{t('routines.timeOfDay.morning')}</option>
                    <option value="afternoon">{t('routines.timeOfDay.afternoon')}</option>
                    <option value="evening">{t('routines.timeOfDay.evening')}</option>
                  </select>
                </div>
                <div className="emoji-choice">
                  {ROUTINE_ICONS.map(icon => (
                    <button
                      type="button"
                      key={icon}
                      className={routineForm.icon === icon ? 'active' : ''}
                      onClick={() => setRoutineForm(previous => ({ ...previous, icon }))}
                    >{icon}</button>
                  ))}
                </div>
                <label>
                  <span>{t('routines.workshop.stepsLabel')}</span>
                  <textarea
                    rows="6"
                    value={routineForm.steps}
                    onChange={event => setRoutineForm(previous => ({ ...previous, steps: event.target.value }))}
                    required
                  />
                </label>
                <button className="family-life-primary"><Plus size={16} /> {t('routines.workshop.save')}</button>
              </form>
            </section>
          )}
        </div>
      )}

      {section === 'money' && (
        <div className="family-life-section money-world">
          <section className="family-life-panel pocket-account">
            <PanelHeader kicker={t('money.kicker')} title={t('money.title', { name: selectedMember?.name })} icon={Coins} />
            <div className="pocket-balance">
              <span><PiggyBank size={35} /></span>
              <div><small>{t('money.balanceLabel')}</small><strong>{euro(pocketBalance)}</strong></div>
              <i>{t('money.starsAvailable', { count: selectedMember?.stars || 0 })}</i>
            </div>
            <div className="pocket-ledger">
              {myTransactions.slice(0, 8).map(transaction => (
                <article key={transaction.id}>
                  <span>{transaction.icon || '💶'}</span>
                  <div>
                    <strong>{transaction.note}</strong>
                    <small>
                      {formatDate(transaction.createdAt)}
                      {transaction.starCost ? ` · ${t('money.starCost', { count: transaction.starCost })}` : ''}
                    </small>
                  </div>
                  <b className={transaction.amountCents < 0 ? 'minus' : ''}>
                    {transaction.amountCents > 0 ? '+' : ''}{euro(transaction.amountCents)}
                  </b>
                </article>
              ))}
              {!myTransactions.length && (
                <div className="family-life-empty">{t('money.emptyLedger')}</div>
              )}
            </div>
          </section>

          <section className="family-life-panel savings-panel">
            <PanelHeader kicker={t('money.goals.kicker')} title={t('money.goals.title')} icon={Target} />
            <div className="saving-goals">
              {myGoals.map(goal => {
                const percent = Math.min(
                  100,
                  Math.round((pocketBalance / Math.max(1, goal.targetCents)) * 100)
                );
                return (
                  <article key={goal.id} style={{ '--goal-color': goal.color }}>
                    <span>{goal.icon || '🎯'}</span>
                    <div>
                      <strong>{goal.title}</strong>
                      <small>{t('money.goals.progress', { current: euro(pocketBalance), target: euro(goal.targetCents) })}</small>
                      <div><i style={{ width: `${percent}%` }} /></div>
                    </div>
                    <b>{percent}%</b>
                    {isAdult && (
                      <button
                        type="button"
                        onClick={() => deleteFamilyLifeRecord('savingsGoals', goal.id)}
                        aria-label={t('money.goals.deleteAria')}
                      ><Trash2 size={14} /></button>
                    )}
                  </article>
                );
              })}
              {!myGoals.length && (
                <div className="family-life-empty">{t('money.goals.empty')}</div>
              )}
            </div>
            {isAdult && selectedId && (
              <Creator title={t('money.goals.creatorTitle')}>
                <form onSubmit={createGoal} className="family-life-form">
                  <input
                    value={goalForm.title}
                    onChange={event => setGoalForm(previous => ({ ...previous, title: event.target.value }))}
                    placeholder={t('money.goals.titlePlaceholder')}
                    required
                  />
                  <div className="form-row">
                    <input
                      type="number"
                      min="1"
                      step="0.50"
                      value={goalForm.amount}
                      onChange={event => setGoalForm(previous => ({ ...previous, amount: event.target.value }))}
                      aria-label={t('money.goals.amountAria')}
                      required
                    />
                    <div className="emoji-choice compact">
                      {GOAL_ICONS.map(icon => (
                        <button
                          type="button"
                          key={icon}
                          className={goalForm.icon === icon ? 'active' : ''}
                          onClick={() => setGoalForm(previous => ({ ...previous, icon }))}
                        >{icon}</button>
                      ))}
                    </div>
                  </div>
                  <button className="family-life-primary">{t('money.goals.create')}</button>
                </form>
              </Creator>
            )}
          </section>

          {isAdult && selectedId && (
            <section className="family-life-panel money-booking">
              <PanelHeader kicker={t('adultsOnly')} title={t('money.booking.title')} icon={BadgeEuro} />
              <form onSubmit={bookMoney} className="family-life-form">
                <label><span>{t('money.booking.amountLabel')}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={moneyForm.amount}
                    onChange={event => setMoneyForm(previous => ({ ...previous, amount: event.target.value }))}
                    required
                  />
                </label>
                <label><span>{t('money.booking.noteLabel')}</span>
                  <input
                    value={moneyForm.note}
                    onChange={event => setMoneyForm(previous => ({ ...previous, note: event.target.value }))}
                    required
                  />
                </label>
                <label><span>{t('money.booking.starsLabel')}</span>
                  <input
                    type="number"
                    min="0"
                    max={selectedMember?.stars || 0}
                    value={moneyForm.starCost}
                    onChange={event => setMoneyForm(previous => ({ ...previous, starCost: event.target.value }))}
                  />
                </label>
                <button className="family-life-primary"><Coins size={16} /> {t('money.booking.submit')}</button>
              </form>
            </section>
          )}
        </div>
      )}

      {section === 'school' && (
        <div className="family-life-section school-desk">
          <section className="family-life-panel school-overview">
            <PanelHeader kicker={t('school.kicker')} title={t('school.title', { name: selectedMember?.name })} icon={GraduationCap}>
              {isAdult && (
                <button
                  type="button"
                  className={`school-feature-switch ${schoolEnabled ? 'is-on' : ''}`}
                  onClick={() => setSchoolEnabled(!schoolEnabled)}
                  aria-pressed={schoolEnabled}
                >
                  {schoolEnabled
                    ? t('school.settings.enabled')
                    : t('school.settings.disabled')}
                </button>
              )}
            </PanelHeader>
            {!schoolEnabled ? (
              <div className="school-disabled-state">
                <span><GraduationCap size={28} /></span>
                <div>
                  <strong>{t('school.settings.disabledTitle')}</strong>
                  <p>{t('school.settings.disabledHint')}</p>
                </div>
                {isAdult && (
                  <button type="button" onClick={() => setSchoolEnabled(true)}>
                    {t('school.settings.enable')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="school-timetable" role="grid">
                  <div className="school-timetable-corner">{t('school.timetable.periodLabel')}</div>
                  {[1, 2, 3, 4, 5].map(weekday => {
                    const currentDate = dateKeyForWeekday(weekday);
                    return (
                      <div key={`day-${weekday}`} className="school-timetable-day" role="columnheader">
                        <strong>{weekdays[weekday]}</strong>
                        <small>{formatDate(`${currentDate}T12:00:00`, {
                          day: '2-digit',
                          month: '2-digit'
                        })}</small>
                      </div>
                    );
                  })}
                  {timetablePeriods.flatMap(period => {
                    const periodLessons = timetableLessons.filter(
                      lesson => Number(lesson.period || 1) === period
                    );
                    const periodTimes = periodLessons
                      .map(lesson => [lesson.time, lesson.endTime].filter(Boolean).join('–'))
                      .filter(Boolean);
                    return [
                      <div key={`period-${period}`} className="school-timetable-period" role="rowheader">
                        <strong>{period}</strong>
                        <span>{t('school.timetable.periodShort')}</span>
                        {periodTimes[0] && <small>{periodTimes[0]}</small>}
                      </div>,
                      ...[1, 2, 3, 4, 5].map(weekday => {
                        const lessonsInSlot = periodLessons.filter(
                          lesson => Number(lesson.weekday) === weekday
                        );
                        const currentDate = dateKeyForWeekday(weekday);
                        if (!lessonsInSlot.length) {
                          return isAdult ? (
                            <button
                              key={`empty-${weekday}-${period}`}
                              type="button"
                              className="school-empty-slot"
                              onClick={() => startLessonForSlot(weekday, period)}
                              aria-label={`${weekdays[weekday]}, ${t('school.timetable.period', { count: period })}`}
                            >
                              <Plus size={15} />
                            </button>
                          ) : (
                            <div key={`empty-${weekday}-${period}`} className="school-empty-slot is-read-only">
                              <span>–</span>
                            </div>
                          );
                        }
                        return (
                          <div key={`lesson-${weekday}-${period}`} className="school-timetable-cell" role="gridcell">
                            {lessonsInSlot.map(lesson => {
                              const cancelled = lesson.cancellations?.includes(currentDate);
                              const lessonActionsOpen = activeLessonId === lesson.id;
                              const lessonColor = resolveSchoolSubjectColor(
                                lesson.subject,
                                schoolSubjectColors,
                                lesson.color
                              );
                              return (
                                <button
                                  key={lesson.id}
                                  type="button"
                                  className={`school-lesson-card ${lessonColor ? 'has-custom-color' : ''} ${cancelled ? 'is-cancelled' : ''} ${lessonActionsOpen ? 'is-actions-open' : ''}`}
                                  style={lessonColor ? { '--school-lesson-color': lessonColor } : undefined}
                                  onClick={() => isAdult && setActiveLessonId(previous =>
                                    previous === lesson.id ? '' : lesson.id
                                  )}
                                  aria-expanded={isAdult ? lessonActionsOpen : undefined}
                                  aria-label={isAdult
                                    ? `${lesson.subject || lesson.title} – ${t('school.timetable.lessonActions')}`
                                    : undefined}
                                >
                                  <strong>{lesson.subject || lesson.title}</strong>
                                  {lesson.title && lesson.title !== lesson.subject && (
                                    <span>{lesson.title}</span>
                                  )}
                                  {(lesson.room || lesson.teacher) && (
                                    <small>{[lesson.room, lesson.teacher].filter(Boolean).join(' · ')}</small>
                                  )}
                                  {cancelled && <em>{t('school.timetable.cancelled')}</em>}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })
                    ];
                  })}
                </div>
                {isAdult && activeTimetableLesson && (
                  <section className="school-lesson-actions" aria-label={t('school.timetable.lessonActions')}>
                    <div className="school-lesson-actions-copy">
                      <strong>{activeTimetableLesson.subject || activeTimetableLesson.title}</strong>
                      <span>
                        {t('school.timetable.period', { count: activeTimetableLesson.period || 1 })}
                        {activeTimetableLesson.time ? ` · ${activeTimetableLesson.time}${activeTimetableLesson.endTime ? `–${activeTimetableLesson.endTime}` : ''}` : ''}
                      </span>
                    </div>
                    <div className="school-lesson-actions-controls">
                      <button
                        type="button"
                        className="is-edit"
                        onClick={() => editSchoolItem(activeTimetableLesson)}
                      >
                        <Pencil size={14} /> {t('school.form.editTitle')}
                      </button>
                      <label className="school-cancellation-date">
                        <span>{t('school.timetable.cancellationDate')}</span>
                        <input
                          type="date"
                          min={today}
                          value={activeLessonCancellationDate}
                          onChange={event => setCancellationDates(previous => ({
                            ...previous,
                            [activeTimetableLesson.id]: event.target.value
                          }))}
                        />
                      </label>
                      <button
                        type="button"
                        className="is-cancellation"
                        disabled={!activeLessonCancellationDateMatches}
                        onClick={() => toggleLessonCancellation(activeTimetableLesson)}
                      >
                        <BellOff size={14} />
                        {activeLessonDateCancelled
                          ? t('school.timetable.restore')
                          : t('school.timetable.cancelOnce')}
                      </button>
                      <button
                        type="button"
                        className="is-delete"
                        onClick={() => {
                          deleteFamilyLifeRecord('schoolItems', activeTimetableLesson.id);
                          setActiveLessonId('');
                        }}
                        aria-label={t('school.deleteAria')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </section>
                )}
                <div className="school-kind-grid">
              {Object.entries(SCHOOL_KIND)
                .filter(([kind]) => kind !== 'lesson')
                .map(([kind, meta]) => {
                const items = mySchoolItems
                  .filter(item => item.kind === kind)
                  .sort((left, right) =>
                    `${left.date || left.weekday}${left.time || ''}`.localeCompare(
                      `${right.date || right.weekday}${right.time || ''}`
                    )
                  );
                return (
                  <section key={kind}>
                    <header><span>{meta.icon}</span><h3>{t(meta.labelKey)}</h3><b>{items.length}</b></header>
                    <div>
                      {items.map(item => (
                        <article key={item.id} className={item.completed ? 'done' : ''}>
                          <button
                            type="button"
                            disabled={!['homework', 'bag'].includes(item.kind)}
                            onClick={() => toggleSchoolItem(item.id)}
                          >
                            <i>{item.completed ? <Check size={15} /> : meta.icon}</i>
                            <span>
                              <strong>{item.title}</strong>
                              <small>
                                {item.subject}
                                {item.date ? ` · ${formatDate(`${item.date}T12:00:00`)}` : ''}
                                {kind === 'lesson' ? ` · ${weekdays[item.weekday]}` : ''}
                                {item.time ? ` · ${item.time}` : ''}
                              </small>
                            </span>
                          </button>
                          {isAdult && (
                            <span className="school-item-actions">
                              <button
                                type="button"
                                onClick={() => editSchoolItem(item)}
                                aria-label={t('school.form.title')}
                              ><Pencil size={14} /></button>
                              <button
                                type="button"
                                onClick={() => deleteFamilyLifeRecord('schoolItems', item.id)}
                                aria-label={t('school.deleteAria')}
                              ><Trash2 size={14} /></button>
                            </span>
                          )}
                        </article>
                      ))}
                      {!items.length && <p>{t('school.emptyKind')}</p>}
                    </div>
                  </section>
                );
              })}
                </div>
              </>
            )}
          </section>
          {isAdult && selectedId && schoolEnabled && (
            <section className="family-life-panel" id="school-item-editor">
              <PanelHeader kicker={t('school.form.kicker')} title={editingSchoolItemId ? t('school.form.editTitle') : t('school.form.title')} icon={BookOpenCheck} />
              <form onSubmit={createSchoolItem} className="family-life-form">
                <div className="form-row">
                  <select
                    value={schoolForm.kind}
                    onChange={event => setSchoolForm(previous => ({ ...previous, kind: event.target.value }))}
                  >
                    {Object.entries(SCHOOL_KIND).map(([value, meta]) => (
                      <option key={value} value={value}>{meta.icon} {t(meta.labelKey)}</option>
                    ))}
                  </select>
                  <input
                    value={schoolForm.subject}
                    onChange={event => {
                      const subject = event.target.value;
                      setSchoolColorWasChosen(false);
                      setSchoolForm(previous => ({
                        ...previous,
                        subject,
                        color: schoolSubjectColors[
                          normalizeSchoolSubjectKey(subject)
                        ] || ''
                      }));
                    }}
                    placeholder={t('school.form.subjectPlaceholder')}
                  />
                </div>
                <input
                  value={schoolForm.title}
                  onChange={event => setSchoolForm(previous => ({ ...previous, title: event.target.value }))}
                  placeholder={t('school.form.titlePlaceholder')}
                  required
                />
                {schoolForm.kind === 'lesson' ? (
                  <div className="school-lesson-form-fields">
                    <div className="form-row">
                      <label>
                        <span>{t('school.form.weekday')}</span>
                        <select
                          value={schoolForm.weekday}
                          onChange={event => setSchoolForm(previous => ({ ...previous, weekday: event.target.value }))}
                        >
                          {weekdays.slice(1, 6).map((day, index) => (
                            <option key={day} value={index + 1}>{day}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t('school.form.period')}</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={schoolForm.period}
                          onChange={event => setSchoolForm(previous => ({ ...previous, period: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        <span>{t('school.form.startsAt')}</span>
                        <input
                          type="time"
                          value={schoolForm.time}
                          onChange={event => setSchoolForm(previous => ({ ...previous, time: event.target.value }))}
                        />
                      </label>
                      <label>
                        <span>{t('school.form.endsAt')}</span>
                        <input
                          type="time"
                          value={schoolForm.endTime}
                          onChange={event => setSchoolForm(previous => ({ ...previous, endTime: event.target.value }))}
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <input
                        value={schoolForm.room}
                        onChange={event => setSchoolForm(previous => ({ ...previous, room: event.target.value }))}
                        placeholder={t('school.form.roomPlaceholder')}
                      />
                      <input
                        value={schoolForm.teacher}
                        onChange={event => setSchoolForm(previous => ({ ...previous, teacher: event.target.value }))}
                        placeholder={t('school.form.teacherPlaceholder')}
                      />
                    </div>
                    <div className="school-color-field">
                      <div>
                        <span>{t('school.form.colorLabel')}</span>
                        <div className="school-color-palette" role="group" aria-label={t('school.form.colorLabel')}>
                          {SCHOOL_SUBJECT_COLORS.map(color => (
                            <button
                              key={color.value}
                              type="button"
                              className={schoolForm.color === color.value ? 'is-selected' : ''}
                              style={{ '--school-color-swatch': color.value }}
                              onClick={() => {
                                setSchoolColorWasChosen(true);
                                setSchoolForm(previous => ({
                                  ...previous,
                                  color: color.value
                                }));
                              }}
                              aria-pressed={schoolForm.color === color.value}
                              aria-label={t(color.labelKey)}
                              title={t(color.labelKey)}
                            />
                          ))}
                        </div>
                      </div>
                      <p>{t('school.form.colorHint')}</p>
                      {schoolForm.color && (
                        <button
                          type="button"
                          className="family-life-secondary"
                          onClick={() => {
                            setSchoolColorWasChosen(true);
                            setSchoolForm(previous => ({ ...previous, color: '' }));
                          }}
                        >
                          {t('school.form.colorReset')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={schoolForm.date}
                    onChange={event => setSchoolForm(previous => ({ ...previous, date: event.target.value }))}
                  />
                )}
                <textarea
                  value={schoolForm.details}
                  onChange={event => setSchoolForm(previous => ({ ...previous, details: event.target.value }))}
                  placeholder={t('school.form.detailsPlaceholder')}
                />
                <div className="school-form-actions">
                  <button className="family-life-primary"><Plus size={16} /> {editingSchoolItemId ? t('school.form.save') : t('school.form.submit')}</button>
                  {editingSchoolItemId && (
                    <button
                      type="button"
                      className="family-life-secondary"
                      onClick={() => {
                        setEditingSchoolItemId('');
                        setSchoolColorWasChosen(false);
                        setSchoolForm(previous => ({
                          ...previous,
                          title: '',
                          subject: '',
                          details: '',
                          color: ''
                        }));
                      }}
                    >
                      {t('school.form.cancel')}
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}
        </div>
      )}

      {section === 'contacts' && isAdult && (
        <div className="family-life-section family-contacts-section">
          <section className="family-life-panel family-contacts-directory">
            <PanelHeader
              kicker={t('contacts.kicker')}
              title={t('contacts.title')}
              icon={Phone}
            >
              <span className="family-contacts-count">
                {t('contacts.count', { count: familyContacts.length })}
              </span>
            </PanelHeader>
            <p className="family-contacts-intro">{t('contacts.intro')}</p>
            <div className="family-contacts-toolbar">
              <label className="family-contacts-search">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  value={contactSearch}
                  onChange={event => setContactSearch(event.target.value)}
                  placeholder={t('contacts.searchPlaceholder')}
                />
              </label>
              <select
                value={contactCategoryFilter}
                onChange={event => setContactCategoryFilter(event.target.value)}
                aria-label={t('contacts.categoryFilterAria')}
              >
                <option value="all">{t('contacts.allCategories')}</option>
                {CONTACT_CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {t(`contacts.categories.${category.id}`)}
                  </option>
                ))}
              </select>
            </div>

            {visibleFamilyContacts.length ? (
              <div className="family-contacts-grid">
                {visibleFamilyContacts.map(contact => {
                  const category = CONTACT_CATEGORIES.find(item => item.id === contact.category) ||
                    CONTACT_CATEGORIES.at(-1);
                  return (
                    <article key={contact.id} className="family-contact-card">
                      <div className="family-contact-card-heading">
                        <span className="family-contact-category-icon" aria-hidden="true">{category.icon}</span>
                        <div>
                          <span className="family-contact-category">
                            {t(`contacts.categories.${category.id}`)}
                          </span>
                          <h3>{contact.name}</h3>
                        </div>
                      </div>
                      <div className="family-contact-details">
                        {contact.phone && (
                          <a href={`tel:${contact.phone.replace(/[^+0-9]/g, '')}`}>
                            <Phone size={15} /> {contact.phone}
                          </a>
                        )}
                        {contact.email && (
                          <a href={`mailto:${contact.email}`}>
                            <Mail size={15} /> {contact.email}
                          </a>
                        )}
                        {contact.address && (
                          <span><MapPin size={15} /> {contact.address}</span>
                        )}
                        {contact.notes && <p>{contact.notes}</p>}
                      </div>
                      <div className="family-contact-actions">
                        {contact.phone && (
                          <a className="family-contact-call" href={`tel:${contact.phone.replace(/[^+0-9]/g, '')}`}>
                            <Phone size={15} /> {t('contacts.call')}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => editFamilyContact(contact)}
                          aria-label={t('contacts.editAria', { name: contact.name })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="is-delete"
                          onClick={() => deleteFamilyLifeRecord('familyContacts', contact.id)}
                          aria-label={t('contacts.deleteAria', { name: contact.name })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="family-contacts-empty">
                <Phone size={25} />
                <strong>{familyContacts.length ? t('contacts.noMatchesTitle') : t('contacts.emptyTitle')}</strong>
                <p>{familyContacts.length ? t('contacts.noMatchesText') : t('contacts.emptyText')}</p>
              </div>
            )}
          </section>

          <section className="family-life-panel" id="family-contact-editor">
            <PanelHeader
              kicker={t('contacts.form.kicker')}
              title={editingContactId ? t('contacts.form.editTitle') : t('contacts.form.title')}
              icon={UsersRound}
            />
            <form onSubmit={saveFamilyContact} className="family-life-form family-contact-form">
              <div className="form-row">
                <input
                  value={contactForm.name}
                  onChange={event => setContactForm(previous => ({ ...previous, name: event.target.value }))}
                  placeholder={t('contacts.form.namePlaceholder')}
                  required
                />
                <select
                  value={contactForm.category}
                  onChange={event => setContactForm(previous => ({ ...previous, category: event.target.value }))}
                  aria-label={t('contacts.form.categoryAria')}
                >
                  {CONTACT_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {t(`contacts.categories.${category.id}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={event => setContactForm(previous => ({ ...previous, phone: event.target.value }))}
                  placeholder={t('contacts.form.phonePlaceholder')}
                />
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={event => setContactForm(previous => ({ ...previous, email: event.target.value }))}
                  placeholder={t('contacts.form.emailPlaceholder')}
                />
              </div>
              <input
                value={contactForm.address}
                onChange={event => setContactForm(previous => ({ ...previous, address: event.target.value }))}
                placeholder={t('contacts.form.addressPlaceholder')}
              />
              <textarea
                value={contactForm.notes}
                onChange={event => setContactForm(previous => ({ ...previous, notes: event.target.value }))}
                placeholder={t('contacts.form.notesPlaceholder')}
              />
              <div className="school-form-actions">
                <button className="family-life-primary">
                  <Plus size={16} /> {editingContactId ? t('contacts.form.save') : t('contacts.form.submit')}
                </button>
                {editingContactId && (
                  <button type="button" className="family-life-secondary" onClick={resetContactForm}>
                    {t('contacts.form.cancel')}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {section === 'polls' && (
        <div className="family-life-section poll-studio">
          <section className="family-life-panel">
            <PanelHeader kicker={t('polls.kicker')} title={t('polls.title')} icon={Vote} />
            <div className="family-poll-grid">
              {familyPolls
                .slice()
                .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))
                .map(poll => {
                  const total = Object.keys(poll.votes || {}).length;
                  const myVote = poll.votes?.[activeMember?.id];
                  return (
                    <article className="family-poll-card" key={poll.id}>
                      <header>
                        <span><Vote size={18} /></span>
                        <div><small>{t('polls.votes', { count: total })}</small><h3>{poll.question}</h3></div>
                        {isAdult && (
                          <button
                            type="button"
                            onClick={() => deleteFamilyLifeRecord('familyPolls', poll.id)}
                            aria-label={t('polls.deleteAria')}
                          ><Trash2 size={14} /></button>
                        )}
                      </header>
                      <div>
                        {poll.options?.map(option => {
                          const votes = Object.values(poll.votes || {})
                            .filter(value => value === option.id).length;
                          const percent = total ? Math.round((votes / total) * 100) : 0;
                          return (
                            <button
                              type="button"
                              key={option.id}
                              className={myVote === option.id ? 'selected' : ''}
                              onClick={() => voteFamilyPoll(poll.id, option.id)}
                            >
                              <span>{option.emoji}</span>
                              <strong>{option.label}</strong>
                              <i><b style={{ width: `${percent}%` }} /></i>
                              <small>{percent}%</small>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              {!familyPolls.length && (
                <div className="family-life-empty large">
                  <span>🗳️</span><strong>{t('polls.emptyTitle')}</strong>
                  <p>{t('polls.emptyText')}</p>
                </div>
              )}
            </div>
          </section>
          {isAdult && (
            <section className="family-life-panel">
              <PanelHeader kicker={t('polls.form.kicker')} title={t('polls.form.title')} icon={CircleHelp} />
              <form onSubmit={createPoll} className="family-life-form">
                <input
                  value={pollForm.question}
                  onChange={event => setPollForm(previous => ({ ...previous, question: event.target.value }))}
                  placeholder={t('polls.form.questionPlaceholder')}
                  required
                />
                <label><span>{t('polls.form.optionsLabel')}</span>
                  <textarea
                    rows="5"
                    value={pollForm.options}
                    onChange={event => setPollForm(previous => ({ ...previous, options: event.target.value }))}
                    required
                  />
                </label>
                <label><span>{t('polls.form.closesLabel')}</span>
                  <input
                    type="date"
                    value={pollForm.closesAt}
                    onChange={event => setPollForm(previous => ({ ...previous, closesAt: event.target.value }))}
                  />
                </label>
                <button className="family-life-primary"><Vote size={16} /> {t('polls.form.submit')}</button>
              </form>
            </section>
          )}
        </div>
      )}

      {section === 'safety' && (
        <div className="family-life-section safety-center">
          <section className="family-life-panel emergency-card">
            <PanelHeader kicker={t('safety.emergency.kicker')} title={settings?.emergencyTitle || t('safety.emergency.fallbackTitle')} icon={ShieldAlert} />
            <div className="emergency-contact-grid">
              {(settings?.emergencyContacts || []).map(contact => (
                <a key={contact.id} href={contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : undefined}>
                  <span>{contact.icon || '☎️'}</span>
                  <div><strong>{contact.name}</strong><b>{contact.phone}</b><small>{contact.note}</small></div>
                  <ChevronRight size={18} />
                </a>
              ))}
              {!settings?.emergencyContacts?.length && (
                <div className="family-life-empty">{t('safety.emergency.empty')}</div>
              )}
            </div>
            {settings?.emergencyNotes && (
              <div className="emergency-notes">
                <ShieldAlert size={18} />
                <p>{settings.emergencyNotes}</p>
              </div>
            )}
          </section>

          <section className="family-life-panel quiet-status">
            <PanelHeader kicker={t('safety.quiet.kicker')} title={t('safety.quiet.title')} icon={BellOff} />
            <div className="quiet-status-grid">
              <article className={settings?.quietHoursEnabled ? 'active' : ''}>
                <BellOff size={22} />
                <span><strong>{t('safety.quiet.notifications')}</strong><small>
                  {settings?.quietHoursEnabled
                    ? t('safety.quiet.range', { start: settings.quietStart, end: settings.quietEnd })
                    : t('safety.quiet.notActive')}
                </small></span>
              </article>
              <article className={settings?.mediaScheduleEnabled ? 'active' : ''}>
                <Clock3 size={22} />
                <span><strong>{t('safety.quiet.mediaLounge')}</strong><small>
                  {settings?.mediaScheduleEnabled
                    ? t('safety.quiet.range', { start: settings.mediaStart, end: settings.mediaEnd })
                    : t('safety.quiet.alwaysVisible')}
                </small></span>
              </article>
            </div>
            <p className="quiet-explanation">{t('safety.quiet.explanation')}</p>
          </section>

          {isAdult && (
            <section className="family-life-panel safety-editor">
              <PanelHeader kicker={t('adultsOnly')} title={t('safety.editor.title')} icon={ShieldAlert} />
              <form onSubmit={saveSettings} className="family-life-form">
                <label className="setting-switch">
                  <input
                    type="checkbox"
                    checked={settingsForm.quietHoursEnabled}
                    onChange={event => setSettingsForm(previous => ({ ...previous, quietHoursEnabled: event.target.checked }))}
                  />
                  <span><strong>{t('safety.editor.quietSwitch')}</strong><small>{t('safety.editor.quietSwitchHint')}</small></span>
                </label>
                <div className="form-row">
                  <label><span>{t('safety.editor.startLabel')}</span><input type="time" value={settingsForm.quietStart} onChange={event => setSettingsForm(previous => ({ ...previous, quietStart: event.target.value }))} /></label>
                  <label><span>{t('safety.editor.endLabel')}</span><input type="time" value={settingsForm.quietEnd} onChange={event => setSettingsForm(previous => ({ ...previous, quietEnd: event.target.value }))} /></label>
                </div>
                <label className="setting-switch">
                  <input
                    type="checkbox"
                    checked={settingsForm.urgentDuringQuietHours}
                    onChange={event => setSettingsForm(previous => ({ ...previous, urgentDuringQuietHours: event.target.checked }))}
                  />
                  <span><strong>{t('safety.editor.urgentSwitch')}</strong><small>{t('safety.editor.urgentSwitchHint')}</small></span>
                </label>
                <label className="setting-switch">
                  <input
                    type="checkbox"
                    checked={settingsForm.mediaScheduleEnabled}
                    onChange={event => setSettingsForm(previous => ({ ...previous, mediaScheduleEnabled: event.target.checked }))}
                  />
                  <span><strong>{t('safety.editor.mediaSwitch')}</strong><small>{t('safety.editor.mediaSwitchHint')}</small></span>
                </label>
                <div className="form-row">
                  <label><span>{t('safety.editor.mediaFromLabel')}</span><input type="time" value={settingsForm.mediaStart} onChange={event => setSettingsForm(previous => ({ ...previous, mediaStart: event.target.value }))} /></label>
                  <label><span>{t('safety.editor.mediaToLabel')}</span><input type="time" value={settingsForm.mediaEnd} onChange={event => setSettingsForm(previous => ({ ...previous, mediaEnd: event.target.value }))} /></label>
                </div>
                <hr />
                <label><span>{t('safety.editor.emergencyTitleLabel')}</span>
                  <input value={settingsForm.emergencyTitle} onChange={event => setSettingsForm(previous => ({ ...previous, emergencyTitle: event.target.value }))} />
                </label>
                <label><span>{t('safety.editor.contactsLabel')}</span>
                  <textarea
                    rows="5"
                    value={settingsForm.emergencyContacts}
                    onChange={event => setSettingsForm(previous => ({ ...previous, emergencyContacts: event.target.value }))}
                    placeholder={t('safety.editor.contactsPlaceholder')}
                  />
                </label>
                <label><span>{t('safety.editor.notesLabel')}</span>
                  <textarea
                    rows="4"
                    value={settingsForm.emergencyNotes}
                    onChange={event => setSettingsForm(previous => ({ ...previous, emergencyNotes: event.target.value }))}
                    placeholder={t('safety.editor.notesPlaceholder')}
                  />
                </label>
                <button className="family-life-primary"><Check size={16} /> {t('safety.editor.save')}</button>
              </form>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
