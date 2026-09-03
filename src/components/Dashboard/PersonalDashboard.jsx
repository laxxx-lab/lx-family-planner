import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Calendar,
  CheckSquare,
  Cloud,
  Home,
  LayoutDashboard,
  Pin,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  UtensilsCrossed
} from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { displayShoppingItemIcon } from '../../../shared/shoppingItemIcons.js';
import { initialTrashEvents } from '../Calendar/TrashCalendarView';
import ChildDashboard from './ChildDashboard';
import PetDashboard from './PetDashboard';
import HomeAssistantWidget from './HomeAssistantWidget';
import FamilyCloudWidget from './FamilyCloudWidget';
import DashboardCustomizer from './DashboardCustomizer';
import OrderedDashboardGrid, {
  DashboardWidget
} from './OrderedDashboardGrid';
import useDashboardLayout from '../../hooks/useDashboardLayout';
import { dashboardLayoutForTrash } from '../../utils/dashboardLayout';
import { formatDate } from '../../utils/formatting';
import {
  eventAudienceMembers,
  eventIsCurrentOrFuture,
  eventIsForMember,
  eventSpansToday
} from '../../../shared/calendarAudience.js';
import {
  birthdayEventCopy,
  nextBirthdayOccurrencesOnly
} from '../../../shared/birthdays.js';
import { taskIsAvailableToMember } from '../../../shared/taskAssignments.js';
import { taskIsVisibleOnDate } from '../../../shared/taskVisibility.js';
import {
  groupTrashEventsByDate,
  trashGroupIcons,
  trashGroupTitle
} from '../../../shared/trashSchedule.js';
import { isChildProfile, isPetProfile } from '../../constants/roles';
import {
  DEFAULT_FAMILY_AVATAR,
  handleImgError
} from '../../utils/imageFallback';

// Die ids sind im gespeicherten Layout persistiert – Anzeigetexte kommen
// zur Laufzeit aus personal.widgets.<id>.*.
const ADULT_WIDGETS = [
  { id: 'calendar', icon: Calendar, color: '#377d69' },
  { id: 'tasks', icon: CheckSquare, color: '#3975b9' },
  { id: 'meals', icon: UtensilsCrossed, color: '#c26745' },
  { id: 'shopping', icon: ShoppingBag, color: '#8a6a24' },
  { id: 'trash', icon: Trash2, color: '#66736e' },
  { id: 'board', icon: Pin, color: '#a65a3f' },
  { id: 'cloud', icon: Cloud, color: '#177f7b' },
  { id: 'home-assistant', icon: Home, color: '#2f7c73' }
];

// Gespeicherte Schlüssel im Speiseplan (meal.meal) bleiben deutsch –
// nur die Anzeige wird übersetzt.
const MEAL_TYPE_LABEL_KEYS = {
  Mittagessen: 'personal.meals.types.lunch',
  Abendessen: 'personal.meals.types.dinner'
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function DashboardCardHeader({
  action,
  actionLabel,
  count,
  icon: Icon,
  title,
  tone = 'var(--primary)'
}) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="adult-widget-header">
      <div className="adult-widget-heading" style={{ color: tone }}>
        <span className="adult-widget-heading-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <h3>
          <span>{title}</span>
          {count !== undefined && (
            <span className="adult-widget-count">{count}</span>
          )}
        </h3>
      </div>
      <button
        type="button"
        className="adult-widget-link"
        onClick={action}
        aria-label={`${actionLabel}: ${title}`}
        title={actionLabel}
      >
        {t('personal.widgetHeader.open')} <ArrowRight size={13} />
      </button>
    </div>
  );
}

function EmptyWidget({ icon, children }) {
  return (
    <div className="adult-widget-empty">
      <span>{icon}</span>
      <p>{children}</p>
    </div>
  );
}

function openWidgetFromBackground(event, onOpen) {
  if (event.target.closest('button, a, input, select, textarea, label')) return;
  onOpen();
}

export default function PersonalDashboard() {
  const { t } = useTranslation('dashboard');
  const { t: tCalendar } = useTranslation('calendar');
  const {
    activeMember,
    members,
    events,
    tasks,
    toggleTask,
    notes,
    meals,
    shoppingItems,
    trashEvents: savedTrashEvents,
    homeAssistantIntegration,
    readOnlyDemo,
    setActiveTab,
    setIsQuickAddOpen,
    activeHousehold
  } = useFamily();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const availableWidgets = useMemo(
    () => ADULT_WIDGETS.filter(
      widget =>
        (!readOnlyDemo || widget.id !== 'cloud') &&
        (
          widget.id !== 'home-assistant' ||
          (
            homeAssistantIntegration?.connected &&
            homeAssistantIntegration?.enabled !== false &&
            homeAssistantIntegration?.selectedEntities?.length > 0
          )
        )
    ).map(widget => ({
      ...widget,
      label: t(`personal.widgets.${widget.id}.label`),
      description: t(`personal.widgets.${widget.id}.description`)
    })),
    [
      homeAssistantIntegration?.connected,
      homeAssistantIntegration?.enabled,
      homeAssistantIntegration?.selectedEntities?.length,
      readOnlyDemo,
      t
    ]
  );
  const dashboardLayout = useDashboardLayout(
    activeMember?.id,
    'personal',
    availableWidgets.map(widget => widget.id)
  );

  const now = new Date();
  const hour = now.getHours();
  const timeGreeting =
    hour < 11
      ? t('personal.hero.greeting.morning')
      : hour >= 18
        ? t('personal.hero.greeting.evening')
        : t('personal.hero.greeting.day');
  const todayKey = localDateKey(now);
  // meal.day wird als deutscher Wochentagsname gespeichert –
  // der Vergleich bleibt deshalb bewusst bei de-DE.
  const currentDayName = now.toLocaleDateString('de-DE', {
    weekday: 'long'
  });
  const belongsToHousehold = item =>
    (item.household || 'familie') === activeHousehold;

  const myEvents = useMemo(
    () =>
      nextBirthdayOccurrencesOnly(events, todayKey)
        .filter(
          event =>
            eventIsCurrentOrFuture(event, todayKey) &&
            eventIsForMember(event, activeMember.id) &&
            belongsToHousehold(event)
        )
        .sort(
          (left, right) =>
            new Date(`${left.date}T${left.time || '00:00'}`) -
            new Date(`${right.date}T${right.time || '00:00'}`)
        ),
    [activeHousehold, activeMember.id, events, todayKey]
  );
  // Strikt heutige Termine für die „Heute im Blick"-Zusammenfassung und das
  // Kalender-Badge – analog zum Tabletmodus (KitchenTabletView).
  const todayEvents = useMemo(
    () =>
      myEvents.filter(event => eventSpansToday(event, todayKey)),
    [myEvents, todayKey]
  );
  const myTasks = useMemo(
    () =>
      tasks
        .filter(
          task =>
            taskIsAvailableToMember(task, activeMember.id) &&
            !task.completed &&
            taskIsVisibleOnDate(task, todayKey) &&
            belongsToHousehold(task)
        )
        .sort((left, right) =>
          String(left.dueDate || '9999-12-31').localeCompare(
            String(right.dueDate || '9999-12-31')
          )
        ),
    [activeHousehold, activeMember.id, tasks]
  );
  const approvalTasks = useMemo(
    () =>
      tasks.filter(
        task =>
          task.completionStatus === 'pending_approval' &&
          belongsToHousehold(task) &&
          (
            !task.createdByMemberId ||
            task.createdByMemberId === activeMember.id
          )
      ),
    [activeHousehold, activeMember.id, tasks]
  );
  const todayMeals = useMemo(
    () =>
      meals.filter(
        meal =>
          meal.day === currentDayName &&
          belongsToHousehold(meal)
      ),
    [activeHousehold, currentDayName, meals]
  );
  const openShopping = useMemo(
    () =>
      shoppingItems.filter(
        item =>
          item.isSelected &&
          !item.inCart &&
          belongsToHousehold(item)
      ),
    [activeHousehold, shoppingItems]
  );
  const householdNotes = useMemo(
    () =>
      notes.filter(
        note => note.isShared || belongsToHousehold(note)
      ),
    [activeHousehold, notes]
  );
  const householdTrashEvents = savedTrashEvents.filter(belongsToHousehold);
  const trashEvents = householdTrashEvents.length
    ? householdTrashEvents
    : activeHousehold === 'familie'
      ? initialTrashEvents(tCalendar)
      : [];
  const nextTrash = groupTrashEventsByDate(
    trashEvents.filter(item => item.date >= todayKey)
  )[0];
  const nextTrashTitle = trashGroupTitle(nextTrash, item =>
    item.titleKey ? tCalendar(item.titleKey) : item.title
  );
  const nextTrashIcons = trashGroupIcons(nextTrash);
  const effectiveDashboardLayout = dashboardLayoutForTrash(
    dashboardLayout.layout,
    nextTrash?.date,
    todayKey
  );

  if (isChildProfile(activeMember)) return <ChildDashboard />;
  if (isPetProfile(activeMember)) return <PetDashboard />;

  return (
    <div className="adult-dashboard">
      <div
        className="adult-hero"
        style={{ '--member-color': activeMember?.color || '#246b58' }}
      >
        <div className="adult-hero-identity">
          <img
            src={activeMember.avatar || DEFAULT_FAMILY_AVATAR}
            onError={handleImgError}
            alt={activeMember.name}
            className="adult-hero-avatar"
          />
          <div>
            <span className="adult-hero-kicker">{t('personal.hero.kicker')}</span>
            <h1>
              {t('personal.hero.title', {
                greeting: timeGreeting,
                name: activeMember.name.split(' ')[0]
              })}
            </h1>
            <p>
              {t('personal.hero.summary', {
                events: t('personal.hero.events', { count: todayEvents.length }),
                tasks: t('personal.hero.tasks', { count: myTasks.length }),
                shopping: t('personal.hero.shopping', {
                  count: openShopping.length
                })
              })}
            </p>
          </div>
        </div>
        <div className="adult-hero-actions">
          <button
            type="button"
            className="adult-layout-button"
            onClick={() => setIsCustomizerOpen(true)}
          >
            <LayoutDashboard size={17} /> {t('personal.hero.customize')}
          </button>
          <button
            type="button"
            className="adult-quick-add"
            onClick={() => setIsQuickAddOpen(true)}
          >
            <Plus size={18} /> {t('personal.hero.quickAdd')}
          </button>
        </div>
      </div>

      <OrderedDashboardGrid
        className="adult-widget-grid"
        layout={effectiveDashboardLayout}
      >
        <DashboardWidget
          widgetId="calendar"
          className="card adult-dashboard-widget is-clickable"
          onClick={event => openWidgetFromBackground(event, () => setActiveTab('calendar'))}
        >
          <DashboardCardHeader
            action={() => setActiveTab('calendar')}
            actionLabel={t('personal.widgets.calendar.action')}
            count={todayEvents.length}
            icon={Calendar}
            title={t('personal.widgets.calendar.label')}
          />
          {todayEvents.length === 0 ? (
            <EmptyWidget icon="🎉">{t('personal.calendar.empty')}</EmptyWidget>
          ) : (
            <div className="adult-event-list">
              {todayEvents.slice(0, 4).map(event => {
                const displayEvent = birthdayEventCopy(event, t);
                const audience = eventAudienceMembers(event, members);
                return <button
                  type="button"
                  key={event.id}
                  onClick={() => setActiveTab('calendar')}
                >
                  <time>
                    <strong>{event.time || t('personal.calendar.allDay')}</strong>
                    <span>
                      {formatDate(`${event.date}T12:00:00`, {
                        weekday: 'short', day: '2-digit', month: 'short'
                      })}
                    </span>
                  </time>
                  <span>
                    <strong>{displayEvent.title}</strong>
                    <small>
                      {displayEvent.location ||
                        audience.map(entry => entry.name).join(', ') ||
                        t('personal.calendar.defaultLocation')}
                    </small>
                  </span>
                </button>;
              })}
            </div>
          )}
        </DashboardWidget>

        <DashboardWidget
          widgetId="tasks"
          className="card adult-dashboard-widget is-clickable"
          onClick={event => openWidgetFromBackground(event, () => setActiveTab('tasks'))}
        >
          <DashboardCardHeader
            action={() => setActiveTab('tasks')}
            actionLabel={t('personal.widgets.tasks.action')}
            count={myTasks.length + approvalTasks.length}
            icon={CheckSquare}
            title={t('personal.widgets.tasks.label')}
          />
          {approvalTasks.length > 0 && (
            <button
              type="button"
              className="adult-approval-alert"
              onClick={() => setActiveTab('tasks')}
            >
              <span>{approvalTasks.length}</span>
              <strong>
                {t('personal.tasks.approvals', { count: approvalTasks.length })}
              </strong>
              <ArrowRight size={15} />
            </button>
          )}
          {myTasks.length === 0 && approvalTasks.length === 0 ? (
            <EmptyWidget icon="🌟">{t('personal.tasks.empty')}</EmptyWidget>
          ) : (
            <div className="adult-task-list">
              {myTasks.slice(0, approvalTasks.length ? 3 : 4).map(task => (
                <button
                  type="button"
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                >
                  <span className="adult-task-check" />
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {task.dueDate
                        ? t('personal.tasks.due', {
                            date: formatDate(`${task.dueDate}T12:00:00`)
                          })
                        : task.category || t('personal.tasks.defaultCategory')}
                    </small>
                  </span>
                  <em><Star size={13} fill="currentColor" /> +{task.stars}</em>
                </button>
              ))}
            </div>
          )}
        </DashboardWidget>

        <DashboardWidget
          widgetId="meals"
          className="card adult-dashboard-widget meals is-clickable"
          onClick={event => openWidgetFromBackground(event, () => setActiveTab('meals'))}
        >
          <DashboardCardHeader
            action={() => setActiveTab('meals')}
            actionLabel={t('personal.widgets.meals.action')}
            count={todayMeals.length}
            icon={UtensilsCrossed}
            title={t('personal.widgets.meals.label')}
            tone="var(--accent)"
          />
          {todayMeals.length === 0 ? (
            <EmptyWidget icon="🥣">{t('personal.meals.empty')}</EmptyWidget>
          ) : (
            <div className="adult-meal-list">
              {todayMeals.map(meal => (
                <button
                  type="button"
                  key={meal.id}
                  onClick={() => setActiveTab('meals')}
                >
                  <span>
                    {MEAL_TYPE_LABEL_KEYS[meal.meal]
                      ? t(MEAL_TYPE_LABEL_KEYS[meal.meal])
                      : meal.meal}
                  </span>
                  <strong>{meal.recipe}</strong>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          )}
        </DashboardWidget>

        <DashboardWidget
          widgetId="shopping"
          className="card adult-dashboard-widget shopping is-clickable"
          onClick={event => openWidgetFromBackground(event, () => setActiveTab('shopping'))}
        >
          <DashboardCardHeader
            action={() => setActiveTab('shopping')}
            actionLabel={t('personal.widgets.shopping.action')}
            count={openShopping.length}
            icon={ShoppingBag}
            title={t('personal.widgets.shopping.label')}
            tone="var(--warning)"
          />
          {openShopping.length === 0 ? (
            <EmptyWidget icon="✓">{t('personal.shopping.empty')}</EmptyWidget>
          ) : (
            <div className="adult-shopping-preview">
              {openShopping.slice(0, 6).map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab('shopping')}
                >
                  <span>{displayShoppingItemIcon(item.name, item.icon)}</span>
                  <strong>{item.name}</strong>
                  <small>{item.quantity || '1×'}</small>
                </button>
              ))}
            </div>
          )}
        </DashboardWidget>

        <DashboardWidget
          widgetId="trash"
          className="card adult-dashboard-widget trash is-clickable"
          onClick={event => openWidgetFromBackground(event, () => setActiveTab('trash'))}
        >
          <DashboardCardHeader
            action={() => setActiveTab('trash')}
            actionLabel={t('personal.widgets.trash.action')}
            icon={Trash2}
            title={t('personal.widgets.trash.label')}
            tone="var(--warning)"
          />
          {nextTrash ? (
            <button
              type="button"
              className="adult-trash-next"
              onClick={() => setActiveTab('trash')}
            >
              <span className="adult-trash-next-icons" aria-hidden="true">
                {nextTrashIcons.map(icon => <i key={icon}>{icon}</i>)}
              </span>
              <span>
                <strong>{nextTrashTitle}</strong>
                <small>
                  {t('personal.trash.pickupOn', {
                    date: formatDate(`${nextTrash.date}T12:00:00`, {
                      weekday: 'long', day: 'numeric', month: 'long'
                    })
                  })}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <EmptyWidget icon="🗓️">{t('personal.trash.empty')}</EmptyWidget>
          )}
        </DashboardWidget>

        <DashboardWidget
          widgetId="board"
          className="card adult-dashboard-widget board is-clickable"
          onClick={event => openWidgetFromBackground(event, () => setActiveTab('board'))}
        >
          <DashboardCardHeader
            action={() => setActiveTab('board')}
            actionLabel={t('personal.widgets.board.action')}
            count={householdNotes.length}
            icon={Pin}
            title={t('personal.board.title')}
          />
          {householdNotes.length === 0 ? (
            <EmptyWidget icon="📌">{t('personal.board.empty')}</EmptyWidget>
          ) : (
            <div className="adult-note-stack">
              {householdNotes.slice(0, 3).map(note => (
                <button
                  type="button"
                  key={note.id}
                  onClick={() => setActiveTab('board')}
                  style={{ '--note-color': note.color || '#fef08a' }}
                >
                  <strong>{note.title}</strong>
                  <span>{note.content}</span>
                </button>
              ))}
            </div>
          )}
        </DashboardWidget>

        {!readOnlyDemo && (
          <DashboardWidget
            widgetId="cloud"
            className="card adult-dashboard-widget adult-cloud-widget"
          >
            <FamilyCloudWidget />
          </DashboardWidget>
        )}

        <DashboardWidget
          widgetId="home-assistant"
          className="adult-dashboard-widget ha-dashboard-shell"
        >
          <HomeAssistantWidget />
        </DashboardWidget>
      </OrderedDashboardGrid>

      <DashboardCustomizer
        isOpen={isCustomizerOpen}
        layout={dashboardLayout.layout}
        mode="personal"
        moveWidget={dashboardLayout.moveWidget}
        onClose={() => setIsCustomizerOpen(false)}
        profileName={activeMember.name.split(' ')[0]}
        resetLayout={dashboardLayout.resetLayout}
        setDensity={dashboardLayout.setDensity}
        setPreference={dashboardLayout.setPreference}
        toggleWidget={dashboardLayout.toggleWidget}
        widgets={availableWidgets}
      />
    </div>
  );
}
