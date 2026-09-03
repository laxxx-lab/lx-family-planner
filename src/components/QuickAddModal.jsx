import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../context/FamilyContext';
import { shoppingItemIcon } from '../../shared/shoppingItemIcons.js';
import {
  X,
  Calendar,
  ShoppingBag,
  CheckSquare,
  Pin,
  HeartHandshake
} from 'lucide-react';
import {
  canManageFamily,
  getPositionLabel,
  isManagedProfile
} from '../constants/roles';
import EventReminderPicker from './Calendar/EventReminderPicker';
import EventAudiencePicker from './Calendar/EventAudiencePicker';
import { useViewportScrollLock } from '../hooks/useViewportScrollLock';

function addLocalDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

export default function QuickAddModal() {
  const {
    isQuickAddOpen, setIsQuickAddOpen,
    quickAddDefaultType, setQuickAddDefaultType,
    quickAddEventPreset, setQuickAddEventPreset,
    members, activeMemberId, activeMember, familyRelationships,
    addEvent, addShoppingItem, addTask, addNote
  } = useFamily();
  const { t } = useTranslation('profile');
  const dialogRef = useRef(null);
  const didInitializeOpenRef = useRef(false);
  useViewportScrollLock(isQuickAddOpen);

  const [type, setType] = useState(quickAddDefaultType || 'event');

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [allDay, setAllDay] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memberId, setMemberId] = useState(activeMemberId);
  const [eventMemberIds, setEventMemberIds] = useState(
    activeMemberId ? [activeMemberId] : []
  );
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reminders, setReminders] = useState([60]);
  const [saving, setSaving] = useState(false);
  const shouldAutofocusTitle = Boolean(
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: fine)').matches
  );
  
  // Shopping specific
  const [category, setCategory] = useState('Obst & Gemüse');
  const [quantity, setQuantity] = useState('1 Stk');
  
  // Task specific
  const [stars, setStars] = useState(10);
  
  // Note specific
  const [noteColor, setNoteColor] = useState('#fef08a');
  const [recipientFamilyIds, setRecipientFamilyIds] = useState([]);
  const selectedMember = members.find(member => member.id === memberId);
  const taskIsForManagedProfile = isManagedProfile(selectedMember);
  const shareableFamilies = familyRelationships.filter(
    relationship =>
      relationship.status === 'accepted' &&
      relationship.grantsFromOther?.sharedCalendar
  );

  useEffect(() => {
    if (!isQuickAddOpen) {
      didInitializeOpenRef.current = false;
      return;
    }
    if (didInitializeOpenRef.current) return;
    didInitializeOpenRef.current = true;
    const preset = quickAddEventPreset || {};
    setType(quickAddDefaultType || 'event');
    setMemberId(activeMemberId || 'all');
    setEventMemberIds(activeMemberId ? [activeMemberId] : []);
    setDate(preset.date || new Date().toISOString().split('T')[0]);
    setTime(preset.time || '14:00');
    setAllDay(false);
    setEndDate(preset.endDate || '');
    setEndTime(preset.endTime || '');
    setQuickAddEventPreset(null);
  }, [
    activeMemberId,
    isQuickAddOpen,
    quickAddDefaultType,
    quickAddEventPreset,
    setQuickAddEventPreset
  ]);

  useEffect(() => {
    if (!isQuickAddOpen) return undefined;

    // iOS keeps dvh/svh at the app height while the keyboard is visible.
    // visualViewport is the actual visible area, so keep the scrollable dialog
    // inside it instead of leaving its actions behind the keyboard.
    const viewport = window.visualViewport;
    const updateAvailableHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      dialogRef.current?.style.setProperty(
        '--quick-add-available-height',
        `${Math.round(height)}px`
      );
    };

    updateAvailableHeight();
    viewport?.addEventListener('resize', updateAvailableHeight);
    viewport?.addEventListener('scroll', updateAvailableHeight);
    window.addEventListener('resize', updateAvailableHeight);

    return () => {
      viewport?.removeEventListener('resize', updateAvailableHeight);
      viewport?.removeEventListener('scroll', updateAvailableHeight);
      window.removeEventListener('resize', updateAvailableHeight);
    };
  }, [isQuickAddOpen]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      let created = null;
      if (type === 'event') {
        created = await addEvent({
          title,
          date,
          time: allDay ? '' : time,
          allDay,
          endDate: allDay && endDate ? addLocalDays(endDate, 1) : endDate,
          endTime: allDay ? '' : endTime,
          memberId: eventMemberIds[0] || 'all',
          memberIds: eventMemberIds,
          location,
          notes,
          category: 'Allgemein',
          reminders,
          recipientFamilyIds
        });
      } else if (type === 'shopping') {
        created = await addShoppingItem({
          name: title,
          category,
          quantity,
          icon: shoppingItemIcon(title)
        });
      } else if (type === 'task') {
        created = await addTask({
          title,
          memberId,
          stars: taskIsForManagedProfile ? 0 : Number(stars),
          category: 'Haushalt'
        });
      } else if (type === 'note') {
        created = await addNote({
          title,
          content: notes || title,
          color: noteColor
        });
      }
      if (!created) return;

      // Reset & close
      setTitle('');
      setLocation('');
      setNotes('');
      setReminders([60]);
      setAllDay(false);
      setEndDate('');
      setEndTime('');
      setRecipientFamilyIds([]);
      setEventMemberIds(activeMemberId ? [activeMemberId] : []);
      setIsQuickAddOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop quick-add-backdrop" onClick={() => setIsQuickAddOpen(false)}>
      <div
        ref={dialogRef}
        className="modal-card quick-add-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="card-header" style={{ marginBottom: 16 }}>
          <h2 className="card-title">{t('quickAdd.title')}</h2>
          <button className="icon-circle-btn" onClick={() => setIsQuickAddOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Type Selector Pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
          <button
            className={`cat-pill ${type === 'event' ? 'active' : ''}`}
            onClick={() => setType('event')}
          >
            <Calendar size={16} /> {t('quickAdd.types.event')}
          </button>
          <button
            className={`cat-pill ${type === 'shopping' ? 'active' : ''}`}
            onClick={() => setType('shopping')}
          >
            <ShoppingBag size={16} /> {t('quickAdd.types.shopping')}
          </button>
          <button
            className={`cat-pill ${type === 'task' ? 'active' : ''}`}
            onClick={() => setType('task')}
          >
            <CheckSquare size={16} /> {t('quickAdd.types.task')}
          </button>
          <button
            className={`cat-pill ${type === 'note' ? 'active' : ''}`}
            onClick={() => setType('note')}
          >
            <Pin size={16} /> {t('quickAdd.types.note')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {type === 'event' && t('quickAdd.titleLabels.event')}
              {type === 'shopping' && t('quickAdd.titleLabels.shopping')}
              {type === 'task' && t('quickAdd.titleLabels.task')}
              {type === 'note' && t('quickAdd.titleLabels.note')}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={t('quickAdd.titlePlaceholder')}
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus={shouldAutofocusTitle}
            />
          </div>

          {/* Event Fields */}
          {type === 'event' && (
            <>
              <label className="quick-add-all-day">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={event => {
                    setAllDay(event.target.checked);
                    if (event.target.checked) setEndTime('');
                  }}
                />
                <span>
                  <strong>{t('quickAdd.allDay')}</strong>
                  <small>{t('quickAdd.allDayHint')}</small>
                </span>
              </label>
              <div className="quick-add-event-time-grid">
                <div className="form-group">
                  <label className="form-label">{t('quickAdd.startsOn')}</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={event => {
                      setDate(event.target.value);
                      if (endDate && endDate < event.target.value) setEndDate('');
                    }}
                    required
                  />
                </div>
                {!allDay && (
                  <div className="form-group">
                    <label className="form-label">{t('quickAdd.startsAt')}</label>
                    <input type="time" className="form-input" value={time} onChange={e => setTime(e.target.value)} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">
                    {allDay ? t('quickAdd.endsOnInclusive') : t('quickAdd.endsOn')}
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    min={date}
                    value={endDate}
                    onChange={event => setEndDate(event.target.value)}
                  />
                </div>
                {!allDay && (
                  <div className="form-group">
                    <label className="form-label">{t('quickAdd.endsAt')}</label>
                    <input type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                )}
              </div>
              <EventReminderPicker
                value={reminders}
                onChange={setReminders}
              />
              <EventAudiencePicker
                members={members}
                value={eventMemberIds}
                onChange={setEventMemberIds}
              />
              <div className="form-group">
                <label className="form-label">{t('quickAdd.locationOptional')}</label>
                <input type="text" className="form-input" placeholder={t('quickAdd.locationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              {canManageFamily(activeMember) && shareableFamilies.length > 0 && (
                <div className="shared-event-picker">
                  <span>
                    <HeartHandshake size={15} />
                    {t('quickAdd.inviteFamilies')}
                  </span>
                  <div>
                    {shareableFamilies.map(relationship => {
                      const family = relationship.otherFamily;
                      const selected = recipientFamilyIds.includes(family.id);
                      return (
                        <button
                          type="button"
                          key={relationship.id}
                          className={selected ? 'active' : ''}
                          onClick={() => setRecipientFamilyIds(previous =>
                            selected
                              ? previous.filter(id => id !== family.id)
                              : [...previous, family.id]
                          )}
                        >
                          <span>{family.familyName.slice(0, 1)}</span>
                          {family.familyName}
                        </button>
                      );
                    })}
                  </div>
                  <small>
                    {t('quickAdd.inviteFamiliesHint')}
                  </small>
                </div>
              )}
            </>
          )}

          {/* Shopping Fields */}
          {type === 'shopping' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: taskIsForManagedProfile ? '1fr' : '1fr 1fr',
                gap: 12
              }}
            >
              <div className="form-group">
                <label className="form-label">{t('quickAdd.categoryLabel')}</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Obst & Gemüse">{t('quickAdd.shoppingCategories.produce')}</option>
                  <option value="Kühlung & Milch">{t('quickAdd.shoppingCategories.dairy')}</option>
                  <option value="Bäckerei">{t('quickAdd.shoppingCategories.bakery')}</option>
                  <option value="Vorräte">{t('quickAdd.shoppingCategories.pantry')}</option>
                  <option value="Getränke">{t('quickAdd.shoppingCategories.drinks')}</option>
                  <option value="Drogerie & Haushalt">{t('quickAdd.shoppingCategories.household')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('quickAdd.quantity')}</label>
                <input type="text" className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
            </div>
          )}

          {/* Task Fields */}
          {type === 'task' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">{t('quickAdd.assignedTo')}</label>
                <select className="form-select" value={memberId} onChange={e => setMemberId(e.target.value)}>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({getPositionLabel(m)}
                      {isManagedProfile(m) ? `, ${t('quickAdd.managed')}` : ''})
                    </option>
                  ))}
                </select>
              </div>
              {!taskIsForManagedProfile && (
                <div className="form-group">
                  <label className="form-label">{t('quickAdd.starPoints')}</label>
                  <input type="number" min="5" max="100" step="5" className="form-input" value={stars} onChange={e => setStars(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* Note Fields */}
          {type === 'note' && (
            <div className="form-group">
              <label className="form-label">{t('quickAdd.noteText')}</label>
              <textarea className="form-textarea" rows="3" placeholder={t('quickAdd.notePlaceholder')} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? t('common:status.saving') : t('common:actions.add')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() => setIsQuickAddOpen(false)}
            >
              {t('common:actions.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
