import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlarmClock,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Coins,
  ExternalLink,
  Gift,
  Heart,
  Laugh,
  Meh,
  MessageCircle,
  Palette,
  PiggyBank,
  Play,
  Rocket,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Vote
} from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import {
  DEFAULT_MEMBER_AVATAR,
  handleImgError
} from '../../utils/imageFallback';
import { formatCurrency } from '../../utils/formatting';
import HomeAssistantWidget from './HomeAssistantWidget';
import MediaCover from './MediaCover';
import RewardIcon from '../Tasks/RewardIcon';
import { eventIsForMember } from '../../../shared/calendarAudience.js';
import { taskIsAvailableToMember } from '../../../shared/taskAssignments.js';
import { taskIsVisibleOnDate } from '../../../shared/taskVisibility.js';
import {
  birthdayEventCopy,
  nextBirthdayOccurrencesOnly
} from '../../../shared/birthdays.js';

// Die label-Werte werden als heroTitle im Profil gespeichert und bleiben
// deshalb deutsch – angezeigt wird die Übersetzung (child.worlds.*).
const CHILD_WORLDS = {
  space: { label: 'Raketenbasis', mascot: '🚀', buddy: '🛸' },
  unicorn: { label: 'Einhornland', mascot: '🦄', buddy: '🌈' },
  fairy: { label: 'Feenzauber', mascot: '🧚', buddy: '✨' },
  dino: { label: 'Dinowelt', mascot: '🦖', buddy: '🥚' },
  sunshine: { label: 'Sonneninsel', mascot: '☀️', buddy: '🏄' },
  adventure: { label: 'Helden-Camp', mascot: '🦸', buddy: '⚡' }
};

// Die ids werden gespeichert – die Anzeigetexte kommen aus child.moods.*.
const MOODS = [
  { id: 'super', emoji: '🤩', icon: Laugh },
  { id: 'gut', emoji: '😊', icon: Sun },
  { id: 'okay', emoji: '😐', icon: Meh },
  { id: 'hilfe', emoji: '🫶', icon: Heart }
];

const BUDDIES = ['🦊', '🐼', '🦁', '🐲', '🦄', '🤖', '🦖', '🧚'];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isInTimeWindow(start, end) {
  const [startHour, startMinute] = String(start || '00:00').split(':').map(Number);
  const [endHour, endMinute] = String(end || '00:00').split(':').map(Number);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const from = startHour * 60 + startMinute;
  const until = endHour * 60 + endMinute;
  return from === until
    ? true
    : from < until
      ? current >= from && current < until
      : current >= from || current < until;
}

export default function ChildDashboard() {
  const { t } = useTranslation('dashboard');
  const {
    activeMember,
    tasks,
    events,
    rewards,
    toggleTask,
    redeemReward,
    setActiveTab,
    addMoodCheckin,
    moodCheckins,
    dashboardLinks,
    dailyRoutines,
    savingsGoals,
    pocketMoneyTransactions,
    familyPolls,
    encouragements,
    familyMissions,
    familySettings,
    kidProfiles,
    homeAssistantEntities,
    toggleRoutineStep,
    voteFamilyPoll,
    toggleFamilyMission,
    updateKidProfile
  } = useFamily();
  const firstName = activeMember?.name?.split(' ')[0] || t('child.fallbackName');
  const stars = Number(activeMember?.stars || 0);
  const level = Math.floor(stars / 50) + 1;
  const levelProgress = stars % 50;
  const worldKey = CHILD_WORLDS[activeMember?.theme]
    ? activeMember.theme
    : 'adventure';
  const world = CHILD_WORLDS[worldKey];
  const allMyTasks = tasks.filter(
    task =>
      taskIsAvailableToMember(task, activeMember?.id) &&
      taskIsVisibleOnDate(task)
  );
  const myTasks = allMyTasks.filter(task => !task.completed);
  const completedMissions = allMyTasks.filter(task => task.completed).length;
  const missionProgress = allMyTasks.length
    ? Math.round((completedMissions / allMyTasks.length) * 100)
    : 100;
  const visibleRewards = rewards
    .filter(reward => {
      const target = reward.forMemberId || 'all';
      return target === 'all' || target === activeMember?.id;
    })
    .sort((a, b) => Number(a.costStars || 0) - Number(b.costStars || 0));
  const today = localDateKey();
  const upcomingEvents = nextBirthdayOccurrencesOnly(events, today)
    .filter(event => eventIsForMember(event, activeMember?.id))
    .filter(event => !event.date || event.date >= today)
    .sort((a, b) => `${a.date}${a.time || ''}`.localeCompare(`${b.date}${b.time || ''}`))
    .slice(0, 3);
  const latestMood = [...moodCheckins]
    .filter(checkin => checkin.memberId === activeMember?.id)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))[0];
  const myDashboardLinks = dashboardLinks.filter(
    link => link.memberId === activeMember?.id
  );
  const myRoutines = dailyRoutines.filter(
    routine =>
      routine.memberId === activeMember?.id &&
      routine.active !== false
  );
  const routineSteps = myRoutines.flatMap(routine => routine.steps || []);
  const completedRoutineSteps = myRoutines.reduce(
    (sum, routine) =>
      sum + new Set(routine.completions?.[today] || []).size,
    0
  );
  const nextRoutine = myRoutines.find(routine =>
    (routine.completions?.[today] || []).length < (routine.steps?.length || 0)
  );
  const nextRoutineStep = nextRoutine?.steps?.find(
    step => !(nextRoutine.completions?.[today] || []).includes(step.id)
  );
  const pocketBalance = pocketMoneyTransactions
    .filter(transaction => transaction.memberId === activeMember?.id)
    .reduce((sum, transaction) => sum + Number(transaction.amountCents || 0), 0);
  const savingGoal = savingsGoals.find(
    goal => goal.memberId === activeMember?.id
  );
  const savingPercent = savingGoal
    ? Math.min(100, Math.round((pocketBalance / savingGoal.targetCents) * 100))
    : 0;
  const activePoll = familyPolls
    .filter(poll => !poll.closesAt || poll.closesAt >= today)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))[0];
  const latestEncouragement = encouragements
    .filter(item => item.memberId === activeMember?.id)
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0))[0];
  const myFamilyMissions = familyMissions.filter(mission =>
    mission.memberIds?.includes(activeMember?.id)
  );
  const openFamilyMission = myFamilyMissions.find(
    mission => !mission.completedMemberIds?.includes(activeMember?.id)
  );
  const kidStyle = kidProfiles.find(
    profile => profile.memberId === activeMember?.id
  );
  const storedWorldKey = Object.keys(CHILD_WORLDS).find(
    key => CHILD_WORLDS[key].label === kidStyle?.heroTitle
  );
  const heroTitle = kidStyle?.heroTitle === 'Familienheld'
    ? t('child.hero.defaultTitle')
    : storedWorldKey
      ? t(`child.worlds.${storedWorldKey}.label`)
      : kidStyle?.heroTitle || t(`child.worlds.${worldKey}.label`);
  const nextEventCopy = birthdayEventCopy(upcomingEvents[0], t);
  const familyRules = familySettings[0] || null;
  const mediaAllowed =
    !familyRules?.mediaScheduleEnabled ||
    isInTimeWindow(familyRules.mediaStart, familyRules.mediaEnd);
  const earnedBadges = [
    completedMissions > 0,
    stars >= 50,
    completedRoutineSteps === routineSteps.length && routineSteps.length > 0,
    myFamilyMissions.some(mission =>
      mission.completedMemberIds?.includes(activeMember?.id)
    )
  ].filter(Boolean).length;

  return (
    <div className="child-dashboard">
      <section className="child-hero">
        <div className="child-hero-orbit orbit-one">✦</div>
        <div className="child-hero-orbit orbit-two">●</div>
        <div className="child-world-companions" aria-hidden="true">
          <span>{kidStyle?.buddy || world.buddy}</span>
          <span>{world.mascot}</span>
        </div>
        <div className="child-hero-copy">
          <span className="child-kicker">
            <Sparkles size={16} />{' '}
            {t('child.hero.kicker', {
              level,
              title: heroTitle
            })}
          </span>
          <h1>
            {t('child.hero.hey', { name: firstName })}{' '}
            {t(`child.worlds.${worldKey}.greeting`)}
          </h1>
          <p>{t('child.hero.intro', { count: myTasks.length })}</p>
          <div className="child-level-track">
            <span style={{ width: `${(levelProgress / 50) * 100}%` }} />
          </div>
          <small>
            {t('child.hero.starsToNextLevel', {
              count: 50 - levelProgress,
              level: level + 1
            })}
          </small>
          <div className="child-hero-metrics">
            <span>
              <b>{myTasks.length}</b>
              {t('child.hero.openMissions')}
            </span>
            <span>
              <b>{completedMissions}</b>
              {t('child.hero.done')}
            </span>
            <span>
              <b>{missionProgress}%</b>
              {t(`child.worlds.${worldKey}.mission`)}
            </span>
          </div>
        </div>
        <div className="child-hero-avatar">
          <span className="child-star-balance">
            <Star fill="currentColor" size={21} /> {stars}
          </span>
          {activeMember?.avatar ? (
            <img
              src={activeMember.avatar}
              onError={event => handleImgError(event, DEFAULT_MEMBER_AVATAR)}
              alt=""
            />
          ) : (
            <span className="child-hero-initial" aria-hidden="true">
              {firstName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="child-avatar-badge"><Trophy size={18} /></span>
        </div>
      </section>

      <section
        className="child-adventure-map"
        style={{ '--mission-progress': `${missionProgress}%` }}
      >
        <div className="child-map-emblem" aria-hidden="true">
          <span>{world.mascot}</span>
          <Rocket size={19} />
        </div>
        <div className="child-map-copy">
          <span className="child-section-kicker">{t('child.map.kicker')}</span>
          <h2>
            {allMyTasks.length
              ? t('child.map.progress', {
                  done: completedMissions,
                  total: allMyTasks.length
                })
              : t('child.map.freeDay')}
          </h2>
          <div
            className="child-map-track"
            role="progressbar"
            aria-label={t('child.map.progressAria')}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={missionProgress}
          >
            <span />
          </div>
        </div>
        <div className="child-map-goal">
          <span>{missionProgress === 100 ? '🏆' : '🎁'}</span>
          <small>
            {missionProgress === 100
              ? t('child.map.goalDone')
              : t('child.map.goalLabel')}
          </small>
          <strong>
            {missionProgress === 100
              ? t('child.map.unbeatable')
              : t('child.map.missionsToGoal', { count: myTasks.length })}
          </strong>
        </div>
      </section>

      <section className="child-today-deck">
        <button
          type="button"
          className="child-today-card routine"
          onClick={() => {
            if (nextRoutine && nextRoutineStep) {
              toggleRoutineStep(nextRoutine.id, nextRoutineStep.id, today);
            } else {
              setActiveTab('family-life');
            }
          }}
        >
          <span className="child-today-icon"><AlarmClock size={23} /></span>
          <span className="child-today-copy">
            <small>{t('child.today.routine.label')}</small>
            <strong>
              {nextRoutineStep?.title || (
                routineSteps.length
                  ? t('child.today.routine.allDone')
                  : t('child.today.routine.discover')
              )}
            </strong>
            <i>
              {t('child.today.routine.steps', {
                done: completedRoutineSteps,
                total: routineSteps.length || 0
              })}
            </i>
          </span>
          <span className="child-today-action">
            {nextRoutineStep ? <Check size={18} /> : <ChevronRight size={18} />}
          </span>
        </button>

        <button
          type="button"
          className="child-today-card saving"
          onClick={() => setActiveTab('family-life')}
        >
          <span className="child-today-icon"><PiggyBank size={23} /></span>
          <span className="child-today-copy">
            <small>{t('child.today.saving.label')}</small>
            <strong>{savingGoal?.title || t('child.today.saving.noGoal')}</strong>
            <i>
              {formatCurrency(pocketBalance / 100)}
              {savingGoal
                ? ` · ${t('child.today.saving.percentDone', { percent: savingPercent })}`
                : ''}
            </i>
          </span>
          <span className="child-today-action"><Coins size={18} /></span>
        </button>

        <button
          type="button"
          className="child-today-card badges"
          onClick={() => setActiveTab('family-life')}
        >
          <span className="child-today-icon"><BadgeCheck size={23} /></span>
          <span className="child-today-copy">
            <small>{t('child.today.badges.label')}</small>
            <strong>{t('child.today.badges.count', { count: earnedBadges })}</strong>
            <i>{t('child.today.badges.hint')}</i>
          </span>
          <span className="child-today-action"><Trophy size={18} /></span>
        </button>
      </section>

      {(latestEncouragement || openFamilyMission || activePoll) && (
        <section className="child-story-strip">
          {latestEncouragement && (
            <article className="child-mutmach-card">
              <span>{latestEncouragement.icon || '💛'}</span>
              <div>
                <small>
                  {t('child.story.encouragementFrom', {
                    name: latestEncouragement.createdByName ||
                      t('child.story.familyFallback')
                  })}
                </small>
                <strong>
                  {t('child.story.quote', { message: latestEncouragement.message })}
                </strong>
              </div>
            </article>
          )}
          {openFamilyMission && (
            <button
              type="button"
              className="child-family-mission-card"
              onClick={() => toggleFamilyMission(openFamilyMission.id)}
            >
              <span>{openFamilyMission.icon || '🤝'}</span>
              <div>
                <small>{t('child.story.togetherStrong')}</small>
                <strong>{openFamilyMission.title}</strong>
              </div>
              <i><Check size={17} /></i>
            </button>
          )}
          {activePoll && (
            <article className="child-quick-poll">
              <header>
                <Vote size={18} />
                <div><small>{t('child.story.pollKicker')}</small><strong>{activePoll.question}</strong></div>
              </header>
              <div>
                {activePoll.options?.slice(0, 4).map(option => (
                  <button
                    type="button"
                    key={option.id}
                    className={activePoll.votes?.[activeMember?.id] === option.id ? 'selected' : ''}
                    onClick={() => voteFamilyPoll(activePoll.id, option.id)}
                    title={option.label}
                  >
                    <span>{option.emoji}</span>
                    <small>{option.label}</small>
                  </button>
                ))}
              </div>
            </article>
          )}
        </section>
      )}

      <section className="child-mood-card">
        <div>
          <span className="child-section-kicker">{t('child.mood.kicker')}</span>
          <h2>{t('child.mood.title')}</h2>
          <p>
            {latestMood
              ? t('child.mood.checkedIn')
              : t('child.mood.prompt')}
          </p>
        </div>
        <div className="child-mood-options">
          {MOODS.map(mood => (
            <button
              key={mood.id}
              type="button"
              onClick={() => addMoodCheckin(mood.id)}
              className={latestMood?.mood === mood.id ? 'selected' : ''}
            >
              <span>{mood.emoji}</span>
              <strong>{t(`child.moods.${mood.id}`)}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="child-dashboard-grid">
        <section className="child-panel child-quests">
          <header>
            <div>
              <span className="child-section-kicker">{t('child.quests.kicker')}</span>
              <h2><Trophy size={22} /> {t('child.quests.title')}</h2>
            </div>
            <button onClick={() => setActiveTab('tasks')} type="button">
              {t('child.quests.viewAll')} <ChevronRight size={16} />
            </button>
          </header>
          <div className="child-quest-list">
            {myTasks.length ? (
              myTasks.slice(0, 5).map((task, index) => (
                <button
                  type="button"
                  className="child-quest"
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                >
                  <span className="child-quest-number">{index + 1}</span>
                  <span className="child-quest-copy">
                    <strong>{task.icon && <span aria-hidden="true">{task.icon} </span>}{task.title}</strong>
                    <small>{task.category || t('child.quests.defaultCategory')}</small>
                  </span>
                  <span className="child-quest-stars">
                    +{task.stars || 10} <Star size={15} fill="currentColor" />
                  </span>
                  <span className="child-quest-check"><Check size={18} /></span>
                </button>
              ))
            ) : (
              <div className="child-empty">
                <span>🏆</span>
                <strong>{t('child.quests.emptyTitle')}</strong>
                <p>{t('child.quests.emptyText')}</p>
              </div>
            )}
          </div>
        </section>

        <section className="child-panel child-rewards">
          <header>
            <div>
              <span className="child-section-kicker">{t('child.rewards.kicker')}</span>
              <h2><Gift size={22} /> {t('child.rewards.title')}</h2>
            </div>
            <button onClick={() => setActiveTab('tasks')} type="button">
              {t('child.rewards.shop')} <ChevronRight size={16} />
            </button>
          </header>
          <div className="child-reward-list">
            {visibleRewards.length ? (
              visibleRewards.slice(0, 3).map(reward => {
                const affordable = stars >= Number(reward.costStars || 0);
                return (
                  <article className="child-reward" key={reward.id}>
                    <RewardIcon
                      value={reward.icon}
                      image={reward.iconImage}
                      label={reward.title}
                    />
                    <div>
                      <strong>{reward.title}</strong>
                      <small>
                        <Star size={13} fill="currentColor" />
                        {t('child.rewards.cost', { count: Number(reward.costStars || 0) })}
                      </small>
                    </div>
                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() => redeemReward(reward, activeMember.id)}
                    >
                      {affordable
                        ? t('child.rewards.redeem')
                        : t('child.rewards.collect')}
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="child-empty compact">
                <span>🎁</span>
                <p>{t('child.rewards.empty')}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {myDashboardLinks.length > 0 && mediaAllowed && (
        <section className="child-media-club">
          <header>
            <div>
              <span className="child-section-kicker">{t('child.media.kicker')}</span>
              <h2><Play size={23} fill="currentColor" /> {t('child.media.title')}</h2>
            </div>
            <span className="child-safe-badge">{t('child.media.safeBadge')}</span>
          </header>
          <div className="child-media-grid">
            {myDashboardLinks.map((link, index) => {
              const isSpotify = link.kind === 'spotify';
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-kind={isSpotify ? 'spotify' : 'youtube'}
                  style={{
                    '--media-accent':
                      link.color || (isSpotify ? '#1db954' : '#ff4f55')
                  }}
                >
                  <MediaCover
                    link={link}
                    className="child-media-cover"
                    fallback={(
                      <span className="child-media-cover child-media-cover-fallback">
                        {link.title.trim().charAt(0).toUpperCase() || '♪'}
                      </span>
                    )}
                  />
                  <span className="child-media-cover-shade" aria-hidden="true" />
                  <span className="child-media-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="child-media-play">
                    <Play size={22} fill="currentColor" />
                  </span>
                  <span className="child-media-copy">
                    <small>
                      {isSpotify
                        ? t('child.media.spotifyPlaylist')
                        : t('child.media.youtubeChannel')}
                    </small>
                    <strong>{link.title}</strong>
                    <em>
                      {isSpotify
                        ? t('child.media.playMusic')
                        : t('child.media.playVideo')}
                    </em>
                  </span>
                  <ExternalLink className="child-media-external" size={18} />
                  <span className="child-media-provider" aria-hidden="true">
                    {isSpotify ? 'Spotify' : 'YouTube'}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {myDashboardLinks.length > 0 && !mediaAllowed && (
        <section className="child-media-rest">
          <span><Clock3 size={25} /></span>
          <div>
            <small>{t('child.media.pausedLabel')}</small>
            <strong>
              {t('child.media.pausedUntil', {
                time: familyRules?.mediaStart || '15:00'
              })}
            </strong>
          </div>
        </section>
      )}

      {homeAssistantEntities.length > 0 && (
        <HomeAssistantWidget
          className="child-home-assistant"
          title={t('child.homeControlsTitle')}
        />
      )}

      <section className="child-buddy-lab">
        <div>
          <span className="child-section-kicker">{t('child.buddy.kicker')}</span>
          <h2><Palette size={22} /> {t('child.buddy.title')}</h2>
          <p>{t('child.buddy.text')}</p>
        </div>
        <div className="child-buddy-options">
          {BUDDIES.map(buddy => (
            <button
              type="button"
              key={buddy}
              className={(kidStyle?.buddy || world.buddy) === buddy ? 'selected' : ''}
              onClick={() => updateKidProfile(activeMember.id, {
                buddy,
                heroTitle: kidStyle?.heroTitle || world.label
              })}
            >
              <span>{buddy}</span>
              {(kidStyle?.buddy || world.buddy) === buddy && <Check size={15} />}
            </button>
          ))}
        </div>
      </section>

      <section className="child-family-strip">
        <div className="child-family-card">
          <CalendarDays size={22} />
          <span>
            <small>{t('child.familyStrip.nextLabel')}</small>
            <strong>
              {nextEventCopy.title || t('child.familyStrip.nothingPlanned')}
            </strong>
          </span>
          <button type="button" onClick={() => setActiveTab('calendar')}>
            {t('child.familyStrip.calendar')} <ChevronRight size={15} />
          </button>
        </div>
        <div className="child-family-card coral">
          <MessageCircle size={22} />
          <span>
            <small>{t('child.familyStrip.chatLabel')}</small>
            <strong>{t('child.familyStrip.chatPrompt')}</strong>
          </span>
          <button type="button" onClick={() => setActiveTab('chat')}>
            {t('child.familyStrip.open')} <ChevronRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}
