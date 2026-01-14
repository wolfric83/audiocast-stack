// eo-schedule.js
(function () {
  const getQueryParam = (window.EO && window.EO.getQueryParam)
    ? window.EO.getQueryParam
    : (name) => new URLSearchParams(window.location.search).get(name);

  const DEFAULT_SCHEDULE_URL = 'schedule.json';
  const SCHEDULE_URL = getQueryParam('src') || DEFAULT_SCHEDULE_URL;

  const roomParam = getQueryParam('room');
  const offsetDaysParam = parseInt(getQueryParam('offsetDays') || '0', 10);
  const $headerRoomTitle = document.getElementById('header-room-title');
  const $room = document.getElementById('session-room');
  const $title = document.getElementById('session-title');
  const $time = document.getElementById('session-time');
  const $speaker = document.getElementById('session-speaker');
  const $track = document.getElementById('session-track');
  const $location = document.getElementById('session-location');

  // If the schedule UI isn't on this page, do nothing.
  if (!$headerRoomTitle || !$room || !$title || !$time || !$speaker || !$track || !$location) return;

  // Update visible header/room immediately
  if (roomParam) {
    $headerRoomTitle.textContent = `Up Next - ${roomParam}`;
    $room.textContent = roomParam;
    $location.textContent = roomParam;
  }

  // Helpers
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtHHMM(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    return `${pad2(h)}:${pad2(m)}`;
  }
  function parseISO(s) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  function sessionMatchesRoom(item, roomName) {
    if (!roomName) return true;
    const r = item.room || '';
    const roomsArr = Array.isArray(item.rooms) ? item.rooms : [];
    const target = roomName.toLowerCase().trim();
    if (String(r).toLowerCase().trim() === target) return true;
    return roomsArr.some(x => String(x).toLowerCase().trim() === target);
  }
function findNextSession(items, roomName, now) {
  const IGNORE_KINDS = new Set([
    'morning tea',
    'room changeover',
    'lunch',
    'afternoon tea',
    'day end'
  ]);

  const filtered = items.filter(it => {
    if (it.cancelled) return false;
    if (!sessionMatchesRoom(it, roomName)) return false;

    const kind = String(it.kind || '').toLowerCase().trim();
    if (IGNORE_KINDS.has(kind)) return false;

    return true;
  });

  filtered.sort((a, b) => {
    const da = parseISO(a.start)?.getTime() || 0;
    const db = parseISO(b.start)?.getTime() || 0;
    return da - db;
  });

  for (const it of filtered) {
    const ds = parseISO(it.start);
    if (ds && ds.getTime() >= now.getTime()) return it;
  }

  return null;
}

  function setEmptyState(kind) {
    if (kind === 'no-data') {
      $title.textContent = 'No schedule data.';
    } else if (kind === 'no-upcoming') {
      $title.textContent = 'No upcoming session for this room.';
    } else {
      $title.textContent = 'Unable to load schedule.';
    }

    $time.textContent = 'â€”';
    $speaker.textContent = 'â€”';
    $track.textContent = 'â€”';
    $location.textContent = roomParam || 'â€”';
    $room.textContent = roomParam || 'â€”';
    $headerRoomTitle.textContent = `Schedule â€” ${roomParam || 'This Room'}`;
  }

  async function loadSchedule() {
    try {
      const res = await fetch(SCHEDULE_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch schedule JSON');
      const data = await res.json();

      // Root element has `schedule` which is an array of events
      const items = Array.isArray(data?.schedule) ? data.schedule : [];

      if (!items.length) {
        setEmptyState('no-data');
        return;
      }

      const now = new Date();
      
      if (!isNaN(offsetDaysParam) && offsetDaysParam !== 0) {
        now.setDate(now.getDate() + offsetDaysParam);
        console.log(`[EO] Time offset active: +${offsetDaysParam} days â†’ ${now.toISOString()}`);
      }

      const next = findNextSession(items, roomParam, now);

      if (!next) {
        setEmptyState('no-upcoming');
        return;
      }

      const start = parseISO(next.start);
      const end = parseISO(next.end);
      const firstAuthor =
        Array.isArray(next.authors) && next.authors.length
          ? (next.authors[0].name || '')
          : '';

      $title.textContent = next.name || 'Untitled session';
      $speaker.textContent = firstAuthor || 'â€”';
      $time.textContent = (start && end) ? `${fmtHHMM(start)} â€“ ${fmtHHMM(end)}` : 'â€”';
      $track.textContent = next.section_name || 'â€”';

      const displayRoom = next.room || roomParam || 'â€”';
      $location.textContent = displayRoom;
      $room.textContent = displayRoom;
      $headerRoomTitle.textContent = `Up Next - ${displayRoom}`;
    } catch (e) {
      console.error(e);
      setEmptyState('error');
    }
  }

  // Initial load + periodic refresh
  loadSchedule();
  setInterval(loadSchedule, 60_000);
})();
