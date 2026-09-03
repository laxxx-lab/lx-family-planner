import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckSquare,
  Clock3,
  Home,
  MessageSquare,
  Pin,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Trash2,
  Users,
  UtensilsCrossed
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { displayShoppingItemIcon } from '../../../shared/shoppingItemIcons.js';
import {
  eventAudienceMembers,
  eventSpansToday
} from '../../../shared/calendarAudience.js';
import { birthdayEventCopy } from '../../../shared/birthdays.js';
import { taskIsVisibleOnDate } from '../../../shared/taskVisibility.js';
import { groupTrashEventsByDate, trashGroupTitle } from '../../../shared/trashSchedule.js';
import useDashboardLayout from '../../hooks/useDashboardLayout';
import {
  dashboardLayoutForTrash,
  dashboardPreviewItems
} from '../../utils/dashboardLayout';
import {
  isChildProfile,
  isManagedProfile,
  isWallProfile
} from '../../constants/roles';
import DashboardCustomizer from './DashboardCustomizer';
import OrderedDashboardGrid, {
  DashboardWidget
} from './OrderedDashboardGrid';
import HomeAssistantWidget from './HomeAssistantWidget';
import {
  DEFAULT_FAMILY_AVATAR,
  handleImgError
} from '../../utils/imageFallback';
import {
  formatDate,
  formatTime,
  getWeekdayNames
} from '../../utils/formatting';

const TABLET_WIDGETS = [
  {
    id: 'calendar',
    labelKey: 'kitchen.widgets.calendar.label',
    descriptionKey: 'kitchen.widgets.calendar.description',
    icon: CalendarDays,
    color: '#377d69'
  },
  {
    id: 'meals',
    labelKey: 'kitchen.widgets.meals.label',
    descriptionKey: 'kitchen.widgets.meals.description',
    icon: UtensilsCrossed,
    color: '#c26745'
  },
  {
    id: 'tasks',
    labelKey: 'kitchen.widgets.tasks.label',
    descriptionKey: 'kitchen.widgets.tasks.description',
    icon: CheckSquare,
    color: '#3975b9'
  },
  {
    id: 'shopping',
    labelKey: 'kitchen.widgets.shopping.label',
    descriptionKey: 'kitchen.widgets.shopping.description',
    icon: ShoppingBag,
    color: '#8a6a24'
  },
  {
    id: 'chat',
    labelKey: 'kitchen.widgets.chat.label',
    descriptionKey: 'kitchen.widgets.chat.description',
    icon: MessageSquare,
    color: '#6d5faf'
  },
  {
    id: 'board',
    labelKey: 'kitchen.widgets.board.label',
    descriptionKey: 'kitchen.widgets.board.description',
    icon: Pin,
    color: '#a65a3f'
  },
  {
    id: 'trash',
    labelKey: 'kitchen.widgets.trash.label',
    descriptionKey: 'kitchen.widgets.trash.description',
    icon: Trash2,
    color: '#66736e'
  },
  {
    id: 'family',
    labelKey: 'kitchen.widgets.family.label',
    descriptionKey: 'kitchen.widgets.family.description',
    icon: Users,
    color: '#b35d6d'
  },
  {
    id: 'home-assistant',
    labelKey: 'kitchen.widgets.homeAssistant.label',
    descriptionKey: 'kitchen.widgets.homeAssistant.description',
    icon: Home,
    color: '#2f7c73'
  }
];

// Gespeicherte meal.day-Werte sind deutsche Wochentagsnamen (Datenschlüssel).
const MEAL_PLAN_DAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag'
];

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shortDate(value) {
  if (!value) return '';
  return formatDate(`${value}T12:00:00`, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

function TabletCard({ tab, icon: Icon, title, count, tone, children, onOpen }) {
  return (
    <section className={`tablet-command-card ${tone || ''}`}>
      <button
        type="button"
        className="tablet-card-heading"
        onClick={() => onOpen(tab)}
      >
        <span className="tablet-card-icon"><Icon size={20} /></span>
        <span>
          <strong>{title}</strong>
          {count !== undefined && <small>{count}</small>}
        </span>
        <ArrowUpRight size={17} />
      </button>
      <div className="tablet-card-body">{children}</div>
    </section>
  );
}

export default function KitchenTabletView() {
  const {
    activeMember,
    activeHousehold,
    chatMessages,
    events,
    meals,
    members,
    notes,
    homeAssistantIntegration,
    setActiveTab,
    setIsQuickAddOpen,
    setQuickAddDefaultType,
    shoppingItems,
    tasks,
    toggleShoppingInCart,
    toggleTask,
    completeTaskAs,
    trashEvents
  } = useFamily();
  const { t } = useTranslation('widgets');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [taskForCompletion, setTaskForCompletion] = useState(null);
  const isWall = isWallProfile(activeMember);
  const availableWidgets = useMemo(
    () => TABLET_WIDGETS.filter(
      widget =>
        widget.id !== 'home-assistant' ||
        (
          homeAssistantIntegration?.connected &&
          homeAssistantIntegration?.enabled !== false &&
          homeAssistantIntegration?.selectedEntities?.length > 0
        )
    ).map(widget => ({
      ...widget,
      label: t(widget.labelKey),
      description: t(widget.descriptionKey)
    })),
    [
      homeAssistantIntegration?.connected,
      homeAssistantIntegration?.enabled,
      homeAssistantIntegration?.selectedEntities?.length,
      t
    ]
  );
  const dashboardLayout = useDashboardLayout(
    activeMember?.id,
    'tablet',
    availableWidgets.map(widget => widget.id)
  );

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const todayKey = localDateKey(currentTime);
  // Montag-basierter Index verbindet Datenschlüssel und lokalisierte Anzeige.
  const weekdayIndex = (currentTime.getDay() + 6) % 7;
  const currentDayName = MEAL_PLAN_DAYS[weekdayIndex];
  const displayDayName = getWeekdayNames('long')[weekdayIndex];
  const householdName =
    activeHousehold === 'oma_opa'
      ? t('kitchen.household.omaOpa')
      : t('kitchen.household.default');
  const belongsToHousehold = item =>
    (item.household || 'familie') === activeHousehold;

  const todayEvents = useMemo(
    () =>
      events
        .filter(event => eventSpansToday(event, todayKey) && belongsToHousehold(event))
        .sort((left, right) =>
          String(left.time || '').localeCompare(String(right.time || ''))
        ),
    [activeHousehold, events, todayKey]
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
  const activeShopping = useMemo(
    () =>
      shoppingItems.filter(
        item =>
          item.isSelected &&
          !item.inCart &&
          belongsToHousehold(item)
      ),
    [activeHousehold, shoppingItems]
  );
  const pendingTasks = useMemo(
    () =>
      tasks
        .filter(task =>
          !task.completed &&
          taskIsVisibleOnDate(task) &&
          belongsToHousehold(task)
        )
        .sort((left, right) => {
          const dueDateOrder = String(left.dueDate || '9999-12-31')
            .localeCompare(String(right.dueDate || '9999-12-31'));
          if (dueDateOrder) return dueDateOrder;
          return String(left.title || '').localeCompare(String(right.title || ''));
        }),
    [activeHousehold, tasks]
  );
  const visibleTodayEvents = dashboardPreviewItems(
    todayEvents,
    dashboardLayout.layout.preferences?.tabletEventLimit
  );
  const visiblePendingTasks = dashboardPreviewItems(
    pendingTasks,
    dashboardLayout.layout.preferences?.tabletTaskLimit
  );
  const visibleNotes = useMemo(
    () =>
      notes.filter(
        note => note.isShared || belongsToHousehold(note)
      ),
    [activeHousehold, notes]
  );
  const groupMessages = useMemo(
    () =>
      chatMessages
        .filter(message => !message.target || message.target === 'group')
        .sort(
          (left, right) =>
            Number(right.timestamp || 0) - Number(left.timestamp || 0)
        ),
    [chatMessages]
  );
  const nextTrash = useMemo(
    () =>
      groupTrashEventsByDate(
        trashEvents.filter(
          item => item.date >= todayKey && belongsToHousehold(item)
        )
      )[0],
    [activeHousehold, todayKey, trashEvents]
  );
  const nextTrashTitle = trashGroupTitle(nextTrash);
  const effectiveDashboardLayout = dashboardLayoutForTrash(
    dashboardLayout.layout,
    nextTrash?.date,
    todayKey
  );

  const openQuickAdd = type => {
    setQuickAddDefaultType(type);
    setIsQuickAddOpen(true);
  };

  const handleTask = task => {
    if (task.completionStatus === 'pending_approval') return;
    const assigned = members.find(member => member.id === task.memberId);
    if (isManagedProfile(assigned) || assigned?.role === 'pet') {
      void toggleTask(task.id);
      return;
    }
    setTaskForCompletion(task);
  };

  const completionMembers = useMemo(() => {
    if (!taskForCompletion) return [];
    const allowedIds = taskForCompletion.assignmentMode === 'shared'
      ? new Set(taskForCompletion.eligibleMemberIds || [])
      : new Set([taskForCompletion.memberId]);
    return members.filter(member =>
      member.role !== 'pet' &&
      !isManagedProfile(member) &&
      (
        taskForCompletion.assignmentMode !== 'shared' ||
        !allowedIds.size ||
        allowedIds.has(member.id)
      ) &&
      (
        taskForCompletion.assignmentMode === 'shared' ||
        allowedIds.has(member.id)
      )
    );
  }, [members, taskForCompletion]);

  const completeTabletTask = async memberId => {
    const task = taskForCompletion;
    if (!task) return;
    setTaskForCompletion(null);
    await completeTaskAs(task.id, memberId);
  };

  return (
    <div className="tablet-command-center">
      <header className="tablet-command-hero">
        <div className="tablet-time-block">
          <span className="tablet-live-dot">{t('kitchen.live')}</span>
          <strong>
            {formatTime(currentTime, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </strong>
          <p>
            {formatDate(currentTime, {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>
        </div>
        <div className="tablet-home-status">
          <span><Home size={17} /> {householdName}</span>
          <strong>{t('kitchen.allInView')}</strong>
          <small>{t('kitchen.signedInAs', { name: activeMember?.name })}</small>
        </div>
        <div className="tablet-quick-actions">
          {!isWall && <button type="button" onClick={() => openQuickAdd('event')}>
            <Plus size={17} /> {t('kitchen.quickActions.event')}
          </button>}
          {!isWall && <button type="button" onClick={() => openQuickAdd('shopping')}>
            <Plus size={17} /> {t('kitchen.quickActions.shopping')}
          </button>}
          {!isWall && <button type="button" onClick={() => setActiveTab('dashboard')}>
            {t('kitchen.quickActions.standardView')} <ArrowUpRight size={16} />
          </button>}
          {!isWall && <button type="button" onClick={() => setIsCustomizerOpen(true)}>
            <SlidersHorizontal size={16} /> {t('kitchen.quickActions.tiles')}
          </button>}
        </div>
      </header>

      <OrderedDashboardGrid
        className="tablet-command-grid"
        layout={effectiveDashboardLayout}
      >
        <TabletCard
          widgetId="calendar"
          tab="calendar"
          icon={CalendarDays}
          title={t('kitchen.cards.calendar.title')}
          count={t('kitchen.cards.calendar.count', {
            count: todayEvents.length
          })}
          tone="calendar"
          onOpen={setActiveTab}
        >
          {todayEvents.length ? (
            <div className="tablet-event-list">
              {visibleTodayEvents.map(event => {
                const audience = eventAudienceMembers(event, members);
                const member = audience[0];
                const displayEvent = birthdayEventCopy(event, t);
                return (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => setActiveTab('calendar')}
                  >
                    <time>{event.time || t('kitchen.cards.calendar.allDay')}</time>
                    <span>
                      <strong>{displayEvent.title}</strong>
                      <small>
                        {displayEvent.location ||
                          audience.map(entry => entry.name).join(', ') ||
                          t('kitchen.cards.calendar.familyFallback')}
                      </small>
                    </span>
                    {member && (
                      <img
                        src={member.avatar || DEFAULT_FAMILY_AVATAR}
                        onError={handleImgError}
                        alt=""
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="tablet-empty">
              <CalendarDays size={24} />
              <span>{t('kitchen.cards.calendar.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="meals"
          tab="meals"
          icon={UtensilsCrossed}
          title={t('kitchen.cards.meals.title')}
          count={displayDayName}
          tone="meals"
          onOpen={setActiveTab}
        >
          {todayMeals.length ? (
            <div className="tablet-meal-list">
              {todayMeals.map(meal => (
                <button
                  type="button"
                  key={meal.id}
                  onClick={() => setActiveTab('meals')}
                >
                  <small>{meal.meal}</small>
                  <strong>{meal.recipe}</strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="tablet-empty">
              <UtensilsCrossed size={24} />
              <span>{t('kitchen.cards.meals.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="tasks"
          tab="tasks"
          icon={CheckSquare}
          title={t('kitchen.cards.tasks.title')}
          count={t('kitchen.cards.tasks.count', {
            count: pendingTasks.length
          })}
          tone="tasks"
          onOpen={setActiveTab}
        >
          {pendingTasks.length ? (
            <div className="tablet-task-list">
              {visiblePendingTasks.map(task => {
                const member = members.find(entry => entry.id === task.memberId);
                const pendingApproval =
                  task.completionStatus === 'pending_approval';
                return (
                  <button
                    type="button"
                    key={task.id}
                    onClick={() => handleTask(task)}
                  >
                    <span className={pendingApproval ? 'waiting' : ''}>
                      {pendingApproval ? <Clock3 size={15} /> : <Check size={15} />}
                    </span>
                    <span>
                      <strong>{task.title}</strong>
                      <small>
                        {pendingApproval
                          ? t('kitchen.cards.tasks.pendingApproval')
                          : task.assignmentMode === 'shared'
                            ? t('kitchen.cards.tasks.shared')
                            : member?.name}
                      </small>
                    </span>
                    <em><Star size={12} fill="currentColor" /> {task.stars}</em>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="tablet-empty">
              <Star size={24} />
              <span>{t('kitchen.cards.tasks.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="shopping"
          tab="shopping"
          icon={ShoppingBag}
          title={t('kitchen.cards.shopping.title')}
          count={t('kitchen.cards.shopping.count', {
            count: activeShopping.length
          })}
          tone="shopping"
          onOpen={setActiveTab}
        >
          {activeShopping.length ? (
            <div className="tablet-shopping-list">
              {activeShopping.slice(0, 6).map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={event => toggleShoppingInCart(item.id, event)}
                >
                  <span>{displayShoppingItemIcon(item.name, item.icon)}</span>
                  <strong>{item.name}</strong>
                  <small>{item.quantity || '1'}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="tablet-empty">
              <Check size={24} />
              <span>{t('kitchen.cards.shopping.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="chat"
          tab="chat"
          icon={MessageSquare}
          title={t('kitchen.cards.chat.title')}
          count={t('kitchen.cards.chat.count', {
            count: groupMessages.length
          })}
          tone="chat"
          onOpen={setActiveTab}
        >
          {groupMessages.length ? (
            <div className="tablet-chat-preview">
              {groupMessages.slice(0, 3).map(message => (
                <button
                  type="button"
                  key={message.id}
                  onClick={() => setActiveTab('chat')}
                >
                  <strong>
                    {message.senderName || t('kitchen.cards.chat.senderFallback')}
                  </strong>
                  <span>
                    {message.text ||
                      (message.photo
                        ? t('kitchen.cards.chat.photo')
                        : t('kitchen.cards.chat.newMessage'))}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="tablet-empty">
              <MessageSquare size={24} />
              <span>{t('kitchen.cards.chat.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="board"
          tab="board"
          icon={Pin}
          title={t('kitchen.cards.board.title')}
          count={t('kitchen.cards.board.count', {
            count: visibleNotes.length
          })}
          tone="board"
          onOpen={setActiveTab}
        >
          {visibleNotes.length ? (
            <div className="tablet-note-stack">
              {visibleNotes.slice(0, 3).map(note => (
                <button
                  type="button"
                  key={note.id}
                  onClick={() => setActiveTab('board')}
                >
                  <strong>{note.title}</strong>
                  <span>{note.content}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="tablet-empty">
              <Pin size={24} />
              <span>{t('kitchen.cards.board.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="trash"
          tab="trash"
          icon={Trash2}
          title={t('kitchen.cards.trash.title')}
          count={
            nextTrash
              ? shortDate(nextTrash.date)
              : t('kitchen.cards.trash.noDate')
          }
          tone="trash"
          onOpen={setActiveTab}
        >
          {nextTrash ? (
            <button
              type="button"
              className="tablet-trash-next"
              onClick={() => setActiveTab('trash')}
            >
              <span>🗑️</span>
              <strong>{nextTrashTitle}</strong>
              <small>{shortDate(nextTrash.date)}</small>
            </button>
          ) : (
            <div className="tablet-empty">
              <Trash2 size={24} />
              <span>{t('kitchen.cards.trash.empty')}</span>
            </div>
          )}
        </TabletCard>

        <TabletCard
          widgetId="family"
          tab="dashboard"
          icon={Users}
          title={t('kitchen.cards.family.title')}
          count={t('kitchen.cards.family.count', {
            count: members.length
          })}
          tone="family"
          onOpen={setActiveTab}
        >
          <div className="tablet-family-row">
            {members.slice(0, 6).map(member => (
              <button
                type="button"
                key={member.id}
                onClick={() => setActiveTab('dashboard')}
                title={member.name}
              >
                <img
                  src={member.avatar || DEFAULT_FAMILY_AVATAR}
                  onError={handleImgError}
                  alt=""
                />
                <strong>{member.name.split(' ')[0]}</strong>
                {isChildProfile(member) && (
                  <small><Star size={10} fill="currentColor" /> {member.stars || 0}</small>
                )}
              </button>
            ))}
          </div>
        </TabletCard>

        <DashboardWidget
          widgetId="home-assistant"
          className="tablet-command-card tablet-ha-card"
        >
          <HomeAssistantWidget
            compact
            title={t('kitchen.widgets.homeAssistant.label')}
          />
        </DashboardWidget>
      </OrderedDashboardGrid>

      {!isWall && <DashboardCustomizer
        isOpen={isCustomizerOpen}
        layout={dashboardLayout.layout}
        mode="tablet"
        moveWidget={dashboardLayout.moveWidget}
        onClose={() => setIsCustomizerOpen(false)}
        profileName={activeMember?.name?.split(' ')[0]}
        resetLayout={dashboardLayout.resetLayout}
        setDensity={dashboardLayout.setDensity}
        setPreference={dashboardLayout.setPreference}
        toggleWidget={dashboardLayout.toggleWidget}
        widgets={availableWidgets}
      />}

      {taskForCompletion && (
        <div
          className="modal-backdrop tablet-completer-backdrop"
          onClick={() => setTaskForCompletion(null)}
        >
          <section
            className="tablet-completer-dialog"
            onClick={event => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
          >
            <div className="tablet-completer-kicker">
              <CheckSquare size={18} />
              {t('kitchen.completeTask.kicker')}
            </div>
            <h2>{t('kitchen.completeTask.title')}</h2>
            <p>{taskForCompletion.title}</p>
            <div className="tablet-completer-grid">
              {completionMembers.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => completeTabletTask(member.id)}
                >
                  <img
                    src={member.avatar || DEFAULT_FAMILY_AVATAR}
                    alt=""
                    onError={handleImgError}
                  />
                  <strong>{member.name}</strong>
                  <small>{t('kitchen.completeTask.select')}</small>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setTaskForCompletion(null)}
            >
              {t('kitchen.completeTask.cancel')}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
