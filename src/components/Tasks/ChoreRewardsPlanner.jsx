import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import {
  CheckSquare,
  Plus,
  Star,
  Gift,
  Check,
  Sparkles,
  User,
  Edit3,
  Trash2,
  X,
  Clock3,
  ShieldCheck,
  RotateCcw,
  CalendarDays,
  Repeat2
} from 'lucide-react';
import {
  canManageFamily,
  getPositionLabel,
  isChildProfile,
  isManagedProfile,
  isWallProfile
} from '../../constants/roles';
import { formatDate } from '../../utils/formatting';
import RewardIcon, { DEFAULT_REWARD_ICON } from './RewardIcon';
import RewardIconPicker from './RewardIconPicker';
import { taskIsVisibleOnDate } from '../../../shared/taskVisibility.js';

const REPEAT_RULES = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom'];
const TASK_CATEGORIES = ['Haushalt', 'Küche', 'Zimmer', 'Schule', 'Haustier', 'Garten'];
const CUSTOM_CATEGORY = '__custom__';

function formatTaskDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime())
    ? value
    : formatDate(date, {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      });
}

function currentLocalDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export default function ChoreRewardsPlanner() {
  const { t } = useTranslation('tasks');
  const {
    tasks, toggleTask, reviewTask, addTask, updateTask, deleteTask,
    rewards, addReward, updateReward, deleteReward, redeemReward,
    members, activeMember, activeHousehold, showToast
  } = useFamily();

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskMemberId, setTaskMemberId] = useState(members[0]?.id || '');
  const [taskStars, setTaskStars] = useState(15);
  const [taskCategory, setTaskCategory] = useState('Haushalt');
  const [taskDueDate, setTaskDueDate] = useState(
    currentLocalDate
  );
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskRepeatRule, setTaskRepeatRule] = useState('none');
  const [taskRepeatInterval, setTaskRepeatInterval] = useState(2);
  const [taskRepeatUnit, setTaskRepeatUnit] = useState('weeks');
  const [taskVisibilityDaysBefore, setTaskVisibilityDaysBefore] = useState(2);
  const [taskAssignmentMode, setTaskAssignmentMode] = useState('individual');
  const [taskEligibleMemberIds, setTaskEligibleMemberIds] = useState([]);
  const [taskRotationEnabled, setTaskRotationEnabled] = useState(false);
  const [taskRotationMemberIds, setTaskRotationMemberIds] = useState([]);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState(null);

  // Reward Creator / Editor State
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState(50);
  const [rewardIcon, setRewardIcon] = useState(DEFAULT_REWARD_ICON);
  const [rewardIconImage, setRewardIconImage] = useState('');
  const [rewardForMemberId, setRewardForMemberId] = useState('all');
  const selectedTaskMember = members.find(
    member => member.id === taskMemberId
  );
  const taskIsForManagedProfile =
    taskAssignmentMode !== 'shared' && isManagedProfile(selectedTaskMember);
  const taskAssignableMembers = members.filter(
    member => member.role !== 'pet' && !isManagedProfile(member)
  );

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskMemberId(activeMemberIdForTask());
    setTaskStars(15);
    setTaskCategory('Haushalt');
    setTaskDueDate(currentLocalDate());
    setTaskDueTime('');
    setTaskRepeatRule('none');
    setTaskRepeatInterval(2);
    setTaskRepeatUnit('weeks');
    setTaskVisibilityDaysBefore(2);
    setTaskAssignmentMode('individual');
    setTaskEligibleMemberIds(taskAssignableMembers.map(member => member.id));
    setTaskRotationEnabled(false);
    setTaskRotationMemberIds([]);
    setIsAddTaskOpen(true);
  };

  const activeMemberIdForTask = () =>
    members.find(member => member.id === activeMember?.id)?.id ||
    members[0]?.id ||
    '';

  const openEditTask = task => {
    setEditingTask(task);
    setTaskTitle(task.title || '');
    setTaskDescription(task.description || '');
    setTaskMemberId(task.memberId || members[0]?.id || '');
    setTaskStars(Number(task.stars ?? 15));
    setTaskCategory(task.category || 'Haushalt');
    setTaskDueDate(task.dueDate || '');
    setTaskDueTime(task.dueTime || '');
    setTaskRepeatRule(task.repeatRule || 'none');
    setTaskRepeatInterval(Math.max(1, Number(task.repeatInterval) || 2));
    setTaskRepeatUnit(task.repeatUnit || 'weeks');
    setTaskVisibilityDaysBefore(
      Number.isFinite(Number(task.visibilityDaysBefore))
        ? Number(task.visibilityDaysBefore)
        : 365
    );
    setTaskAssignmentMode(
      task.assignmentMode === 'shared' ? 'shared' : 'individual'
    );
    setTaskEligibleMemberIds(
      task.eligibleMemberIds?.length
        ? task.eligibleMemberIds
        : taskAssignableMembers.map(member => member.id)
    );
    setTaskRotationEnabled((task.rotationMemberIds?.length || 0) > 1);
    setTaskRotationMemberIds(task.rotationMemberIds || []);
    setConfirmDeleteTaskId(null);
    setIsAddTaskOpen(true);
  };

  const closeTaskModal = () => {
    setIsAddTaskOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const changes = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      memberId: taskMemberId,
      assignmentMode: taskAssignmentMode,
      eligibleMemberIds:
        taskAssignmentMode === 'shared' ? taskEligibleMemberIds : [],
      stars: taskIsForManagedProfile ? 0 : Number(taskStars),
      category: taskCategory,
      dueDate: taskDueDate,
      dueTime: taskDueTime,
      repeatRule: taskRepeatRule,
      repeatInterval: Number(taskRepeatInterval),
      repeatUnit: taskRepeatUnit,
      visibilityDaysBefore: Number(taskVisibilityDaysBefore),
      rotationMemberIds:
        taskAssignmentMode !== 'shared' &&
        !taskIsForManagedProfile &&
        taskRotationEnabled &&
        taskRepeatRule !== 'none'
          ? [
              taskMemberId,
              ...taskRotationMemberIds.filter(id => id !== taskMemberId)
            ]
          : []
    };

    const saved = editingTask
      ? await updateTask(editingTask.id, changes)
      : await addTask(changes);
    if (saved) closeTaskModal();
  };

  const handleOpenCreateReward = () => {
    setEditingReward(null);
    setRewardTitle('');
    setRewardCost(50);
    setRewardIcon(DEFAULT_REWARD_ICON);
    setRewardIconImage('');
    setRewardForMemberId('all');
    setIsRewardModalOpen(true);
  };

  const handleOpenEditReward = (reward) => {
    setEditingReward(reward);
    setRewardTitle(reward.title);
    setRewardCost(reward.costStars);
    setRewardIcon(reward.icon || DEFAULT_REWARD_ICON);
    setRewardIconImage(reward.iconImage || '');
    setRewardForMemberId(reward.forMemberId || 'all');
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = (e) => {
    e.preventDefault();
    if (!rewardTitle.trim()) return;

    if (editingReward) {
      updateReward(editingReward.id, {
        title: rewardTitle,
        costStars: Number(rewardCost),
        icon: rewardIcon,
        iconImage: rewardIconImage,
        forMemberId: rewardForMemberId
      });
    } else {
      addReward({
        title: rewardTitle,
        costStars: Number(rewardCost),
        icon: rewardIcon,
        iconImage: rewardIconImage,
        forMemberId: rewardForMemberId
      });
    }

    setIsRewardModalOpen(false);
  };

  const isParent = canManageFamily(activeMember);
  const isWall = isWallProfile(activeMember);
  const visibleMembers = isParent || isWall
    ? members.filter(member => !isWallProfile(member))
    : [activeMember].filter(Boolean);
  const today = currentLocalDate();
  const visibleTasks = tasks.filter(task =>
    (task.household || 'familie') === activeHousehold &&
    taskIsVisibleOnDate(task, today)
  );
  const scheduledTasks = isParent || isWall
    ? tasks.filter(task =>
        (task.household || 'familie') === activeHousehold &&
        !taskIsVisibleOnDate(task, today) &&
        !task.completed
      )
    : [];
  const categoryChoice = TASK_CATEGORIES.includes(taskCategory)
    ? taskCategory
    : CUSTOM_CATEGORY;
  const sharedTasks = tasks.filter(task => {
    if (
      task.assignmentMode !== 'shared' ||
      (task.household || 'familie') !== activeHousehold
    ) {
      return false;
    }
    if (isParent || isWall) return true;
    return (
      !task.eligibleMemberIds?.length ||
      task.eligibleMemberIds.includes(activeMember?.id)
    );
  }).filter(task => taskIsVisibleOnDate(task, today)).sort((left, right) => {
    if (Boolean(left.completed) !== Boolean(right.completed)) {
      return left.completed ? 1 : -1;
    }
    return String(left.dueDate || '9999-12-31').localeCompare(
      String(right.dueDate || '9999-12-31')
    );
  });
  const approvalsForMe = tasks.filter(
    task =>
      task.completionStatus === 'pending_approval' &&
      (
        !task.createdByMemberId ||
        !members.some(member => member.id === task.createdByMemberId) ||
        task.createdByMemberId === activeMember?.id
      )
  ).length;

  // Filter rewards: Parents see all rewards; Kids see rewards specifically for them or for 'all'
  const visibleRewards = rewards.filter(r => {
    if (isParent) return true;
    const target = r.forMemberId || 'all';
    return target === 'all' || target === activeMember.id;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* HEADER CARD */}
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ color: 'var(--primary)' }}>
            <CheckSquare size={24} /> {t('header.title')}
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {isParent && (
              <button className="btn-secondary" onClick={handleOpenCreateReward}>
                <Gift size={18} /> {t('header.createReward')}
              </button>
            )}
            {isParent && <button className="btn-primary" onClick={openCreateTask}>
              <Plus size={18} /> {t('header.assignTask')}
            </button>}
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {t('header.intro')}
        </p>
        {isParent && approvalsForMe > 0 && (
          <div className="task-approval-callout">
            <ShieldCheck size={18} />
            <strong>
              {t('header.approvalsWaiting', { count: approvalsForMe })}
            </strong>
          </div>
        )}
      </div>

      {sharedTasks.length > 0 && (
        <section className="card shared-task-card">
          <div className="shared-task-heading">
            <div className="shared-task-icon"><Sparkles size={21} /></div>
            <div>
              <h3>{t('shared.title')}</h3>
              <p>{t('shared.description')}</p>
            </div>
          </div>
          <div className="shared-task-list">
            {sharedTasks.map(task => {
              const isPending =
                task.completionStatus === 'pending_approval';
              const canReview =
                isParent &&
                isPending &&
                (
                  !task.createdByMemberId ||
                  !members.some(member => member.id === task.createdByMemberId) ||
                  task.createdByMemberId === activeMember?.id
                );
              const activeIsEligible =
                !task.eligibleMemberIds?.length ||
                task.eligibleMemberIds.includes(activeMember?.id);
              const canUseMainAction = isParent
                ? !isPending && (task.completed || activeIsEligible)
                : !task.completed;
              const reportedBy = members.find(
                member => member.id === task.completionRequestedByMemberId
              );
              return (
                <article
                  key={task.id}
                  className={`task-approval-item shared ${
                    task.completed ? 'completed' : ''
                  } ${isPending ? 'pending' : ''}`}
                >
                  <button
                    type="button"
                    className="task-approval-main"
                    onClick={() => toggleTask(task.id)}
                    disabled={isWall || !canUseMainAction}
                  >
                    <span className="task-status-mark">
                      {task.completed ? <Check size={17} /> :
                        isPending ? <Clock3 size={17} /> : <span />}
                    </span>
                    <span className="task-approval-copy">
                      <strong>{task.title}</strong>
                      {task.description && (
                        <span className="task-description">
                          {task.description}
                        </span>
                      )}
                      <small>
                        {task.completed
                          ? t('shared.completedBy', {
                              name:
                                task.completedByName ||
                                t('shared.someone')
                            })
                          : isPending
                            ? t('shared.reportedBy', {
                                name:
                                  reportedBy?.name ||
                                  t('shared.someone')
                              })
                            : t('shared.open')}
                      </small>
                    </span>
                    <span className="task-star-value">
                      <Star size={14} fill="#f59e0b" /> +{task.stars}
                    </span>
                  </button>
                  {isParent && (
                    <div className="task-manage-actions">
                      <button type="button" onClick={() => openEditTask(task)}>
                        <Edit3 size={14} /> {t('taskItem.edit')}
                      </button>
                      <button
                        type="button"
                        className={
                          confirmDeleteTaskId === task.id ? 'confirm' : ''
                        }
                        onClick={async () => {
                          if (confirmDeleteTaskId !== task.id) {
                            setConfirmDeleteTaskId(task.id);
                            return;
                          }
                          const deleted = await deleteTask(task.id);
                          if (deleted) setConfirmDeleteTaskId(null);
                        }}
                      >
                        <Trash2 size={14} />
                        {confirmDeleteTaskId === task.id
                          ? t('taskItem.confirmDelete')
                          : t('taskItem.delete')}
                      </button>
                    </div>
                  )}
                  {canReview && (
                    <div className="task-review-actions">
                      <button
                        type="button"
                        className="task-review-approve"
                        onClick={() => reviewTask(task.id, true)}
                      >
                        <Check size={16} /> {t('taskItem.approve')}
                      </button>
                      <button
                        type="button"
                        className="task-review-reject"
                        onClick={() => reviewTask(task.id, false)}
                      >
                        <RotateCcw size={15} /> {t('taskItem.reject')}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {(isParent || isWall) && scheduledTasks.length > 0 && (
        <details className="task-scheduled-details">
          <summary>
            <CalendarDays size={17} />
            {t('scheduled.title', { count: scheduledTasks.length })}
          </summary>
          <p>{t('scheduled.hint')}</p>
          <div className="task-scheduled-list">
            {scheduledTasks
              .sort((left, right) => String(left.dueDate || '').localeCompare(String(right.dueDate || '')))
              .map(task => (
                <button
                  type="button"
                  key={task.id}
                  onClick={isParent ? () => openEditTask(task) : undefined}
                  disabled={isWall}
                >
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.category || t('taskModal.categories.household')}</small>
                  </span>
                  <time>{formatTaskDate(task.dueDate)}</time>
                </button>
              ))}
          </div>
        </details>
      )}

      {/* SECTION 1: TASKS BY FAMILY MEMBER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {visibleMembers.map(member => {
          const memberTasks = visibleTasks.filter(
            task =>
              task.assignmentMode !== 'shared' &&
              task.memberId === member.id &&
              (task.household || 'familie') === activeHousehold
          ).sort((left, right) => {
            if (Boolean(left.completed) !== Boolean(right.completed)) {
              return left.completed ? 1 : -1;
            }
            return String(left.dueDate || '9999-12-31').localeCompare(
              String(right.dueDate || '9999-12-31')
            );
          });

          return (
            <div key={member.id} className="card" style={{ borderTop: `6px solid ${member.color || 'var(--primary)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={member.avatar} alt={member.name} className="avatar-img-sm" style={{ width: 44, height: 44 }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{member.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getPositionLabel(member)}</span>
                  </div>
                </div>

                {isManagedProfile(member) ? (
                  <div className="task-managed-badge">
                    <ShieldCheck size={16} /> {t('memberCard.managedOnly')}
                  </div>
                ) : (
                  <div style={{ background: 'color-mix(in srgb, var(--warning) 11%, var(--bg-elevated))', border: '1px solid color-mix(in srgb, var(--warning) 35%, var(--border-color))', color: 'var(--warning)', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={18} fill="#f59e0b" /> {member.stars || 0}★
                  </div>
                )}
              </div>

              {/* Task Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {memberTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {t('memberCard.noTasks', {
                      name: isManagedProfile(member)
                        ? member.name
                        : member.name.split(' ')[0]
                    })}
                  </div>
                ) : (
                  memberTasks.map(task => {
                    const isPending = task.completionStatus === 'pending_approval';
                    const creatorStillExists =
                      !task.createdByMemberId ||
                      members.some(member => member.id === task.createdByMemberId);
                    const canReview =
                      isParent &&
                      isPending &&
                      (!task.createdByMemberId ||
                        !creatorStillExists ||
                        task.createdByMemberId === activeMember?.id);
                    const canUseMainAction = isParent
                      ? !isPending
                      : !task.completed;
                    return (
                      <article
                        key={task.id}
                        className={`task-approval-item ${
                          task.completed ? 'completed' : ''
                        } ${isPending ? 'pending' : ''}`}
                      >
                        <button
                          type="button"
                          className="task-approval-main"
                          onClick={() => toggleTask(task.id)}
                          disabled={isWall || !canUseMainAction}
                          title={
                            isPending && !canReview
                              ? t('taskItem.reviewWaitingFor', {
                                  name:
                                    task.createdByName ||
                                    t('taskItem.fallbackCreator')
                                })
                              : undefined
                          }
                        >
                          <span className="task-status-mark">
                            {task.completed ? (
                              <Check size={17} />
                            ) : isPending ? (
                              <Clock3 size={17} />
                            ) : (
                              <span />
                            )}
                          </span>
                          <span className="task-approval-copy">
                            <strong>{task.title}</strong>
                            {task.description && (
                              <span className="task-description">{task.description}</span>
                            )}
                            <small>
                              {task.completed
                                ? t('taskItem.statusConfirmed')
                                : isPending
                                  ? t('taskItem.statusPendingWith', {
                                      name:
                                        task.createdByName ||
                                        t('taskItem.fallbackParent')
                                    })
                                  : isParent
                                    ? t('taskItem.statusCreatedBy', {
                                        name:
                                          task.createdByName ||
                                          t('taskItem.fallbackParent')
                                      })
                                    : t('taskItem.statusTapWhenDone')}
                            </small>
                            {(task.dueDate ||
                              (task.repeatRule &&
                                task.repeatRule !== 'none')) && (
                              <span className="task-schedule-row">
                                {task.dueDate && (
                                  <span>
                                    <CalendarDays size={12} />
                                    {formatTaskDate(task.dueDate)}
                                    {task.dueTime ? ` · ${task.dueTime}` : ''}
                                  </span>
                                )}
                                {task.repeatRule &&
                                  task.repeatRule !== 'none' && (
                                    <span>
                                      <Repeat2 size={12} />
                                      {REPEAT_RULES.includes(task.repeatRule)
                                        ? t(`repeat.${task.repeatRule}`)
                                        : t('repeat.recurring')}
                                    </span>
                                  )}
                                {task.rotationMemberIds?.length > 1 && (
                                  <span title={t('taskItem.rotationTitle')}>
                                    <RotateCcw size={12} />
                                    {t('taskItem.fairRotation', {
                                      count: task.rotationMemberIds.length
                                    })}
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                          {!isManagedProfile(member) && Number(task.stars) > 0 && (
                            <span className="task-star-value">
                              <Star size={14} fill="#f59e0b" /> +{task.stars}
                            </span>
                          )}
                        </button>

                        {isParent && (
                          <div className="task-manage-actions">
                            <button
                              type="button"
                              onClick={() => openEditTask(task)}
                              title={t('taskItem.edit')}
                            >
                              <Edit3 size={14} /> {t('taskItem.edit')}
                            </button>
                            <button
                              type="button"
                              className={confirmDeleteTaskId === task.id ? 'confirm' : ''}
                              onClick={async () => {
                                if (confirmDeleteTaskId !== task.id) {
                                  setConfirmDeleteTaskId(task.id);
                                  return;
                                }
                                const deleted = await deleteTask(task.id);
                                if (deleted) setConfirmDeleteTaskId(null);
                              }}
                              title={t('taskItem.delete')}
                            >
                              <Trash2 size={14} />
                              {confirmDeleteTaskId === task.id
                                ? t('taskItem.confirmDelete')
                                : t('taskItem.delete')}
                            </button>
                          </div>
                        )}

                        {canReview && (
                          <div className="task-review-actions">
                            <button
                              type="button"
                              className="task-review-approve"
                              onClick={() => reviewTask(task.id, true)}
                            >
                              <Check size={16} /> {t('taskItem.approve')}
                            </button>
                            <button
                              type="button"
                              className="task-review-reject"
                              onClick={() => reviewTask(task.id, false)}
                            >
                              <RotateCcw size={15} /> {t('taskItem.reject')}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION 2: PER-CHILD REWARDS SHOP */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, color: '#d97706', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gift size={24} /> {isChildProfile(activeMember)
            ? t('shop.titleForChild', { name: activeMember.name })
            : t('shop.title')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {visibleRewards.map(reward => {
            const targetChild = members.find(m => m.id === reward.forMemberId);

            return (
              <div
                key={reward.id}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <RewardIcon
                      value={reward.icon}
                      image={reward.iconImage}
                      label={reward.title}
                      size="large"
                    />
                    
                    {/* Edit & Delete Action Buttons for Parents */}
                    {isParent && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="icon-circle-btn"
                          style={{ width: 30, height: 30, background: 'var(--bg-elevated)' }}
                          onClick={() => handleOpenEditReward(reward)}
                          title={t('shop.editRewardTitle')}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="icon-circle-btn"
                          style={{ width: 30, height: 30, background: 'var(--bg-elevated)', color: 'var(--danger)' }}
                          onClick={() => deleteReward(reward.id)}
                          title={t('shop.deleteRewardTitle')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 4 }}>{reward.title}</h4>

                  {/* Child Specific Badge */}
                  <div style={{ marginBottom: 8 }}>
                    <span className="badge" style={{ background: targetChild ? targetChild.color : 'var(--primary)', color: 'white', fontSize: '0.75rem' }}>
                      {targetChild
                        ? t('shop.forChild', { name: targetChild.name })
                        : t('shop.forAllChildren')}
                    </span>
                  </div>

                  <div style={{ fontWeight: 800, color: '#d97706', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                    <Star size={16} fill="#f59e0b" /> {t('shop.requiresStars', { count: reward.costStars })}
                  </div>
                </div>

                {/* Redeem Button */}
                <button
                  className="btn-primary"
                  style={{ width: '100%', background: '#d97706', justifyContent: 'center' }}
                  onClick={() => redeemReward(reward, activeMember.id)}
                >
                  {t('shop.redeemFor', { name: activeMember.name.split(' ')[0] })}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE / EDIT REWARD MODAL */}
      {isRewardModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRewardModalOpen(false)}>
          <div className="modal-card reward-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h2 className="card-title">
                {editingReward ? t('rewardModal.editTitle') : t('rewardModal.createTitle')}
              </h2>
              <button className="icon-circle-btn" onClick={() => setIsRewardModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReward}>
              <div className="form-group">
                <label className="form-label">{t('rewardModal.titleLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('rewardModal.titlePlaceholder')}
                  value={rewardTitle}
                  onChange={e => setRewardTitle(e.target.value)}
                  required
                />
              </div>

              {/* Select Target Child / Member */}
              <div className="form-group">
                <label className="form-label">{t('rewardModal.forWhichChild')}</label>
                <select
                  className="form-select"
                  value={rewardForMemberId}
                  onChange={e => setRewardForMemberId(e.target.value)}
                >
                  <option value="all">{t('shop.forAllChildren')}</option>
                  {members.filter(isChildProfile).map(child => (
                    <option key={child.id} value={child.id}>{t('rewardModal.childOption', { name: child.name })}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('rewardModal.starCost')}</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  className="form-input"
                  value={rewardCost}
                  onChange={e => setRewardCost(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <span className="form-label">{t('rewardModal.imageLabel')}</span>
                <RewardIconPicker
                  value={rewardIcon}
                  image={rewardIconImage}
                  onChange={({ icon, iconImage }) => {
                    setRewardIcon(icon);
                    setRewardIconImage(iconImage);
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {t('common:actions.save')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsRewardModalOpen(false)}>
                  {t('common:actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isAddTaskOpen && (
        <div className="modal-backdrop" onClick={closeTaskModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h2 className="card-title">
                {editingTask ? t('taskModal.editTitle') : t('header.assignTask')}
              </h2>
              <button className="icon-circle-btn" onClick={closeTaskModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">{t('taskModal.taskLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('taskModal.taskPlaceholder')}
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('taskModal.descriptionLabel')}</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder={t('taskModal.descriptionPlaceholder')}
                  value={taskDescription}
                  onChange={event => setTaskDescription(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="task-assignment-toggle">
                  <input
                    type="checkbox"
                    checked={taskAssignmentMode === 'shared'}
                    onChange={event => {
                      const shared = event.target.checked;
                      setTaskAssignmentMode(shared ? 'shared' : 'individual');
                      if (shared && !taskEligibleMemberIds.length) {
                        setTaskEligibleMemberIds(
                          taskAssignableMembers.map(member => member.id)
                        );
                      }
                    }}
                  />
                  <span>
                    <strong>{t('taskModal.sharedToggle')}</strong>
                    <small>{t('taskModal.sharedHint')}</small>
                  </span>
                </label>
              </div>

              {taskAssignmentMode === 'shared' ? (
                <div className="form-group">
                  <label className="form-label">
                    {t('taskModal.eligibleProfiles')}
                  </label>
                  <div className="task-shared-members">
                    {taskAssignableMembers.map(member => {
                      const selected = taskEligibleMemberIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={selected ? 'selected' : ''}
                          onClick={() => setTaskEligibleMemberIds(previous =>
                            previous.includes(member.id)
                              ? previous.filter(id => id !== member.id)
                              : [...previous, member.id]
                          )}
                        >
                          <img src={member.avatar} alt="" />
                          <span>{member.name}</span>
                          {selected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                  <small className="form-hint">
                    {t('taskModal.eligibleHint')}
                  </small>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('taskModal.assignTo')}</label>
                  <select className="form-select" value={taskMemberId} onChange={e => setTaskMemberId(e.target.value)}>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({getPositionLabel(m)}
                        {isManagedProfile(m) ? t('taskModal.managedSuffix') : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="task-schedule-editor">
                <div className="task-schedule-editor-title">
                  <CalendarDays size={18} />
                  <div>
                    <strong>{t('taskModal.scheduleTitle')}</strong>
                    <span>
                      {t('taskModal.scheduleHint')}
                    </span>
                  </div>
                </div>
                <div className="task-schedule-fields">
                  <label className="form-group">
                    <span className="form-label">{t('taskModal.dueDate')}</span>
                    <input
                      type="date"
                      className="form-input"
                      value={taskDueDate}
                      onChange={event => setTaskDueDate(event.target.value)}
                      required={taskRepeatRule !== 'none'}
                    />
                  </label>
                  <label className="form-group">
                    <span className="form-label">{t('taskModal.dueTime')}</span>
                    <input
                      type="time"
                      className="form-input"
                      value={taskDueTime}
                      onChange={event => setTaskDueTime(event.target.value)}
                    />
                  </label>
                  <label className="form-group">
                    <span className="form-label">{t('taskModal.repeatLabel')}</span>
                    <select
                      className="form-select"
                      value={taskRepeatRule}
                      onChange={event =>
                        setTaskRepeatRule(event.target.value)
                      }
                    >
                      {REPEAT_RULES.map(value => (
                        <option key={value} value={value}>{t(`repeat.${value}`)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {taskRepeatRule === 'custom' && (
                  <div className="task-repeat-details">
                    <label className="form-group">
                      <span className="form-label">{t('taskModal.repeatEvery')}</span>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        max="365"
                        value={taskRepeatInterval}
                        onChange={event => setTaskRepeatInterval(event.target.value)}
                        required
                      />
                    </label>
                    <label className="form-group">
                      <span className="form-label">{t('taskModal.repeatUnit')}</span>
                      <select
                        className="form-select"
                        value={taskRepeatUnit}
                        onChange={event => setTaskRepeatUnit(event.target.value)}
                      >
                        <option value="days">{t('repeat.units.days')}</option>
                        <option value="weeks">{t('repeat.units.weeks')}</option>
                        <option value="months">{t('repeat.units.months')}</option>
                      </select>
                    </label>
                  </div>
                )}
                {taskRepeatRule !== 'none' && (
                  <label className="form-group task-visibility-field">
                    <span className="form-label">{t('taskModal.visibilityLabel')}</span>
                    <select
                      className="form-select"
                      value={taskVisibilityDaysBefore}
                      onChange={event => setTaskVisibilityDaysBefore(event.target.value)}
                    >
                      <option value="0">{t('taskModal.visibility.onDueDate')}</option>
                      <option value="1">{t('taskModal.visibility.oneDay')}</option>
                      <option value="2">{t('taskModal.visibility.twoDays')}</option>
                      <option value="3">{t('taskModal.visibility.threeDays')}</option>
                      <option value="7">{t('taskModal.visibility.oneWeek')}</option>
                      <option value="14">{t('taskModal.visibility.twoWeeks')}</option>
                      <option value="365">{t('taskModal.visibility.always')}</option>
                    </select>
                    <small className="form-hint">{t('taskModal.visibilityHint')}</small>
                  </label>
                )}
                {taskAssignmentMode !== 'shared' &&
                  taskRepeatRule !== 'none' && !taskIsForManagedProfile && (
                  <div className="task-rotation-editor">
                    <label>
                      <input
                        type="checkbox"
                        checked={taskRotationEnabled}
                        onChange={event => {
                          setTaskRotationEnabled(event.target.checked);
                          if (event.target.checked) {
                            setTaskRotationMemberIds(previous => [
                              ...new Set([taskMemberId, ...previous])
                            ]);
                          }
                        }}
                      />
                      <span>
                        <strong>{t('taskModal.rotationToggle')}</strong>
                        <small>
                          {t('taskModal.rotationHint')}
                        </small>
                      </span>
                    </label>
                    {taskRotationEnabled && (
                      <div className="task-rotation-members">
                        {members
                          .filter(
                            member =>
                              member.role !== 'pet' &&
                              !isManagedProfile(member)
                          )
                          .map(member => {
                            const selected =
                              member.id === taskMemberId ||
                              taskRotationMemberIds.includes(member.id);
                            return (
                              <button
                                key={member.id}
                                type="button"
                                className={selected ? 'selected' : ''}
                                onClick={() => {
                                  if (member.id === taskMemberId) return;
                                  setTaskRotationMemberIds(previous =>
                                    previous.includes(member.id)
                                      ? previous.filter(id => id !== member.id)
                                      : [...previous, member.id]
                                  );
                                }}
                              >
                                <span>{member.name.slice(0, 1)}</span>
                                {member.name}
                                {selected && <Check size={13} />}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('taskModal.category')}</label>
                <select
                  className="form-select"
                  value={categoryChoice}
                  onChange={event => setTaskCategory(
                    event.target.value === CUSTOM_CATEGORY ? '' : event.target.value
                  )}
                >
                  <option value="Haushalt">{t('taskModal.categories.household')}</option>
                  <option value="Küche">{t('taskModal.categories.kitchen')}</option>
                  <option value="Zimmer">{t('taskModal.categories.room')}</option>
                  <option value="Schule">{t('taskModal.categories.school')}</option>
                  <option value="Haustier">{t('taskModal.categories.pet')}</option>
                  <option value="Garten">{t('taskModal.categories.garden')}</option>
                  <option value={CUSTOM_CATEGORY}>{t('taskModal.categories.custom')}</option>
                </select>
                {categoryChoice === CUSTOM_CATEGORY && (
                  <input
                    type="text"
                    className="form-input task-custom-category"
                    value={taskCategory}
                    onChange={event => setTaskCategory(event.target.value)}
                    placeholder={t('taskModal.customCategoryPlaceholder')}
                    maxLength="80"
                    required
                  />
                )}
              </div>

              {taskIsForManagedProfile ? (
                <div className="managed-task-form-note">
                  <ShieldCheck size={18} />
                  <span>
                    <strong>{t('taskModal.managedNoteTitle')}</strong>
                    <small>
                      {t('taskModal.managedNoteHint')}
                    </small>
                  </span>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('taskModal.starsLabel')}</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    className="form-input"
                    value={taskStars}
                    onChange={e => setTaskStars(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editingTask ? t('taskModal.save') : t('taskModal.submit')}
                </button>
                <button type="button" className="btn-secondary" onClick={closeTaskModal}>
                  {t('common:actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
