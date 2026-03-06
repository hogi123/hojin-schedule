
        // Data & State
        const PRESET_COLORS = [
            '#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e8baff',
            '#ff9999', '#ffcc99', '#ffff99', '#99ff99', '#99ccff', '#cc99ff',
            '#ff6666', '#ffb366', '#ffff66', '#66ff66', '#66b3ff', '#b366ff',
            '#ff3333', '#ff9933', '#ffff33', '#33ff33', '#3399ff', '#9933ff'
        ];

        let currentYear = 2026;
        let currentMonth = 0;
        let selectedDate = null;
        let activePaletteId = null; // Track open palette

        // Close palette if clicked outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.color-picker-wrapper')) {
                document.querySelectorAll('.palette-popup').forEach(p => p.classList.remove('show'));
                activePaletteId = null;
            }
        });

        let defaultColor = localStorage.getItem('defaultColor') || '#ffb3ba';
        let scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || {};
        let memoData = JSON.parse(localStorage.getItem('memoData')) || {};
        let dateMarks = JSON.parse(localStorage.getItem('dateMarks')) || {};

        // Initialize Settings Palette
        document.addEventListener('DOMContentLoaded', () => {
            const settingsPalette = document.getElementById('settings-palette');
            const settingsTrigger = document.getElementById('setting-default-color-trigger');

            PRESET_COLORS.forEach(colorHex => {
                const swatch = document.createElement('div');
                swatch.className = 'palette-color-item';
                swatch.style.backgroundColor = colorHex;
                swatch.onclick = (e) => {
                    e.stopPropagation();
                    defaultColor = colorHex;
                    settingsTrigger.style.backgroundColor = colorHex;
                    settingsPalette.classList.remove('show');
                    activePaletteId = null;
                };
                settingsPalette.appendChild(swatch);
            });

            settingsTrigger.style.backgroundColor = defaultColor;
        });

        // Save
        function saveSchedule() { localStorage.setItem('scheduleData', JSON.stringify(scheduleData)); }
        function saveMemo() { localStorage.setItem('memoData', JSON.stringify(memoData)); }
        function saveMarks() { localStorage.setItem('dateMarks', JSON.stringify(dateMarks)); }

        function saveSettings() {
            localStorage.setItem('defaultColor', defaultColor);
            renderCalendar();
            renderTodos();
            alert("저장되었습니다.");
        }

        function clearCurrentMonth() {
            if (!confirm(`${currentYear}년 ${currentMonth + 1}월의 모든 할 일 데이터를 초기화하시겠습니까?`)) return;

            // Clear days belonging to current month
            const yearMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
            Object.keys(scheduleData).forEach(key => {
                if (key.startsWith(yearMonthStr)) delete scheduleData[key];
            });

            // Clear memo for current month
            delete memoData[yearMonthStr];

            saveSchedule();
            saveMemo();
            renderCalendar();
            if (selectedDate && selectedDate.startsWith(yearMonthStr)) {
                renderTodos();
            }
            renderMemos();
            alert(`${currentYear}년 ${currentMonth + 1}월 초기화 완료`);
        }

        function switchView(viewName) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.getElementById('schedule-view').style.display = 'none';
            document.getElementById('settings-view').style.display = 'none';

            if (viewName === 'schedule') {
                document.getElementById('schedule-view').style.display = 'flex';
                document.getElementById('menu-schedule').classList.add('active');
            } else if (viewName === 'settings') {
                document.getElementById('settings-view').style.display = 'block';
                document.getElementById('menu-settings').classList.add('active');
            }
        }

        // Multi-click
        let clickCounts = {};
        let clickTimers = {};

        function onCellClick(e, dateStr) {
            if (e.target.tagName.toLowerCase() === 'input') return; // Ignore input clicks

            // Immediately switch the right panel view
            selectDate(dateStr);

            clickCounts[dateStr] = (clickCounts[dateStr] || 0) + 1;
            if (clickTimers[dateStr]) clearTimeout(clickTimers[dateStr]);

            clickTimers[dateStr] = setTimeout(() => {
                let count = clickCounts[dateStr];
                clickCounts[dateStr] = 0;

                if (count === 2) {
                    if (dateMarks[dateStr] === 'circle') delete dateMarks[dateStr];
                    else dateMarks[dateStr] = 'circle';
                    saveMarks();
                    renderCalendar();
                } else if (count >= 3) {
                    if (dateMarks[dateStr] === 'x') delete dateMarks[dateStr];
                    else dateMarks[dateStr] = 'x';
                    saveMarks();
                    renderCalendar();
                }
            }, 250);
        }

        // Render Calendar
        function renderCalendar() {
            const calendarEl = document.getElementById('calendar');
            calendarEl.innerHTML = '';

            document.getElementById('current-month').innerText = `${currentYear}년 ${currentMonth + 1}월`;

            const days = ['일', '월', '화', '수', '목', '금', '토'];
            days.forEach((d, index) => {
                const cel = document.createElement('div');
                cel.className = 'day-header';
                if (index === 0) cel.classList.add('sunday');
                if (index === 6) cel.classList.add('saturday');
                cel.innerText = d;
                calendarEl.appendChild(cel);
            });

            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);

            for (let i = 0; i < firstDay.getDay(); i++) {
                const cel = document.createElement('div');
                cel.className = 'calendar-cell empty';
                cel.style.pointerEvents = 'none';
                cel.style.backgroundColor = '#f9f9f9';
                calendarEl.appendChild(cel);
            }

            for (let d = 1; d <= lastDay.getDate(); d++) {
                const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

                const cel = document.createElement('div');
                cel.className = 'calendar-cell';
                if (dateKey === selectedDate) cel.classList.add('selected');

                const now = new Date();
                if (currentYear === now.getFullYear() && currentMonth === now.getMonth() && d === now.getDate()) {
                    cel.classList.add('today');
                }

                let markClass = '';
                if (dateMarks[dateKey] === 'circle') markClass = 'mark-circle';
                else if (dateMarks[dateKey] === 'x') markClass = 'mark-x';

                cel.onclick = (e) => onCellClick(e, dateKey);

                let html = `<div class="day-number-container"><div class="day-number ${markClass}">${d}</div></div><div class="events-container">`;

                const tasks = scheduleData[dateKey] || [];
                tasks.forEach(t => {
                    if (t.text) {
                        let bg = t.color || defaultColor;
                        let fontColor = '#000';
                        let border = `1px solid ${bg}`;
                        let textDecor = t.checked ? 'line-through' : 'none';
                        let opacity = t.checked ? '0.5' : '1';
                        html += `<div class="event-pill" style="background:${bg}; color:${fontColor}; border:${border}; text-decoration:${textDecor}; opacity:${opacity};">${t.text}</div>`;
                    }
                });

                html += `</div>`;
                cel.innerHTML = html;
                calendarEl.appendChild(cel);
            }
        }

        // Render Memos
        function renderMemos() {
            const memoMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
            document.getElementById('memo-month-title').innerText = `${currentMonth + 1}월 목표`;

            if (!memoData[memoMonthKey]) {
                memoData[memoMonthKey] = Array(8).fill(''); // Reduced to 8 lines to save space
            }
            const memos = memoData[memoMonthKey];
            const memoLinesEl = document.getElementById('memo-lines');
            memoLinesEl.innerHTML = '';

            memos.forEach((memo, index) => {
                if (index >= 8) return;
                const div = document.createElement('div');
                div.className = 'memo-line';
                const input = document.createElement('input');
                input.type = 'text';
                input.value = memo;
                input.placeholder = `목표 ${index + 1}`;
                input.onblur = (e) => {
                    memoData[memoMonthKey][index] = e.target.value;
                    saveMemo();
                };
                input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
                div.appendChild(input);
                memoLinesEl.appendChild(div);
            });
        }

        let dragItemIndex = null;

        // Render Todos
        function renderTodos() {
            if (!selectedDate) return;
            document.getElementById('selected-date-title').innerText = selectedDate;
            const todoListEl = document.getElementById('todo-list');
            todoListEl.innerHTML = '';

            if (!scheduleData[selectedDate]) {
                scheduleData[selectedDate] = Array(10).fill().map(() => ({ text: '', checked: false, color: null }));
            }
            const tasks = scheduleData[selectedDate];

            tasks.forEach((task, index) => {
                if (index >= 10) return;

                const li = document.createElement('li');
                li.className = 'todo-item';
                li.draggable = true;

                li.ondragstart = (e) => {
                    dragItemIndex = index;
                    li.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                };
                li.ondragend = () => {
                    li.classList.remove('dragging');
                    dragItemIndex = null;
                };
                li.ondragover = (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                };
                li.ondrop = (e) => {
                    e.preventDefault();
                    if (dragItemIndex === null || dragItemIndex === index) return;
                    let targetList = scheduleData[selectedDate];
                    let draggedItem = targetList.splice(dragItemIndex, 1)[0];
                    targetList.splice(index, 0, draggedItem);

                    while (targetList.length < 10) {
                        targetList.push({ text: '', checked: false, color: null });
                    }
                    scheduleData[selectedDate] = targetList.slice(0, 10);

                    saveSchedule();
                    renderTodos();
                    renderCalendar();
                };

                let effectiveColor = task.color || defaultColor;
                if (task.checked) {
                    li.style.borderLeftColor = effectiveColor;
                    li.style.backgroundColor = effectiveColor + '30';
                } else {
                    li.style.borderLeftColor = '#eee';
                    li.style.backgroundColor = '#f9f9f9';
                }

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'todo-checkbox';
                checkbox.checked = task.checked;
                checkbox.onchange = () => {
                    task.checked = checkbox.checked;
                    saveSchedule();
                    renderTodos();
                    renderCalendar();
                };

                const input = document.createElement('input');
                input.type = 'text';
                input.className = `todo-input ${task.checked ? 'completed' : ''}`;
                input.value = task.text;
                input.placeholder = "할 일을 입력하세요";
                input.onblur = (e) => {
                    task.text = e.target.value;
                    saveSchedule();
                    renderCalendar();
                };
                input.oninput = (e) => {
                    task.text = e.target.value;
                    renderCalendar();
                };
                input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };

                // Custom Color Picker Wrapper
                const colorPickerWrapper = document.createElement('div');
                colorPickerWrapper.className = 'color-picker-wrapper';

                const swatchTrigger = document.createElement('div');
                swatchTrigger.className = 'swatch-trigger';
                swatchTrigger.style.backgroundColor = task.color || defaultColor;
                swatchTrigger.title = "항목 색상 변경";

                const palettePopup = document.createElement('div');
                palettePopup.className = 'palette-popup';
                const popupId = 'palette-' + index;
                palettePopup.id = popupId;

                swatchTrigger.onclick = (e) => {
                    togglePalette(popupId);
                };

                PRESET_COLORS.forEach(colorHex => {
                    const swatch = document.createElement('div');
                    swatch.className = 'palette-color-item';
                    swatch.style.backgroundColor = colorHex;
                    swatch.onclick = (e) => {
                        e.stopPropagation(); // Prevent document click from closing immediately before processing
                        task.color = colorHex;
                        swatchTrigger.style.backgroundColor = colorHex;
                        palettePopup.classList.remove('show');
                        activePaletteId = null;

                        saveSchedule();
                        renderTodos();
                        renderCalendar(); // React immediately
                    };
                    palettePopup.appendChild(swatch);
                });

                colorPickerWrapper.appendChild(swatchTrigger);
                colorPickerWrapper.appendChild(palettePopup);

                li.appendChild(checkbox);
                li.appendChild(input);
                li.appendChild(colorPickerWrapper);
                todoListEl.appendChild(li);
            });
        }

        function togglePalette(paletteId) {
            const popup = document.getElementById(paletteId);
            // Close any currently open palette
            document.querySelectorAll('.palette-popup').forEach(p => {
                if (p.id !== paletteId) p.classList.remove('show');
            });

            if (popup.classList.contains('show')) {
                popup.classList.remove('show');
                activePaletteId = null;
            } else {
                popup.classList.add('show');
                activePaletteId = paletteId;
            }
        }

        // Setup & Nav
        function selectDate(dateStr) {
            selectedDate = dateStr;
            renderCalendar();
            renderTodos();
        }

        function changeMonth(delta) {
            currentMonth += delta;
            if (currentMonth > 11) { currentMonth = 0; currentYear++; }
            else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
            renderCalendar();
            renderMemos();
        }

        function goToToday() {
            const now = new Date();
            currentYear = 2026;
            currentMonth = 0;
            if (now.getFullYear() === 2026) {
                currentMonth = now.getMonth();
                const dKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                selectDate(dKey);
            } else {
                selectDate('2026-01-01');
            }
            renderMemos();
        }

        // Init
        goToToday();
    